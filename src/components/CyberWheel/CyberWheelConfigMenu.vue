<template>
  <div
    v-show="visible"
    class="config-menu visible"
    :style="{ left: `${x}px`, top: `${y}px` }"
    aria-hidden="false"
    @click.stop
  >
    <div class="config-head">
      <div class="config-title">FLASHLIGHT CONFIG</div>
      <button class="config-close" type="button" title="关闭配置" @click="$emit('close')">×</button>
    </div>

    <div class="config-scroll-area">
      <div class="config-section">
        <div class="config-section-title">
          <strong>转盘菜单</strong>
          <span>显示 / 排序 / 别名 / 模型路径</span>
        </div>

        <div class="config-menu-list">
          <div
            v-for="item in orderedItems"
            :key="item.key"
            class="config-menu-row"
            :class="{ 'drag-over': dragOverKey === item.key }"
            draggable="true"
            @dragstart="dragStart(item.key, $event)"
            @dragover.prevent="dragOver(item.key)"
            @dragleave="dragLeave(item.key)"
            @drop.prevent="dropOn(item.key)"
            @dragend="dragEnd"
          >
            <div class="config-row-top">
              <label class="config-check">
                <input
                  type="checkbox"
                  :checked="isVisible(item.key)"
                  @change="toggleVisible(item.key, ($event.target as HTMLInputElement).checked)"
                >
                <span class="config-row-name">
                  {{ displayName(item) }}
                  <em>{{ item.key }}</em>
                </span>
              </label>

              <div class="order-controls">
                <button class="order-btn" type="button" title="上移" @click="moveKey(item.key, -1)">↑</button>
                <button class="order-btn" type="button" title="下移" @click="moveKey(item.key, 1)">↓</button>
              </div>
            </div>

            <div class="config-field-grid">
              <label class="config-mini-label">
                显示别名
                <input
                  class="config-text-input"
                  :value="displayName(item)"
                  @change="updateAlias(item.key, ($event.target as HTMLInputElement).value)"
                >
              </label>
              <label class="config-mini-label">
                模型路径 / modelPath
                <input
                  class="config-text-input"
                  :value="modelPath(item)"
                  @change="updatePath(item.key, ($event.target as HTMLInputElement).value)"
                >
              </label>
            </div>
          </div>
        </div>

        <div class="config-actions">
          <button class="config-action-btn" type="button" @click="selectAll">全部显示</button>
          <button class="config-action-btn" type="button" @click="onlyActive">仅保留当前</button>
          <button class="config-action-btn" type="button" @click="resetOrder">恢复顺序</button>
        </div>

        <div class="config-hint" :class="{ warn: hintWarn }">{{ hintText }}</div>
      </div>

      <div class="config-section">
        <div class="config-section-title">
          <strong>交互行为</strong>
          <span>默认项 / 延迟 / 吸附</span>
        </div>

        <div class="config-row">
          <label for="defaultKeySelect">默认选中</label>
          <select
            id="defaultKeySelect"
            class="config-select"
            :value="config.defaultKey"
            @change="updateField('defaultKey', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="item in items" :key="item.key" :value="item.key">
              {{ displayName(item) }} ({{ item.key }})
            </option>
          </select>
        </div>

        <div class="config-row">
          <label for="loadingModeSelect">加载模式</label>
          <select
            id="loadingModeSelect"
            class="config-select"
            :value="config.loadingMode"
            @change="updateField('loadingMode', ($event.target as HTMLSelectElement).value)"
          >
            <option value="confirm">确认加载</option>
            <option value="auto">自动加载</option>
            <option value="preview">只预览不加载</option>
          </select>
        </div>

        <div class="config-row">
          <div class="row-name">唤醒延迟</div>
          <div class="range-box">
            <input
              class="config-range"
              type="range"
              min="0"
              max="1500"
              step="50"
              :value="config.wakeupDelay"
              @input="updateNumberField('wakeupDelay', ($event.target as HTMLInputElement).value)"
            >
            <div class="range-value">{{ config.wakeupDelay }}ms</div>
          </div>
        </div>

        <div class="config-row">
          <div class="row-name">滚轮阈值</div>
          <div class="range-box">
            <input
              class="config-range"
              type="range"
              min="10"
              max="120"
              step="5"
              :value="config.wheelThreshold"
              @input="updateNumberField('wheelThreshold', ($event.target as HTMLInputElement).value)"
            >
            <div class="range-value">{{ config.wheelThreshold }}</div>
          </div>
        </div>

        <div class="config-row">
          <div class="row-name">吸附速度</div>
          <div class="range-box">
            <input
              class="config-range"
              type="range"
              min="120"
              max="1000"
              step="10"
              :value="config.snapDuration"
              @input="updateNumberField('snapDuration', ($event.target as HTMLInputElement).value)"
            >
            <div class="range-value">{{ config.snapDuration }}ms</div>
          </div>
        </div>

        <div class="config-actions">
          <button class="config-action-btn" type="button" @click="$emit('jumpDefault')">跳到默认项</button>
          <button class="config-action-btn" type="button" @click="$emit('reset')">恢复推荐</button>
          <button class="config-action-btn" type="button" @click="saveConfig">保存配置</button>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title">
          <strong>声光反馈</strong>
          <span>音效 / 震动 / 光束强度</span>
        </div>

        <div class="config-row">
          <div class="row-name">咔哒音效</div>
          <label class="switch-line">
            <input
              type="checkbox"
              :checked="config.soundEnabled"
              @change="updateField('soundEnabled', ($event.target as HTMLInputElement).checked)"
            >
            开启音效
          </label>
        </div>

        <div class="config-row">
          <div class="row-name">移动端震动</div>
          <label class="switch-line">
            <input
              type="checkbox"
              :checked="config.hapticEnabled"
              @change="updateField('hapticEnabled', ($event.target as HTMLInputElement).checked)"
            >
            开启震动
          </label>
        </div>

        <div class="config-row">
          <label for="lightIntensitySelect">光束强度</label>
          <select
            id="lightIntensitySelect"
            class="config-select"
            :value="config.lightIntensity"
            @change="updateField('lightIntensity', ($event.target as HTMLSelectElement).value)"
          >
            <option value="weak">弱光</option>
            <option value="standard">标准</option>
            <option value="strong">强光</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CyberWheelConfig, CyberWheelItem } from './types'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  items: CyberWheelItem[]
  config: Required<CyberWheelConfig>
  activeKey?: string
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'change', config: CyberWheelConfig): void
  (event: 'reset'): void
  (event: 'jumpDefault'): void
}>()

