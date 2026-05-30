import { http } from '@/utils/http'

export async function getCaptcha() {
  return http.get('/api/auth/captcha')
}

export async function login({ phone, password, captchaId, captchaCode }) {
  return http.post('/api/auth/login', {
    body: {
      userName: phone,
      password,
      captchaId,
      captchaCode,
    },
  })
}
