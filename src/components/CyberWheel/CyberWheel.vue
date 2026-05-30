<template>
  <div class="cyber-wheel-root">
    <div
      ref="wheelWrapRef"
      class="wheel-wrap"
      :class="[
        localLightOn ? 'is-light-on' : '',
        isDocked ? 'is-docked' : '',
        `light-${internalConfig.lightIntensity}`,
      ]"
      :style="positionStyle"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mousemove="handleMouseMove"
      @wheel="handleWheel"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    >
      <div
        ref="outerRingRef"
        class="wheel-outer-ring"
        @mouseenter="handleMouseEnter"
      ></div>

      <div class="radial-shell">
        <div class="wheel" :style="wheelStyle">
          <div
            v-for="(item, index) in visibleItems"
            :key="`${item.key}-sector`"
            class="sector-glow"
            :class="{ active: localLightOn && index === activeIndex }"
            :style="sectorStyle(item, index)"
          ></div>
        </div>

        <div class="flashlight-beam">
          <div class="beam-soft"></div>
          <div class="beam-main"></div>
          <div class="beam-core"></div>
          <div class="beam-glow-dot"></div>
        </div>

        <div class="menu-container">
          <button
            v-for="(item, index) in visibleItems"
            :key="item.key"
            class="menu-item"
            :class="{
              active: localLightOn && index === activeIndex,
              disabled: item.disabled,
            }"
            type="button"
            :style="menuItemStyle(index)"
            @pointerdown.stop
            @click.stop.prevent="handleMenuClick(index)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div class="center-circle">
        <button
          class="flashlight-btn"
          type="button"
          title="开启 / 关闭手电筒"
          @click.stop="toggleLight"
          @contextmenu="onFlashlightContextMenu"
        >
          <span class="mini-flashlight" aria-hidden="true">
            <span class="mini-tail"></span>
            <span class="mini-body"></span>
            <span class="mini-head"><span class="mini-lens"></span></span>
          </span>
        </button>
      </div>

      <CyberWheelPanel
        v-if="showPanel"
        :payload="pendingPayload || activePayload"
        :light-on="localLightOn"
        :ready="isConfirmReady"
        :loading="isLoading"
        :wakeup-delay="internalConfig.wakeupDelay"
        :loading-mode="internalConfig.loadingMode"
        @confirm="requestLoadCurrent"
      />
    </div>

    <CyberWheelConfigMenu
      v-if="showConfig"
      :visible="isConfigOpen"
      :x="configMenuPosition.x"
      :y="configMenuPosition.y"
      :items="items"
      :config="internalConfig"
      :active-key="activePayload?.key"
      @close="closeConfigMenu"
      @change="updateConfig"
      @reset="resetConfig"
      @jump-default="jumpToDefault"
    />

    <div v-if="showTips" class="tips">
      鼠标滚轮或指尖拨动转盘 | 右击手电筒配置 | 关灯后移出组件自动左侧半隐藏<br>
      请先点击页面一次以激活网页机械咔哒声
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, type CSSProperties } from 'vue'
import CyberWheelConfigMenu from './CyberWheelConfigMenu.vue'
import CyberWheelPanel from './CyberWheelPanel.vue'
import { useCyberWheel } from './useCyberWheel'
import type {
  CyberWheelConfig,
  CyberWheelItem,
  CyberWheelPayload,
  CyberWheelPosition,
} from './types'

const props = withDefaults(defineProps<{
  items: CyberWheelItem[]
  config?: CyberWheelConfig
  activeKey?: string
  lightOn?: boolean
  storageKey?: string
  persist?: boolean
  showPanel?: boolean
  showConfig?: boolean
  showTips?: boolean
  position?: CyberWheelPosition
}>(), {
  items: () => [],
  storageKey: 'cyber-wheel-full-config-v1',
  persist: true,
  showPanel: true,
  showConfig: true,
  showTips: false,
  position: () => ({
    left: '30px',
    top: '50%',
    transform: 'translate(0, -50%)',
    zIndex: 40,
  }),
})

const emit = defineEmits<{
  (event: 'update:activeKey', key: string): void
  (event: 'update:lightOn', value: boolean): void
  (event: 'select', payload: CyberWheelPayload): void
  (event: 'preview', payload: CyberWheelPayload): void
  (event: 'requestLoad', payload: CyberWheelPayload): void
  (event: 'loaded', payload: CyberWheelPayload): void
  (event: 'lightChange', value: boolean): void
  (event: 'configChange', config: Required<CyberWheelConfig>): void
}>()

