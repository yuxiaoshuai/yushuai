<template>
  <div class="model-loading" role="status">
    {{ message }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
    default: '',
  },
})

const message = computed(() => {
  if (props.error) return '加载失败'
  return `Loading ${Math.max(0, Math.min(100, Math.round(props.progress)))}%`
})
</script>

<style scoped>
.model-loading {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 4;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 700;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px);
}
</style>
