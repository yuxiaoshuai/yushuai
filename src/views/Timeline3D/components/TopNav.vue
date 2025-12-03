<!-- src/views/Timeline3D/components/TopNav.vue -->
<template>
  <nav class="glass top-nav">
    <div class="nav-inner">
      <h1 class="nav-title">我的时光轴</h1>
    </div>
  </nav>
</template>

<script setup></script>

<style scoped>
.top-nav {
  position: fixed;
  top: 0; left: 0; width: 100%;
  padding: 15px 30px;
  z-index: 100;
}
.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-title {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