const {
  wheelWrapRef,
  outerRingRef,
  internalConfig,
  visibleItems,
  currentRotate,
  activeIndex,
  activePayload,
  pendingPayload,
  wheelBackground,
  perAngle,
  localLightOn,
  isDocked,
  isConfigOpen,
  configMenuPosition,
  isConfirmReady,
  isLoading,
  snapToIndex,
  snapToKey,
  turnOn,
  turnOff,
  toggleLight,
  openConfigMenu,
  closeConfigMenu,
  resetConfig,
  jumpToDefault,
  updateConfig,
  requestLoadCurrent,
  getState,
  handleMouseEnter,
  handleMouseLeave,
  handleMouseMove,
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleMenuClick,
  handleContextMenu,
  getColorIndex,
} = useCyberWheel({
  items: toRef(props, 'items'),
  config: toRef(props, 'config'),
  activeKey: toRef(props, 'activeKey'),
  lightOn: toRef(props, 'lightOn'),
  storageKey: toRef(props, 'storageKey'),
  persist: toRef(props, 'persist'),
  emit: emit as (event: string, ...args: any[]) => void,
})

const glowColors = [
  'rgba(255, 75, 75, 0.45)',
  'rgba(255, 210, 50, 0.45)',
  'rgba(0, 210, 255, 0.45)',
  'rgba(255, 120, 230, 0.45)',
  'rgba(25, 230, 140, 0.45)',
  'rgba(255, 140, 40, 0.45)',
]

const positionStyle = computed<CSSProperties>(() => ({
  left: props.position?.left ?? (props.position?.right ? 'auto' : '30px'),
  top: props.position?.top ?? (props.position?.bottom ? 'auto' : '50%'),
  right: props.position?.right,
  bottom: props.position?.bottom,
  zIndex: props.position?.zIndex ?? 40,
  '--wheel-open-transform': props.position?.transform || 'translate(0, -50%)',
} as CSSProperties))

const wheelStyle = computed<CSSProperties>(() => ({
  background: wheelBackground.value,
  transform: `translate(-50%, -50%) rotate(${currentRotate.value}deg)`,
}))

function sectorStyle(item: CyberWheelItem, index: number): CSSProperties {
  const colorIndex = getColorIndex(item, index)
  return {
    transform: `rotate(${index * perAngle.value}deg)`,
    background: `linear-gradient(90deg, rgba(255,255,255,0) 20%, ${glowColors[colorIndex % glowColors.length]} 75%, rgba(255,255,255,0.4) 94%, #ffffff 100%)`,
  }
}

function menuItemStyle(index: number): CSSProperties {
  const baseAngle = index * perAngle.value + 90 + currentRotate.value
  return {
    transform: `translate(-50%, -50%) rotate(${baseAngle}deg) translateY(-115px) rotate(${-baseAngle}deg)`,
  }
}

function onFlashlightContextMenu(event: MouseEvent) {
  if (!props.showConfig) return
  handleContextMenu(event)
}

defineExpose({
  snapToKey,
  snapToIndex,
  turnOn,
  turnOff,
  toggleLight,
  openConfigMenu,
  closeConfigMenu,
  resetConfig,
  getState,
})
</script>

<style scoped>
.cyber-wheel-root {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.wheel-wrap {
  --dock-ring-size: 130px;
  --dock-half-hide-x: -95px;
  --wheel-open-transform: translate(0, -50%);
  position: fixed;
  left: 30px;
  top: 50%;
  z-index: 40;
  width: 440px;
  height: 440px;
  pointer-events: auto;
  touch-action: none;
  transform: var(--wheel-open-transform);
  transform-origin: left center;
  transition:
    width 0.58s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.58s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.58s cubic-bezier(0.22, 1, 0.36, 1);
}

.wheel-wrap.is-docked:not(.is-light-on) {
  width: var(--dock-ring-size);
  height: var(--dock-ring-size);
  transform: translate(var(--dock-half-hide-x), -50%);
}

.wheel-wrap:not(.is-docked):not(.is-light-on) {
  width: var(--dock-ring-size);
  height: var(--dock-ring-size);
  transform: translate(-30px, -50%);
}

.wheel-wrap.is-light-on {
  width: 440px;
  height: 440px;
  transform: var(--wheel-open-transform);
}

.radial-shell {
  position: absolute;
  inset: 0;
  z-index: 20;
  opacity: 1;
  pointer-events: none;
  transform: scale(1);
  transform-origin: 50% 50%;
  filter: blur(0);
  transition:
    transform 0.62s cubic-bezier(0.18, 0.98, 0.22, 1.12),
    opacity 0.42s ease,
    filter 0.48s ease;
  will-change: transform, opacity, filter;
}

.wheel-wrap:not(.is-light-on) .radial-shell {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.18) rotate(-10deg);
  filter: blur(10px);
}

