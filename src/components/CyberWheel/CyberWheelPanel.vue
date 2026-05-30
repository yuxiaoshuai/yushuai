<template>
  <div class="ui-panel">
    <div class="ui-panel-title">MODEL WAKEUP</div>

    <div class="info-box">
      <template v-if="!lightOn">
        光源关闭，确认加载已休眠
      </template>

      <template v-else-if="!payload">
        请选择模型
      </template>

      <template v-else-if="payload.item.disabled">
        <strong>{{ payload.label }}</strong><br>
        当前菜单项暂不可用
      </template>

      <template v-else-if="loading">
        正在进入 3D 引擎：<strong>{{ payload.label }}</strong><br>
        路径：{{ modelPath }}
      </template>

      <template v-else-if="ready && loadingMode === 'confirm'">
        已锁定：<strong>{{ payload.label }}</strong><br>
        路径：{{ modelPath }}<br>
        请确认加载 3D 模型
      </template>

      <template v-else-if="loadingMode === 'preview'">
        预览模式：<strong>{{ payload.label }}</strong><br>
        路径：{{ modelPath }}<br>
        不会正式加载模型
      </template>

      <template v-else-if="loadingMode === 'auto'">
        自动加载：<strong>{{ payload.label }}</strong><br>
        {{ wakeupDelay }}ms 后进入引擎
      </template>

      <template v-else>
        已选中：<strong>{{ payload.label }}</strong><br>
        {{ wakeupDelay }}ms 后执行：确认加载
      </template>
    </div>

    <button
      class="load-btn"
      :class="{ visible: canConfirm, loading }"
      type="button"
      @click.stop="$emit('confirm')"
    >
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CyberWheelLoadingMode, CyberWheelPayload } from './types'

const props = defineProps<{
  payload: CyberWheelPayload | null
  lightOn: boolean
  ready: boolean
  loading: boolean
  wakeupDelay: number
  loadingMode: CyberWheelLoadingMode
}>()

defineEmits<{
  (event: 'confirm'): void
}>()

const modelPath = computed(() => props.payload?.path || props.payload?.routePath || '未绑定')

const canConfirm = computed(() => (
  props.lightOn
  && props.ready
  && !props.loading
  && props.loadingMode === 'confirm'
  && !props.payload?.item.disabled
))

const buttonText = computed(() => {
  if (props.loading) return '加载中...'
  if (props.payload) return `查看 ${props.payload.label}`
  return '确认加载模型'
})
</script>

<style scoped>
.ui-panel {
  position: absolute;
  right: -270px;
  top: 50%;
  z-index: 20;
  width: 240px;
  padding: 18px 18px 20px;
  border: 1px solid rgba(255, 211, 90, 0.22);
  border-radius: 14px;
  background: rgba(10, 14, 22, 0.58);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35), inset 0 0 24px rgba(255, 255, 255, 0.035);
  color: rgba(255, 255, 255, 0.72);
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%);
  transition: opacity 0.32s ease, transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.ui-panel-title {
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 12px;
  letter-spacing: 0.12em;
}

.info-box {
  min-height: 68px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.info-box strong {
  color: #fff7bf;
  text-shadow: 0 0 10px rgba(255, 211, 90, 0.45);
}

.load-btn {
  width: 100%;
  height: 40px;
  border: 1px solid rgba(255, 211, 90, 0.85);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 211, 90, 0.08), rgba(255, 211, 90, 0.02));
  color: #ffd35a;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-18px);
  transition:
    opacity 0.28s ease,
    transform 0.28s ease,
    background 0.22s ease,
    color 0.22s ease,
    box-shadow 0.22s ease;
}

.load-btn.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  box-shadow: 0 0 18px rgba(255, 211, 90, 0.22);
}

.load-btn.visible:hover {
  background: #ffd35a;
  color: #0b0f17;
  box-shadow: 0 0 24px rgba(255, 211, 90, 0.5);
}

.load-btn.loading {
  opacity: 1;
  pointer-events: none;
  transform: translateX(0);
  border-color: rgba(255, 247, 191, 0.35);
  color: rgba(255, 247, 191, 0.75);
}
</style>
