<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">💬</div>
        <div>
          <div class="name">于舒爱 · Chat</div>
          <div class="tiny">{{ me?.nickname || '用户' }} · {{ me?.userNo || '-' }}</div>
        </div>
      </div>

      <nav class="menu">
        <RouterLink class="item" :to="`${appBase}/home`">
          <i class="fa-solid fa-house"></i>
          <span>主页面</span>
        </RouterLink>
        <RouterLink class="item" :to="`${appBase}/chat`">
          <i class="fa-solid fa-comments"></i>
          <span>聊天</span>
          <span class="pill">预留</span>
        </RouterLink>
        <RouterLink class="item" :to="`${appBase}/friends`">
          <i class="fa-solid fa-user-group"></i>
          <span>好友</span>
          <span class="pill">预留</span>
        </RouterLink>
        <RouterLink class="item" :to="`${appBase}/settings`">
          <i class="fa-solid fa-gear"></i>
          <span>设置</span>
          <span class="pill">预留</span>
        </RouterLink>
      </nav>

      <div class="bottom">
        <button class="btn ghost" @click="goSiteHome">返回案例页</button>
        <button class="btn danger" @click="logout">退出</button>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="title">{{ title }}</div>
        <div class="right">
          <span class="status">
            <span class="dot"></span>
            <span>已登录</span>
          </span>
        </div>
      </header>
      <section class="content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMe, logoutLocal } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

const me = computed(() => getMe())
const appBase = computed(() => (route.path.startsWith('/other') ? '/other' : '/app'))

const title = computed(() => {
  const map = {
    Home: '主页面',
    Chat: '聊天',
    Friends: '好友',
    Settings: '设置',
  }
  return map[route.name] || '主页面'
})

function logout() {
  logoutLocal()
  router.replace('/login')
}

function goSiteHome() {
  router.push('/demo')
}
</script>

<style scoped>
.layout {
  height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
}

.sidebar {
  border-right: 1px solid var(--border);
  background: rgba(17, 24, 38, 0.65);
  display: flex;
  flex-direction: column;
  padding: 14px;
  gap: 14px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(15, 22, 35, 0.55);
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.02);
}

.name {
  font-weight: 650;
  color: var(--text-1);
  font-size: 14px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-2);
  text-decoration: none;
  background: rgba(15, 22, 35, 0.35);
}

.item:hover {
  border-color: rgba(230, 237, 243, 0.22);
  color: var(--text-1);
}

.item.router-link-active {
  color: var(--text-1);
  border-color: rgba(120, 162, 255, 0.35);
  background: linear-gradient(135deg, rgba(120, 162, 255, 0.14), rgba(108, 99, 255, 0.08));
}

.pill {
  margin-left: auto;
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-3);
}

.bottom {
  margin-top: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: 56px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: rgba(15, 22, 35, 0.35);
}

.topbar .title {
  font-weight: 650;
  color: var(--text-1);
}

.status {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: var(--text-3);
  font-size: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: rgba(80, 200, 120, 0.9);
  box-shadow: 0 0 0 4px rgba(80, 200, 120, 0.12);
}

.content {
  padding: 18px;
  overflow: auto;
  min-height: 0;
}

@media (max-width: 900px) {
  .layout { grid-template-columns: 220px 1fr; }
}

@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}
</style>