.wheel {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 21;
  overflow: hidden;
  width: 370px;
  height: 370px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.4),
    inset 0 0 30px rgba(255, 255, 255, 0.04);
  pointer-events: none;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.sector-glow {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transform-origin: 50% 50%;
  clip-path: polygon(50% 50%, 98% 32%, 100% 50%, 98% 68%);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.sector-glow.active {
  opacity: 1;
  filter: blur(7px) brightness(1.75) saturate(1.35);
}

.sector-glow::after {
  position: absolute;
  right: 0;
  top: 40%;
  width: 12px;
  height: 20%;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 15px #fff;
  content: '';
  filter: blur(4px);
}

.menu-container {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 35;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.menu-item {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 36;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  min-width: 44px;
  min-height: 26px;
  padding: 4px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  line-height: 18px;
  pointer-events: auto;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition:
    color 0.25s ease,
    text-shadow 0.25s ease,
    font-weight 0.25s ease,
    font-size 0.25s,
    background 0.25s ease;
  user-select: none;
  white-space: nowrap;
}

.menu-item:hover {
  background: rgba(255, 211, 90, 0.08);
}

.menu-item.active {
  background: rgba(255, 211, 90, 0.1);
  color: #fff7bf;
  font-size: 14px;
  font-weight: 800;
  text-shadow:
    0 0 8px rgba(255, 223, 99, 0.95),
    0 0 20px rgba(255, 193, 7, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.5);
}

.menu-item.disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.center-circle {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  background: radial-gradient(circle at center, #1b2331, #121822);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.5),
    inset 0 2px 5px rgba(255, 255, 255, 0.1);
  transform: translate(-50%, -50%);
}

.wheel-wrap:not(.is-light-on) .center-circle {
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.5),
    inset 0 2px 5px rgba(255, 255, 255, 0.1),
    0 0 18px rgba(255, 211, 90, 0.12);
}

.flashlight-btn {
  position: relative;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 28%, rgba(255, 255, 255, 0.15), transparent 30%),
    linear-gradient(145deg, #3a4454, #141a24);
  box-shadow:
    inset 0 3px 5px rgba(255, 255, 255, 0.1),
    inset 0 -6px 10px rgba(0, 0, 0, 0.6),
    0 5px 15px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.wheel-wrap.is-light-on .flashlight-btn {
  border-color: rgba(255, 211, 90, 0.8);
  box-shadow:
    inset 0 3px 5px rgba(255, 255, 0, 0.1),
    inset 0 -6px 10px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(255, 211, 90, 0.5);
}

.mini-flashlight {
  position: absolute;
  left: 11px;
  top: 21px;
  width: 38px;
  height: 16px;
  transform: rotate(-10deg);
}

.mini-tail,
.mini-body,
.mini-head,
.mini-lens {
  position: absolute;
  display: block;
}

.mini-tail {
  left: 0;
  top: 4px;
  width: 7px;
  height: 9px;
  border-radius: 4px 2px 2px 4px;
  background: linear-gradient(180deg, #6f7a8b, #28313f);
}

.mini-body {
  left: 6px;
  top: 3px;
  width: 20px;
  height: 11px;
  border-radius: 3px;
  background:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0 2px, transparent 2px 5px),
    linear-gradient(180deg, #727f91, #1a222d);
}

.mini-head {
  left: 24px;
  top: 0;
  width: 14px;
  height: 16px;
  border-radius: 3px 8px 8px 3px;
  background: linear-gradient(180deg, #8b99ac, #232a35);
  clip-path: polygon(0 18%, 100% 0, 100% 100%, 0 82%);
}

.mini-lens {
  right: 0;
  top: 3px;
  width: 5px;
  height: 10px;
  border-radius: 50%;
  background: #475363;
  transition: all 0.25s ease;
}

.wheel-wrap.is-light-on .mini-lens {
  background: #fff9d4;
  box-shadow: 0 0 6px #ffd35a;
}

.flashlight-beam {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 32;
  width: 190px;
  height: 148px;
  opacity: 0;
  pointer-events: none;
  transform: translate(0, -50%);
  transition: opacity 0.25s ease;
}

.wheel-wrap.is-light-on .flashlight-beam {
  opacity: 1;
}

.beam-soft {
  position: absolute;
  left: 0;
  top: 0;
  width: 200px;
  height: 148px;
  background: radial-gradient(ellipse at left center, rgba(255, 225, 100, 0.22) 0%, rgba(255, 225, 100, 0.1) 40%, transparent 75%);
  filter: blur(12px);
}

.beam-main {
  position: absolute;
  left: 0;
  top: 20px;
  width: 185px;
  height: 108px;
  background: linear-gradient(90deg, rgba(255, 232, 135, 0.5) 0%, rgba(255, 232, 135, 0.2) 45%, transparent 100%);
  animation: beamPulse 2s ease-in-out infinite;
  clip-path: polygon(0 43%, 100% 0, 100% 100%, 0 57%);
  filter: blur(2px);
}

.beam-core {
  position: absolute;
  left: 0;
  top: 60px;
  width: 175px;
  height: 28px;
  background: linear-gradient(90deg, rgba(255, 253, 230, 0.7) 0%, rgba(255, 242, 160, 0.25) 50%, transparent 100%);
  animation: corePulse 1.5s ease-in-out infinite;
  clip-path: polygon(0 34%, 100% 0, 100% 100%, 0 66%);
  filter: blur(2px);
}

.beam-glow-dot {
  position: absolute;
  left: -6px;
  top: 50%;
  width: 14px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 245, 180, 0.8), rgba(255, 215, 90, 0.2) 60%, transparent);
  transform: translateY(-50%);
  filter: blur(1px);
}

.wheel-outer-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 18;
  width: 420px;
  height: 420px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
  transform-origin: 50% 50%;
  transition:
    transform 0.62s cubic-bezier(0.18, 0.98, 0.22, 1.12),
    border-color 0.34s ease,
    box-shadow 0.34s ease,
    opacity 0.34s ease;
}

.wheel-wrap:not(.is-light-on) .wheel-outer-ring {
  border-color: rgba(255, 211, 90, 0.38);
  opacity: 0.92;
  transform: translate(-50%, -50%) scale(0.31);
  box-shadow:
    0 0 22px rgba(255, 211, 90, 0.1),
    inset 0 0 18px rgba(255, 211, 90, 0.045);
}

.wheel-wrap.is-light-on .wheel-outer-ring {
  border-color: rgba(255, 255, 255, 0.15);
  pointer-events: none;
}

.wheel-wrap:not(.is-light-on) .menu-container,
.wheel-wrap:not(.is-light-on) .flashlight-beam {
  pointer-events: none;
}

.wheel-wrap:not(.is-light-on) .menu-item {
  pointer-events: none;
}

.wheel-wrap:not(.is-light-on).is-docked .center-circle {
  filter: drop-shadow(0 0 8px rgba(255, 211, 90, 0.16));
}

.wheel-wrap:not(.is-light-on) :deep(.ui-panel) {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-50%) translateX(-24px) scale(0.96);
}

.wheel-wrap.is-light-on :deep(.ui-panel) {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0) scale(1);
}