const draggedKey = ref('')
const dragOverKey = ref('')
const hintText = ref('至少保留 1 个菜单项。可拖拽菜单行排序。')
const hintWarn = ref(false)

const orderedItems = computed(() => {
  const byKey = new Map(props.items.map((item) => [item.key, item]))
  return props.config.orderKeys
    .map((key) => byKey.get(key))
    .filter(Boolean) as CyberWheelItem[]
})

function emitConfig(patch: CyberWheelConfig, message?: string) {
  hintWarn.value = false
  if (message) hintText.value = message
  emit('change', patch)
}

function displayName(item: CyberWheelItem) {
  return props.config.aliasMap[item.key] || item.label || item.key
}

function modelPath(item: CyberWheelItem) {
  return props.config.pathMap[item.key] || item.path || item.routePath || ''
}

function isVisible(key: string) {
  return props.config.visibleKeys.includes(key)
}

function toggleVisible(key: string, checked: boolean) {
  const visibleKeys = new Set(props.config.visibleKeys)
  if (checked) visibleKeys.add(key)
  else visibleKeys.delete(key)

  if (!visibleKeys.size) {
    hintWarn.value = true
    hintText.value = '至少保留 1 个菜单项，不能全部隐藏。'
    return
  }

  emitConfig({ visibleKeys: Array.from(visibleKeys) }, `当前显示 ${visibleKeys.size} / ${props.items.length} 个菜单项。`)
}

function moveKey(key: string, direction: number) {
  const orderKeys = [...props.config.orderKeys]
  const index = orderKeys.indexOf(key)
  const nextIndex = index + direction
  if (index === -1 || nextIndex < 0 || nextIndex >= orderKeys.length) return

  ;[orderKeys[index], orderKeys[nextIndex]] = [orderKeys[nextIndex], orderKeys[index]]
  emitConfig({ orderKeys }, '菜单顺序已更新。')
}

