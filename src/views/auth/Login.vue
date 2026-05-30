<template>
  <div class="page">
    <div class="card auth-card">
      <div class="brand">
        <div class="logo" aria-hidden="true">YS</div>
        <div>
          <div class="title">于舒爱 · Chat</div>
          <div class="subtitle">登录后继续使用</div>
        </div>
      </div>

      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <div class="label">手机号</div>
          <input
            v-model.trim="phone"
            class="input"
            placeholder="输入 11 位手机号"
            autocomplete="tel"
            inputmode="tel"
            maxlength="11"
          />
        </div>

        <div class="field">
          <div class="label">密码</div>
          <div class="password-row">
            <input
              v-model="password"
              class="input password-input"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入至少 8 位密码"
              autocomplete="current-password"
            />
            <button
              class="password-toggle"
              type="button"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              :title="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>

        <div class="field">
          <div class="label">图形验证码</div>
          <div class="captcha-row">
            <input
              v-model.trim="captchaCode"
              class="input"
              placeholder="输入验证码"
              maxlength="8"
              autocomplete="off"
            />
            <button
              class="captcha-button"
              type="button"
              :disabled="captchaLoading"
              title="点击刷新验证码"
              @click="loadCaptcha"
            >
              <img
                v-if="captchaImage"
                :src="captchaImage"
                class="captcha-img"
                alt="图形验证码"
              />
              <span v-else>{{ captchaLoading ? '加载中' : '刷新验证码' }}</span>
            </button>
          </div>
        </div>

        <button class="btn primary login-button" type="submit" :disabled="loading || !canSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCaptcha, login } from '@/api/auth/authService'
import { setMe, setToken } from '@/utils/auth'

const PHONE_PATTERN = /^1[3-9]\d{9}$/
const DEFAULT_REDIRECT = '/other/home'

const router = useRouter()
const route = useRoute()

const phone = ref('')
const password = ref('')
const captchaId = ref('')
const captchaCode = ref('')
const captchaImage = ref('')
const captchaLoading = ref(false)
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const canSubmit = computed(() => {
  return (
    PHONE_PATTERN.test(phone.value) &&
    password.value.length >= 8 &&
    !!captchaId.value &&
    !!captchaCode.value
  )
})

function isSafeRedirectPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function getRedirectPath() {
  const redirect = route.query.redirect
  return isSafeRedirectPath(redirect) ? redirect : DEFAULT_REDIRECT
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`
}

function normalizeCaptcha(res) {
  const image = res?.imageBase64 || res?.image || res?.captchaUrl || res?.img || ''
  const svg = res?.captchaSvg || res?.svg || ''

  return {
    captchaId: res?.captchaId || res?.key || res?.id || '',
    image: svg ? svgToDataUrl(svg) : image,
  }
}

function normalizeLoginResult(res) {
  return {
    token: res?.token || res?.accessToken || res?.jwt || '',
    me: res?.me || res?.user || res?.profile || null,
  }
}

async function loadCaptcha() {
  if (captchaLoading.value) return

  captchaLoading.value = true
  try {
    const res = await getCaptcha()
    const captcha = normalizeCaptcha(res)

    captchaId.value = captcha.captchaId
    captchaImage.value = captcha.image
    captchaCode.value = ''

    if (!captchaId.value || !captchaImage.value) {
      throw new Error('验证码响应格式不正确，请稍后重试')
    }
  } catch (e) {
    captchaId.value = ''
    captchaImage.value = ''
    error.value = e?.message || '验证码加载失败，请刷新重试'
  } finally {
    captchaLoading.value = false
  }
}

function validateForm() {
  if (!phone.value) return '请输入手机号'
  if (!PHONE_PATTERN.test(phone.value)) return '请输入正确的中国大陆手机号'
  if (!password.value) return '请输入密码'
  if (password.value.length < 8) return '密码至少需要 8 位'
  if (!captchaId.value) return '验证码已失效，请刷新后重试'
  if (!captchaCode.value) return '请输入图形验证码'
  return ''
}

async function onSubmit() {
  error.value = ''

  const validationError = validateForm()
  if (validationError) {
    error.value = validationError
    if (!captchaId.value) await loadCaptcha()
    return
  }

  loading.value = true
  try {
    const res = await login({
      phone: phone.value,
      password: password.value,
      captchaId: captchaId.value,
      captchaCode: captchaCode.value,
    })
    const { token, me } = normalizeLoginResult(res)

    if (!token) {
      throw new Error('登录响应缺少 token')
    }

    setToken(token)
    if (me) setMe(me)

    await router.push(getRedirectPath())
  } catch (e) {
    error.value = e?.message || '登录失败，请检查手机号、密码和验证码'
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCaptcha()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(58, 92, 168, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.12), transparent 26%),
    var(--app-bg);
}

.auth-card {
  width: min(420px, 100%);
  padding: 20px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 2px 18px;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  display: grid;
  place-items: center;
  color: var(--text-1);
  font-size: 13px;
  font-weight: 700;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}

.subtitle {
  font-size: 12px;
  color: var(--text-3);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.password-row,
.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 10px;
  align-items: center;
}

.password-input {
  width: 100%;
}

.password-toggle,
.captcha-button {
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-2);
  background: #0f172a;
  cursor: pointer;
}

.password-toggle:hover,
.captcha-button:hover {
  border-color: rgba(230, 237, 243, 0.22);
}

.captcha-button {
  width: 96px;
  overflow: hidden;
  padding: 0;
}

.captcha-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.captcha-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.login-button {
  width: 100%;
}

.error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 107, 107, 0.25);
  background: rgba(255, 107, 107, 0.06);
  color: rgba(255, 107, 107, 0.95);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 480px) {
  .page {
    padding: 16px;
  }

  .auth-card {
    padding: 16px;
  }

  .password-row,
  .captcha-row {
    grid-template-columns: 1fr;
  }

  .password-toggle,
  .captcha-button {
    width: 100%;
  }
}
</style>