.wheel-wrap.is-light-on.light-weak .flashlight-beam {
  opacity: 0.58;
}

.wheel-wrap.is-light-on.light-weak .sector-glow.active {
  opacity: 0.68;
  filter: blur(7px) brightness(1.15) saturate(1.18);
}

.wheel-wrap.is-light-on.light-standard .flashlight-beam {
  opacity: 1;
}

.wheel-wrap.is-light-on.light-strong .flashlight-beam {
  opacity: 1;
  filter: brightness(1.28) saturate(1.08);
}

.wheel-wrap.is-light-on.light-strong .sector-glow.active {
  opacity: 1;
  filter: blur(8px) brightness(2.05) saturate(1.45);
}

.tips {
  position: fixed;
  left: 50%;
  bottom: 5%;
  z-index: 5;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
  transform: translateX(-50%);
}

@keyframes beamPulse {
  0%,
  100% {
    opacity: 0.8;
  }

  50% {
    opacity: 1;
  }
}

@keyframes corePulse {
  0%,
  100% {
    opacity: 0.7;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 680px) {
  .wheel-wrap.is-light-on {
    transform: translate(-14px, -50%) scale(0.78);
  }

  .wheel-wrap.is-light-on :deep(.ui-panel) {
    right: -250px;
    width: 220px;
  }
}
</style>