function dragStart(key: string, event: DragEvent) {
  draggedKey.value = key
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function dragOver(key: string) {
  if (!draggedKey.value || draggedKey.value === key) return
  dragOverKey.value = key
}

function dragLeave(key: string) {
  if (dragOverKey.value === key) dragOverKey.value = ''
}

function dropOn(targetKey: string) {
  const sourceKey = draggedKey.value
  dragOverKey.value = ''
  draggedKey.value = ''
  if (!sourceKey || sourceKey === targetKey) return

  const orderKeys = props.config.orderKeys.filter((key) => key !== sourceKey)
  const targetIndex = orderKeys.indexOf(targetKey)
  orderKeys.splice(targetIndex, 0, sourceKey)
  emitConfig({ orderKeys }, '拖拽排序已保存。')
}

function dragEnd() {
  draggedKey.value = ''
  dragOverKey.value = ''
}

function updateAlias(key: string, value: string) {
  emitConfig({
    aliasMap: {
      ...props.config.aliasMap,
      [key]: value.trim() || key,
    },
  }, '显示别名已更新。')
}

function updatePath(key: string, value: string) {
  emitConfig({
    pathMap: {
      ...props.config.pathMap,
      [key]: value.trim(),
    },
  }, '模型路径已更新。')
}

function updateField(key: keyof CyberWheelConfig, value: string | boolean) {
  emitConfig({ [key]: value } as CyberWheelConfig, '配置已保存到 localStorage。')
}

function updateNumberField(key: keyof CyberWheelConfig, value: string) {
  emitConfig({ [key]: Number(value) } as CyberWheelConfig)
}

function selectAll() {
  emitConfig({ visibleKeys: props.config.orderKeys }, '已显示全部菜单项。')
}

function onlyActive() {
  const key = props.activeKey || props.config.defaultKey || props.config.orderKeys[0]
  if (!key) return
  emitConfig({ visibleKeys: [key] }, '已仅保留当前菜单项。')
}

function resetOrder() {
  emitConfig({ orderKeys: props.items.map((item) => item.key) }, '已恢复推荐顺序。')
}

function saveConfig() {
  hintWarn.value = false
  hintText.value = '配置已保存到 localStorage，刷新页面后仍会保留。'
}
</script>

<style scoped>
.config-menu {
  position: fixed;
  z-index: 9999;
  width: 390px;
  max-height: min(78vh, 720px);
  padding: 14px;
  border: 1px solid rgba(255, 211, 90, 0.28);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(12, 17, 28, 0.96), rgba(7, 10, 17, 0.94));
  box-shadow:
    0 22px 60px rgba(0, 0, 0, 0.58),
    inset 0 0 28px rgba(255, 255, 255, 0.035),
    0 0 0 1px rgba(255, 255, 255, 0.025);
  color: rgba(255, 255, 255, 0.82);
  opacity: 0;
  pointer-events: none;
  transform: scale(0.96) translateY(-6px);
  transform-origin: top left;
  transition: opacity 0.16s ease, transform 0.16s ease;
  user-select: none;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.config-menu.visible {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1) translateY(0);
}

.config-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.config-title {
  color: #fff7bf;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(255, 211, 90, 0.35);
}

.config-close {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.68);
  cursor: pointer;
  transition: all 0.18s ease;
}

.config-close:hover {
  border-color: #ffd35a;
  background: #ffd35a;
  color: #0b0f17;
}

.config-scroll-area {
  max-height: calc(min(78vh, 720px) - 62px);
  overflow: auto;
  padding-right: 5px;
}

.config-section {
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.032);
}

.config-section:last-child {
  margin-bottom: 0;
}

.config-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.config-section-title strong {
  color: rgba(255, 247, 191, 0.9);
  font-size: 12px;
  letter-spacing: 0.04em;
}

.config-menu-list {
  display: grid;
  max-height: 245px;
  overflow: auto;
  gap: 8px;
  padding-right: 4px;
}

