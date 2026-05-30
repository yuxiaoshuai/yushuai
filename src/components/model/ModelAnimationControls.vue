<template>
  <div v-if="animationNames.length" class="model-animation-controls">
    <button
      v-for="name in animationNames"
      :key="name"
      type="button"
      :class="{ active: name === currentAnimation }"
      @click="$emit('change', name)"
    >
      {{ name }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  animationNames: {
    type: Array,
    default: () => [],
  },
  currentAnimation: {
    type: String,
    default: '',
  },
})

defineEmits(['change'])
</script>

<style scoped>
.model-animation-controls {
  position: absolute;
  left: 50%;
  bottom: 18px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: min(100% - 32px, 720px);
  transform: translateX(-50%);
}

.model-animation-controls button {
  min-height: 32px;
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.76);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
  backdrop-filter: blur(8px);
}

.model-animation-controls button:hover,
.model-animation-controls button.active {
  border-color: rgba(255, 255, 255, 0.46);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
