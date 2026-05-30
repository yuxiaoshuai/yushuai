<template>
  <div
    v-if="caseItem"
    class="case-screen-host"
    :class="{ 'is-scroll-screen': isScrollScreen }"
  >
    <RouterLink class="screen-back" to="/demo">返回案例</RouterLink>

    <div
      v-if="currentScreenComponent"
      class="screen-viewport"
      :class="{ 'is-wheel-expanded': lightOn }"
    >
      <component
        :is="currentScreenComponent"
        ref="screenRef"
        :case-item="caseItem"
        :light-on="lightOn"
        :active-model="activeModel"
      />
    </div>

    <div v-else class="missing-screen">
      <div>
        <p>大屏组件未配置</p>
        <RouterLink class="screen-back-inline" to="/demo">返回案例列表</RouterLink>
      </div>
    </div>

    <CyberWheel
      :items="caseWheelItems"
      :config="wheelConfig"
      :active-key="currentCaseId"
      :light-on="lightOn"
      storage-key="yushuai-case-screen-wheel"
      :position="wheelPosition"
      @select="handleSelect"
      @preview="handlePreview"
      @request-load="handleRequestLoad"
      @light-change="handleLightChange"
      @update:light-on="handleLightChange"
    />
  </div>

  <div v-else class="missing-screen">
    <div>
      <p>案例不存在</p>
      <RouterLink class="screen-back-inline" to="/demo">返回案例列表</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CyberWheel from '@/components/CyberWheel/CyberWheel.vue'
import { cases, findCase } from './caseData'
import FactoryRayInspectionCaseScreen from './screens/FactoryRayInspectionCaseScreen.vue'
import ModelViewerCaseScreen from './screens/ModelViewerCaseScreen.vue'
import RobotScrollShowcase from './screens/RobotScrollShowcase.vue'

const screenComponents = {
  FactoryRayInspectionCaseScreen,
  ModelViewerCaseScreen,
  RobotScrollShowcase,
}

const route = useRoute()
const router = useRouter()
const screenRef = ref(null)
const lightOn = ref(true)
const activeModel = ref(null)

const currentCaseId = computed(() => String(route.params.caseId || ''))
const caseItem = computed(() => findCase(currentCaseId.value))
const currentScreenComponent = computed(() => {
  if (!caseItem.value?.screenKey) return null
  return screenComponents[caseItem.value.screenKey] || null
})
const isScrollScreen = computed(() => caseItem.value?.screenMode === 'scroll')

const caseWheelItems = computed(() => cases.map((item, index) => ({
  key: item.id,
  label: item.wheelLabel || item.title,
  path: item.routePath || `/demo/${item.id}`,
  routePath: item.routePath || `/demo/${item.id}`,
  colorIndex: index,
  meta: {
    caseItem: item,
    screenKey: item.screenKey,
  },
})))

const wheelConfig = computed(() => ({
  defaultKey: currentCaseId.value,
  loadingMode: 'confirm',
  wakeupDelay: 500,
  wheelThreshold: 40,
  snapDuration: 450,
  lightIntensity: 'standard',
}))

const wheelPosition = {
  left: '30px',
  top: '50%',
  transform: 'translate(0, -50%)',
  zIndex: 70,
}

watch(
  () => [caseItem.value?.id, lightOn.value],
  async () => {
    await nextTick()
    screenRef.value?.setLightEnabled?.(lightOn.value)
  },
  { immediate: true },
)

function handleSelect(payload) {
  activeModel.value = payload
}

function handleLightChange(value) {
  lightOn.value = Boolean(value)
  screenRef.value?.setLightEnabled?.(lightOn.value)
}

async function handleRequestLoad(payload) {
  activeModel.value = payload
  const routePath = payload.routePath || `/demo/${payload.key}`

  try {
    if (route.path !== routePath) {
      await router.push(routePath)
    }
  } catch (error) {
    // Duplicate navigations or interrupted route updates should not break the screen.
  }

  await nextTick()
  screenRef.value?.loadModel?.(payload)
}

function handlePreview(payload) {
  activeModel.value = payload

  if (typeof screenRef.value?.previewCase === 'function') {
    screenRef.value.previewCase(payload.key)
    return
  }

  screenRef.value?.previewModel?.(payload)
}
</script>

<style scoped>
.case-screen-host {
  position: relative;
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: #08080c;
}

.case-screen-host.is-scroll-screen {
  height: auto;
  max-height: none;
  min-height: 100vh;
  overflow: visible;
}

.screen-viewport {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  margin-left: 0;
  overflow: hidden;
  transition:
    width 0.48s cubic-bezier(0.22, 1, 0.36, 1),
    margin-left 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}

.case-screen-host.is-scroll-screen .screen-viewport {
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: none;
  min-height: 100vh;
  overflow: visible;
}

.screen-viewport.is-wheel-expanded {
  width: max(0px, calc(100vw - 460px));
  margin-left: 460px;
}

.case-screen-host.is-scroll-screen .screen-viewport.is-wheel-expanded {
  width: max(0px, calc(100% - 460px));
  min-width: 0;
}

.screen-back {
  position: fixed;
  left: 18px;
  top: 18px;
  z-index: 90;
  padding: 8px 12px;
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: 8px;
  background: rgba(15, 15, 22, 0.72);
  color: rgba(230, 237, 243, 0.76);
  text-decoration: none;
  backdrop-filter: blur(8px);
}

.screen-back:hover {
  border-color: rgba(255, 211, 90, 0.52);
  color: #fff;
}

.missing-screen {
  display: grid;
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
  place-items: center;
  overflow: hidden;
  background: #08080c;
  color: #fff;
  text-align: center;
}

.missing-screen p {
  margin: 0 0 14px;
  font-size: 22px;
  font-weight: 650;
}

.screen-back-inline {
  color: #40b4ff;
}

@media (max-width: 900px) {
  .case-screen-host.is-scroll-screen .screen-viewport.is-wheel-expanded {
    width: 100%;
    margin-left: 0;
  }
}
</style>
