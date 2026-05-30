<template>
  <div class="site-layout" :class="{ 'is-not-found': isNotFound }">
    <header class="site-header">
      <RouterLink class="site-brand" to="/" aria-label="于舒爱 home">
        <img class="site-brand-logo" src="/favicon.ico" alt="" />
        <span class="site-brand-name">YuShuai</span>
      </RouterLink>

      <nav class="site-nav" aria-label="Main navigation">
        <template v-for="item in navItems" :key="item.label">
          <a
            v-if="item.external"
            class="site-nav-link"
            :href="item.to"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ item.label }}
          </a>

          <RouterLink
            v-else
            class="site-nav-link"
            :class="{ 'is-active': isNavActive(item) }"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>
    </header>

    <main class="site-container">
      <slot>
        <RouterView />
      </slot>
    </main>

    <footer class="site-footer">
      <span>© 2026 yushuai All Rights Reserved</span>
      <span class="site-footer-divider">|</span>
      <a
        class="site-footer-link"
        href="https://beian.miit.gov.cn/#/Integrated/recordQuery"
        target="_blank"
        rel="noopener noreferrer"
      >
        沪ICP备2025127489号-1
      </a>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: '案例', to: '/demo', match: ['/demo'] },
  { label: '博客', to: '/blog', match: ['/blog'] },
  { label: '留言', to: '/guestbook', match: ['/guestbook'] },
  { label: '其它', to: '/other/home', match: ['/other', '/app'] },
  { label: '关于', to: '/about', match: ['/about'] },
  { label: 'AI', to: 'https://chat.yushuai.online', external: true },
]

const isNotFound = computed(() => route.name === 'NotFound')

function isNavActive(item) {
  if (isNotFound.value || item.external || !item.match) return false
  return item.match.some((path) => route.path === path || route.path.startsWith(`${path}/`))
}
</script>

<style scoped>
.site-layout {
  --site-header-height: 70px;
  --site-footer-height: 85px;
  min-height: 100vh;
  padding-top: var(--site-header-height);
  background: #08080c;
  color: #fff;
}

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: var(--site-header-height);
  padding: 0 12vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: rgba(15, 15, 22, 0.95);
  border-bottom: 1px solid #1f1f2e;
  backdrop-filter: blur(8px);
}

.site-brand {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #40b4ff;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.site-brand-logo {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: contain;
}

.site-brand-name {
  /* 1. 设置渐变背景（方向：从左下到右上，完美契合星球的纹理走向） */
  background: linear-gradient(
    45deg,          /* 核心修改：45度表示从左下角指向右上角 */
    #f2b5db 0%,    /* 左下角：浅粉紫 */
    #9b6bfa 25%,   /* 梦幻紫 */
    #3b52ec 50%,   /* 中间：深宝蓝 */
    #4ccaf6 80%,   /* 明亮的浅蓝 */
    #abf3ff 100%   /* 右上角：浅冰蓝 */
  );

  /* 2. 核心：将背景裁剪为文字形状 */
  -webkit-background-clip: text;
  background-clip: text;

  /* 3. 核心：将文字颜色设为透明，露出背后的渐变色 */
  -webkit-text-fill-color: transparent;
  color: transparent;

  /* 可选：为了让渐变字更清晰，可以加粗加大一点 */
  font-weight: 700;
  font-size: 22px; 
  margin-bottom: 3px;
  display: inline-block; /* 确保背景渐变能正确渲染 */
}

.site-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 30px;
  min-width: 0;
}

.site-nav-link {
  padding: 0;
  color: #ccc;
  font-size: 15px;
  line-height: var(--site-header-height);
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.site-nav-link:hover,
.site-nav-link.is-active {
  color: #40b4ff;
}

.site-container {
  width: 100%;
  min-height: calc(100vh - 70px - 145px);
  margin: 0 auto;
  padding: 40px 15vw;
}

.site-footer {
  margin-top: 60px;
  padding: 30px 0;
  border-top: 1px solid #1f1f2e;
  color: #555;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
}

.site-footer-divider {
  margin: 0 10px;
}

.site-footer-link {
  color: #555;
  text-decoration: none;
}

.site-footer-link:hover {
  color: #40b4ff;
}

.site-layout.is-not-found .site-container {
  min-height: 0;
  height: calc(100vh - var(--site-header-height) - var(--site-footer-height));
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

.site-layout.is-not-found .site-footer {
  min-height: var(--site-footer-height);
  margin-top: 0;
}

@media (max-width: 900px) {
  .site-header {
    padding: 0 6vw;
  }

  .site-container {
    padding: 32px 8vw;
  }

  .site-nav {
    gap: 18px;
  }
}

@media (max-width: 560px) {
  .site-header {
    padding: 0 16px;
    gap: 14px;
  }

  .site-brand-name {
    font-size: 18px;
  }

  .site-brand-logo {
    width: 28px;
    height: 28px;
  }

  .site-nav {
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .site-nav::-webkit-scrollbar {
    display: none;
  }

  .site-nav-link {
    font-size: 13px;
  }

  .site-container {
    padding: 28px 16px;
  }
}
</style>
