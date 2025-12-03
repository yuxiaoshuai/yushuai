<!-- src/views/Timeline3D/components/ScrollHint.vue -->
<template>
  <div class="scroll-hint" :style="hintStyle">
    <p>滚动鼠标探索时光</p>
    <div class="mouse">
      <div class="dot"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  hidden: { type: Boolean, default: false },
  scrolled: { type: Boolean, default: false },
});

const hintStyle = computed(() => {
  const hide = props.hidden || props.scrolled;
  return {
    opacity: hide ? 0 : 1,
    visibility: hide ? "hidden" : "visible",
  };
});
</script>

<style scoped>
.scroll-hint {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,.6);
  text-align: center;
  font-size: 14px;
  z-index: 10;
  animation: bounce 2s infinite;
  transition: opacity .5s ease, visibility .5s ease;
}
.mouse {
  width: 24px; height: 40px;
  border: 2px solid rgba(255,255,255,.3);
  border-radius: 999px;
  margin: 8px auto 0;
  display: flex; justify-content: center;
}
.dot {
  width: 4px; height: 8px;
  background: rgba(255,255,255,.5);
  border-radius: 999px;
  margin-top: 8px;
  margin-left: 4px;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%,100% { transform: translate(-50%,0); }
  50% { transform: translate(-50%,-8px); }
}
</style>
