<template>
  <div class="grid">
    <div class="card block">
      <div class="h">主页面（MVP）</div>
      <div class="muted">
        这里是主页面骨架。后续会在此放：会话列表、未读数、最近联系人、以及“用户大厅”入口。
      </div>
      <div class="actions">
        <button class="btn primary" @click="goChat">进入聊天页（预留）</button>
        <button class="btn" @click="goFriends">进入好友页（预留）</button>
      </div>
    </div>

    <div class="card block">
      <div class="h">接入后端前，你可以先用 Mock</div>
      <div class="muted">在 .env.development 中设置：</div>
      <pre class="code">VITE_USE_MOCK=true\nVITE_API_BASE=http://localhost:8080</pre>
      <div class="tiny">Mock 仅用于前端联调（登录/注册）。实时聊天与好友功能后续会对接后端接口与 WebSocket。</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const appBase = computed(() => (route.path.startsWith('/other') ? '/other' : '/app'))

function goChat() {
  router.push(`${appBase.value}/chat`)
}

function goFriends() {
  router.push(`${appBase.value}/friends`)
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.block {
  padding: 16px;
}

.h {
  font-weight: 650;
  color: var(--text-1);
  margin-bottom: 8px;
}

.actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.code {
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(15, 22, 35, 0.55);
  color: var(--text-1);
  overflow: auto;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
