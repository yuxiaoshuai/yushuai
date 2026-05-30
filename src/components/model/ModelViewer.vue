<template>
  <div
    ref="rootRef"
    class="model-viewer"
    :style="{ width, height }"
  >
    <div ref="containerRef" class="model-viewer__canvas"></div>

    <ModelLoading
      v-if="showLoading && (isLoading || errorMessage)"
      :progress="progress"
      :error="errorMessage"
    />

    <ModelAnimationControls
      v-if="showControls && !errorMessage"
      :animation-names="animationNames"
      :current-animation="currentAnimation"
      @change="play"
    />

    <div v-if="showInfo && modelName" class="model-viewer__info">
      {{ modelName }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createModelViewer, modelRegistry } from '@/utils/modelKit'
import ModelAnimationControls from './ModelAnimationControls.vue'
import ModelLoading from './ModelLoading.vue'

const props = defineProps({
  modelId: {
    type: String,
    default: '',
  },
  src: {
    type: String,
    default: '',
  },
  defaultAnimation: {
    type: String,
    default: '',
  },
  autoPlay: {
    type: Boolean,
    default: true,
  },
  loop: {
    type: Boolean,
    default: true,
  },
  lazy: {
    type: Boolean,
    default: true,
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '100%',
  },
  cameraPosition: {
    type: Array,
    default: undefined,
  },
  modelScale: {
    type: Number,
    default: undefined,
  },
  modelPosition: {
    type: Array,
    default: undefined,
  },
  modelRotation: {
    type: Array,
    default: undefined,
  },
  showControls: {
    type: Boolean,
    default: true,
  },
  showLoading: {
    type: Boolean,
    default: true,
  },
  showInfo: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['loaded', 'progress', 'error', 'animation-change'])

const rootRef = ref(null)
const containerRef = ref(null)
const viewer = ref(null)
const progress = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const animationNames = ref([])
const currentAnimation = ref('')

const modelName = computed(() => modelRegistry[props.modelId]?.name || '')

function normalizeError(error) {
  return error?.message || String(error || '加载失败')
}

function dispose() {
  viewer.value?.dispose?.()
  viewer.value = null
}

async function initViewer() {
  dispose()
  await nextTick()

  if (!containerRef.value) return

  progress.value = 0
  isLoading.value = true
  errorMessage.value = ''
  animationNames.value = []
  currentAnimation.value = ''

  viewer.value = createModelViewer({
    container: containerRef.value,
    modelId: props.modelId,
    src: props.src,
    defaultAnimation: props.defaultAnimation,
    autoPlay: props.autoPlay,
    loop: props.loop,
    lazy: props.lazy,
    cameraPosition: props.cameraPosition,
    modelScale: props.modelScale,
    modelPosition: props.modelPosition,
    modelRotation: props.modelRotation,
    onProgress: (payload) => {
      progress.value = payload.percent
      emit('progress', payload)
    },
    onLoaded: (payload) => {
      progress.value = 100
      isLoading.value = false
      animationNames.value = payload.animationNames
      currentAnimation.value = payload.currentAnimation || ''
      emit('loaded', payload)
      if (currentAnimation.value) emit('animation-change', currentAnimation.value)
    },
    onError: (error) => {
      isLoading.value = false
      errorMessage.value = normalizeError(error)
      emit('error', error)
    },
    onAnimationChange: (name) => {
      currentAnimation.value = name
      emit('animation-change', name)
    },
  })

  viewer.value.ready?.catch((error) => {
    if (errorMessage.value) return
    isLoading.value = false
    errorMessage.value = normalizeError(error)
    emit('error', error)
  })
}

function play(name) {
  const nextAnimation = viewer.value?.playAnimation?.(name)
  if (nextAnimation) {
    currentAnimation.value = nextAnimation
  }
  return nextAnimation
}

function pause() {
  viewer.value?.pauseAnimation?.()
}

function resume() {
  viewer.value?.resumeAnimation?.()
}

function stop(name) {
  viewer.value?.stopAnimation?.(name)
}

function getAnimationNames() {
  return animationNames.value.slice()
}

onMounted(initViewer)
onBeforeUnmount(dispose)

watch(
  () => [
    props.modelId,
    props.src,
    props.defaultAnimation,
    props.autoPlay,
    props.loop,
    props.lazy,
    props.cameraPosition,
    props.modelScale,
    props.modelPosition,
    props.modelRotation,
  ],
  initViewer,
)

defineExpose({
  play,
  pause,
  resume,
  stop,
  getAnimationNames,
  dispose,
})
</script>

<style scoped>
.model-viewer {
  position: relative;
  overflow: hidden;
  min-height: 240px;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.08), transparent 42%),
    #08080c;
}

.model-viewer__canvas {
  position: absolute;
  inset: 0;
}

.model-viewer__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.model-viewer__info {
  position: absolute;
  left: 14px;
  top: 14px;
  z-index: 4;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.38);
  color: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  font-weight: 700;
  backdrop-filter: blur(8px);
}
</style>
