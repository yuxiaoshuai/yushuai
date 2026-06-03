<template>
  <main class="yubot-stream-page">
    <YuBotStreamOverlay />
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import YuBotStreamOverlay from '@/components/yubot/YuBotStreamOverlay.vue'

const pageClass = 'is-yubot-stream-page'

onMounted(() => {
  document.documentElement.classList.add(pageClass)
  document.body.classList.add(pageClass)
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove(pageClass)
  document.body.classList.remove(pageClass)
})
</script>

<style scoped>
.yubot-stream-page {
  position: relative;
  width: 100vw;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  background: #08080c;
}

:global(html.is-yubot-stream-page),
:global(body.is-yubot-stream-page) {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #08080c;
}

:global(body.is-yubot-stream-page #app) {
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  background: #08080c;
}
</style>
