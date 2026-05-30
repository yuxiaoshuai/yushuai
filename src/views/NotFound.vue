<template>
  <div class="page">
    <div class="card box">
      <div class="code">404</div>
      <div class="title">页面不存在</div>
      <div class="muted">你访问的路径无效，返回主流程即可。</div>
      <div class="actions">
        <RouterLink class="btn primary" to="/">返回首页</RouterLink>
        <RouterLink class="btn ghost" to="/login">去登录</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  display: grid;
  place-items: center;
  padding: 12px 24px;
}

.box {
  width: min(420px, 100%);
  padding: 18px;
  text-align: center;
}

.code {
  font-size: 38px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: rgba(120, 162, 255, 0.95);
}

.title {
  margin-top: 6px;
  font-weight: 650;
  color: var(--text-1);
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