.config-menu-row {
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.075);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}

.config-menu-row:hover {
  border-color: rgba(255, 211, 90, 0.28);
  background: rgba(255, 211, 90, 0.055);
}

.config-menu-row.drag-over {
  border-color: rgba(255, 211, 90, 0.75);
  box-shadow: inset 0 0 18px rgba(255, 211, 90, 0.12);
}

.config-row-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 7px;
}

.config-check {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
  cursor: pointer;
  font-size: 12px;
}

.config-check input,
.switch-line input {
  flex: 0 0 auto;
  cursor: pointer;
  accent-color: #ffd35a;
}

.config-row-name {
  min-width: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.82);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-row-name em {
  margin-left: 6px;
  color: rgba(255, 255, 255, 0.36);
  font-size: 11px;
  font-style: normal;
}

.order-controls {
  display: flex;
  gap: 5px;
}

.order-btn {
  width: 26px;
  height: 24px;
  border: 1px solid rgba(255, 211, 90, 0.2);
  border-radius: 7px;
  background: rgba(255, 211, 90, 0.035);
  color: rgba(255, 247, 191, 0.76);
  cursor: pointer;
}

.order-btn:hover {
  border-color: rgba(255, 211, 90, 0.46);
  background: rgba(255, 211, 90, 0.14);
}

.config-field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.config-mini-label {
  display: grid;
  gap: 4px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
}

.config-text-input,
.config-select {
  width: 100%;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 8px;
  outline: none;
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.82);
  padding: 0 9px;
  font-size: 12px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.config-text-input:focus,
.config-select:focus {
  border-color: rgba(255, 211, 90, 0.5);
  background: rgba(0, 0, 0, 0.28);
  box-shadow: 0 0 0 2px rgba(255, 211, 90, 0.08);
}

.config-select option {
  background: #111722;
  color: #f7f0d0;
}

.config-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.config-action-btn {
  min-height: 30px;
  border: 1px solid rgba(255, 211, 90, 0.3);
  border-radius: 8px;
  background: rgba(255, 211, 90, 0.04);
  color: rgba(255, 247, 191, 0.86);
  cursor: pointer;
  font-size: 12px;
  padding: 0 8px;
  transition: all 0.16s ease;
}

.config-action-btn:hover {
  background: rgba(255, 211, 90, 0.14);
}

.config-row {
  display: grid;
  grid-template-columns: 105px 1fr;
  align-items: center;
  min-height: 34px;
  gap: 10px;
  margin-bottom: 9px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-row label,
.config-row .row-name {
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.range-box {
  display: grid;
  grid-template-columns: 1fr 70px;
  align-items: center;
  gap: 8px;
}

.config-range {
  width: 100%;
  accent-color: #ffd35a;
}

.range-value {
  height: 26px;
  border: 1px solid rgba(255, 211, 90, 0.15);
  border-radius: 7px;
  background: rgba(255, 211, 90, 0.08);
  color: #fff7bf;
  font-size: 11px;
  line-height: 26px;
  text-align: center;
}

.switch-line {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.config-hint {
  min-height: 18px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
  line-height: 1.5;
}

.config-hint.warn {
  color: rgba(255, 211, 90, 0.86);
}

.config-menu,
.config-scroll-area,
.config-menu-list {
  scrollbar-color: rgba(255, 211, 90, 0.45) rgba(255, 255, 255, 0.045);
  scrollbar-width: thin;
}

.config-scroll-area::-webkit-scrollbar,
.config-menu-list::-webkit-scrollbar {
  width: 8px;
}

.config-scroll-area::-webkit-scrollbar-track,
.config-menu-list::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.35);
}

.config-scroll-area::-webkit-scrollbar-thumb,
.config-menu-list::-webkit-scrollbar-thumb {
  border: 2px solid rgba(10, 14, 22, 0.95);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 247, 191, 0.65), rgba(255, 211, 90, 0.32));
  box-shadow: 0 0 10px rgba(255, 211, 90, 0.18);
}

@media (max-width: 620px) {
  .config-menu {
    width: min(390px, calc(100vw - 20px));
  }
}
</style>
