<template>
  <div
    class="case-screen robot-scroll-screen"
    :style="{ '--screen-accent': caseItem?.accent || '#36f7ff' }"
  >
    <main class="screen-shell">
      <section
        ref="rootEl"
        class="robot-scroll-demo"
        :class="[`is-stage-${activeStage}`, { 'is-light-off': !lightEnabled }]"
      >
        <div ref="scrollTrackEl" class="robot-scroll-track">
          <div
            ref="pinEl"
            class="robot-scroll-pin"
            :class="{ 'is-draggable': canDragModel, 'is-dragging': dragState.active }"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerEnd"
            @pointercancel="handlePointerEnd"
            @lostpointercapture="handlePointerEnd"
          >
            <canvas ref="canvasEl" class="robot-canvas" aria-label="GSAP robot scroll showcase"></canvas>

            <svg
              class="robot-label-lines"
              :width="viewportState.width"
              :height="viewportState.height"
              :viewBox="`0 0 ${viewportState.width} ${viewportState.height}`"
              aria-hidden="true"
            >
              <line
                v-for="part in labelStates"
                :key="`${part.id}-line`"
                :x1="part.anchorX"
                :y1="part.anchorY"
                :x2="part.lineX"
                :y2="part.lineY"
                :style="{ opacity: getLineOpacity(part) }"
              />
            </svg>

            <div class="robot-label-layer" aria-hidden="true">
              <div
                v-for="part in labelStates"
                v-show="part.screenVisible && part.opacity > 0.001"
                :key="part.id"
                class="robot-label"
                :class="`is-${part.labelSide}`"
                :style="getLabelStyle(part)"
              >
                <strong>{{ part.label }}</strong>
                <span>{{ part.desc }}</span>
              </div>
            </div>

            <div class="robot-drag-hint" :style="{ opacity: canDragModel ? 1 : 0 }">支持旋转</div>
            <div v-if="loading" class="robot-status">LOADING GLB</div>
            <div v-else-if="loadError" class="robot-status is-error">{{ loadError }}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import {
  createScrollTimeline,
  project3DToScreen,
  registerGsap,
  scrollSceneCleanup,
} from '@/utils/gsapKit'
import { disposeModel } from '@/utils/modelKit'

const ROBOT_PARTS = [
  {
    id: 'antenna',
    label: '信号天线',
    desc: '接收环境信号',
    nodes: ['antenna_tip', 'antenna_stem'],
    stage: 'head',
    labelSide: 'right',
  },
  {
    id: 'eyes',
    label: '视觉传感器',
    desc: '双目识别',
    nodes: ['left_eye', 'right_eye'],
    stage: 'head',
    labelSide: 'left',
  },
  {
    id: 'face',
    label: '表情面板',
    desc: '状态反馈',
    nodes: ['face_plate', 'mouth'],
    stage: 'head',
    labelSide: 'right',
  },
  {
    id: 'core',
    label: '能量核心',
    desc: '胸部动力中枢',
    nodes: ['core_light'],
    stage: 'upper',
    labelSide: 'right',
  },
  {
    id: 'chest',
    label: '胸部面板',
    desc: '模块化装甲',
    nodes: ['chest_panel', 'torso'],
    stage: 'upper',
    labelSide: 'left',
  },
  {
    id: 'arm',
    label: '机械臂关节',
    desc: '多轴运动结构',
    nodes: ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_hand', 'right_hand'],
    stage: 'upper',
    labelSide: 'right',
  },
  {
    id: 'hip',
    label: '髋部稳定器',
    desc: '重心控制',
    nodes: ['hip_block', 'left_hip_joint', 'right_hip_joint'],
    stage: 'lower',
    labelSide: 'left',
  },
  {
    id: 'knee',
    label: '膝部驱动',
    desc: '步态支撑',
    nodes: ['left_knee', 'right_knee'],
    stage: 'lower',
    labelSide: 'right',
  },
  {
    id: 'foot',
    label: '足底支撑',
    desc: '稳定落地',
    nodes: ['left_foot', 'right_foot', 'thin_display_base'],
    stage: 'lower',
    labelSide: 'left',
  },
]

const ROBOT_MODEL_PATHS = ['/gltf/robot.glb', '/models/gltf/robot.glb']
const PART_FOCUS_WINDOWS = {
  antenna: [0.02, 0.16],
  eyes: [0.1, 0.25],
  face: [0.19, 0.34],
  core: [0.31, 0.45],
  chest: [0.39, 0.53],
  arm: [0.47, 0.62],
  hip: [0.6, 0.72],
  knee: [0.68, 0.8],
  foot: [0.75, 0.86],
}

const props = defineProps({
  caseItem: {
    type: Object,
    required: true,
  },
  lightOn: {
    type: Boolean,
    default: true,
  },
  activeModel: {
    type: Object,
    default: null,
  },
})

const rootEl = ref(null)
const scrollTrackEl = ref(null)
const pinEl = ref(null)
const canvasEl = ref(null)
const activeStage = ref('head')
const loading = ref(true)
const loadError = ref('')
const lightEnabled = ref(props.lightOn)
const canDragModel = ref(false)

const viewportState = reactive({
  width: 1,
  height: 1,
  isMobile: false,
})

const labelStates = reactive(ROBOT_PARTS.map((part) => ({
  ...part,
  opacity: 0,
  screenVisible: false,
  anchorX: 0,
  anchorY: 0,
  x: 0,
  y: 0,
  lineX: 0,
  lineY: 0,
})))

const cameraState = {
  position: new THREE.Vector3(0.14, 1.3, 2.65),
  target: new THREE.Vector3(0, 1.18, 0),
}

const effectState = {
  progress: 0,
  head: 1,
  upper: 0,
  lower: 0,
}
const rotationState = {
  x: -0.03,
  y: -0.1,
  z: 0,
}
const manualRotation = {
  x: 0,
  y: 0,
}
const dragState = reactive({
  active: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  startRotationX: 0,
  startRotationY: 0,
})

let scene = null
let camera = null
let renderer = null
let model = null
let timeline = null
let resizeObserver = null
let resizeHandler = null
let resizeRefreshId = 0
let resizeRefreshTimeoutId = 0
let visibilityHandler = null
let rafId = 0
let disposed = false
let dracoLoader = null
let ambientLight = null
let keyLight = null
let rimLight = null
let coreLight = null

const nodeMap = new Map()
const partAnchors = new Map()
const materialGroups = {
  core: [],
  eyes: [],
  joints: [],
}

const clock = new THREE.Clock()
const box = new THREE.Box3()
const partBox = new THREE.Box3()
const size = new THREE.Vector3()
const center = new THREE.Vector3()
const anchorWorld = new THREE.Vector3()
const anchorLocal = new THREE.Vector3()
const scratchWorld = new THREE.Vector3()

watch(
  () => props.lightOn,
  (value) => setLightEnabled(value),
  { immediate: true },
)

onMounted(async () => {
  await nextTick()

  try {
    registerGsap()
    initThree()
    bindResize()
    handleResize()
    await loadRobotModel()

    if (disposed) return

    createTimeline()
    applyStageProgress(0)
    startRenderLoop()
    loading.value = false
  } catch (error) {
    loading.value = false
    loadError.value = '模型加载失败'
  }
})

onBeforeUnmount(() => {
  disposeScene()
})

function initThree() {
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050814, 0.045)

  camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
  camera.position.copy(cameraState.position)
  camera.lookAt(cameraState.target)

  renderer = new THREE.WebGLRenderer({
    canvas: canvasEl.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor(0x050814, 0)

  ambientLight = new THREE.AmbientLight(0xb8c9ff, 0.72)
  keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(3.5, 4.2, 4.8)
  rimLight = new THREE.DirectionalLight(0x48f2ff, 2.3)
  rimLight.position.set(-3.5, 2.2, -3.8)
  coreLight = new THREE.PointLight(0x26eaff, 1.5, 5.5)
  coreLight.position.set(0, 0.45, 1.2)

  scene.add(ambientLight, keyLight, rimLight, coreLight)
  setLightEnabled(lightEnabled.value)
}

function bindResize() {
  if (typeof ResizeObserver !== 'undefined' && rootEl.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(rootEl.value)
  }

  resizeHandler = handleResize
  window.addEventListener('resize', resizeHandler, { passive: true })

  visibilityHandler = () => {
    if (document.hidden) {
      stopRenderLoop()
      return
    }

    startRenderLoop()
  }
  document.addEventListener('visibilitychange', visibilityHandler)
}

function handleResize() {
  if (!rootEl.value || !pinEl.value || !renderer || !camera) return

  const rect = rootEl.value.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  const isMobile = width <= 720
  const dprLimit = isMobile ? 1.35 : 1.8

  rootEl.value.style.setProperty('--robot-pin-height', `${height}px`)
  viewportState.width = width
  viewportState.height = height
  viewportState.isMobile = isMobile

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprLimit))
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()

  updateLabelProjection()
  scheduleScrollRefresh()
}

function scheduleScrollRefresh() {
  if (!timeline?.scrollTrigger) return

  if (resizeRefreshTimeoutId) {
    window.clearTimeout(resizeRefreshTimeoutId)
  }

  resizeRefreshTimeoutId = window.setTimeout(() => {
    resizeRefreshTimeoutId = 0

    if (resizeRefreshId) return

    resizeRefreshId = requestAnimationFrame(() => {
      resizeRefreshId = 0
      timeline?.scrollTrigger?.refresh?.()
    })
  }, 140)
}

async function loadRobotModel() {
  const loader = new GLTFLoader()
  dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  dracoLoader.setDecoderConfig({ type: 'wasm' })
  loader.setDRACOLoader(dracoLoader)

  let gltf = null
  let lastError = null

  for (const src of ROBOT_MODEL_PATHS) {
    try {
      gltf = await loader.loadAsync(src)
      break
    } catch (error) {
      lastError = error
    }
  }

  if (!gltf?.scene) {
    throw lastError || new Error('Robot model not found.')
  }

  model = gltf.scene
  model.name = 'RobotScrollModel'
  prepareModel(model)
  normalizeModel(model)
  scene.add(model)
  collectPartAnchors()
}

function prepareModel(root) {
  nodeMap.clear()
  materialGroups.core.length = 0
  materialGroups.eyes.length = 0
  materialGroups.joints.length = 0

  root.traverse((object) => {
    if (object.name) {
      nodeMap.set(object.name, object)
    }

    if (!object.isMesh) return

    object.frustumCulled = false
    object.material = cloneMaterials(object.material)
    cacheGlowMaterials(object)
  })
}

function cloneMaterials(material) {
  if (Array.isArray(material)) {
    return material.map((item) => item?.clone?.() || item)
  }

  return material?.clone?.() || material
}

function cacheGlowMaterials(object) {
  const name = object.name || ''
  const materials = Array.isArray(object.material) ? object.material : [object.material]

  materials.forEach((material) => {
    if (!material?.emissive) return

    if (name === 'core_light') {
      material.emissive.set(0x22efff)
      materialGroups.core.push(material)
      return
    }

    if (name === 'left_eye' || name === 'right_eye') {
      material.emissive.set(0x70f7ff)
      materialGroups.eyes.push(material)
      return
    }

    if (/shoulder|elbow|hand|hip|knee|foot/.test(name)) {
      material.emissive.set(0x35d8ff)
      materialGroups.joints.push(material)
    }
  })
}

function normalizeModel(root) {
  root.rotation.set(-0.03, -0.16, 0)
  root.updateMatrixWorld(true)
  box.setFromObject(root)

  if (box.isEmpty()) return

  box.getSize(size)
  const targetHeight = 3.35
  const scale = targetHeight / Math.max(size.y, 0.01)
  root.scale.setScalar(scale)
  root.updateMatrixWorld(true)

  box.setFromObject(root)
  box.getCenter(center)
  root.position.sub(center)
  root.position.x += viewportState.isMobile ? 0 : -0.1
  root.updateMatrixWorld(true)

  root.userData.baseY = root.position.y
}

function collectPartAnchors() {
  partAnchors.clear()
  model.updateMatrixWorld(true)

  ROBOT_PARTS.forEach((part) => {
    partBox.makeEmpty()

    part.nodes.forEach((nodeName) => {
      const node = nodeMap.get(nodeName)
      if (!node) return

      box.setFromObject(node)
      if (!box.isEmpty()) {
        partBox.union(box)
      }
    })

    if (partBox.isEmpty()) {
      partAnchors.set(part.id, new THREE.Vector3())
      return
    }

    partBox.getCenter(anchorWorld)
    anchorLocal.copy(anchorWorld)
    model.worldToLocal(anchorLocal)
    partAnchors.set(part.id, anchorLocal.clone())
  })
}

function createTimeline() {
  if (!rootEl.value || !scrollTrackEl.value || !pinEl.value || !model) return

  timeline?.scrollTrigger?.kill?.()
  timeline?.kill?.()

  const frames = getCameraFrames()

  cameraState.position.set(frames.headStart.position.x, frames.headStart.position.y, frames.headStart.position.z)
  cameraState.target.set(frames.headStart.target.x, frames.headStart.target.y, frames.headStart.target.z)
  Object.assign(rotationState, { x: -0.03, y: -0.1, z: 0 })
  manualRotation.x = 0
  manualRotation.y = 0
  model.rotation.set(rotationState.x, rotationState.y, rotationState.z)

  timeline = createScrollTimeline({
    trigger: scrollTrackEl.value,
    scroller: rootEl.value,
    pin: pinEl.value,
    pinSpacing: false,
    scrub: 0.8,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      applyStageProgress(self.progress)
      updateLabelProjection()
    },
    onRefresh: () => {
      updateLabelProjection()
    },
  })

  timeline
    .to(cameraState.position, { ...frames.headEnd.position, duration: 1, ease: 'sine.inOut' }, 0)
    .to(cameraState.target, { ...frames.headEnd.target, duration: 1, ease: 'sine.inOut' }, 0)
    .to(rotationState, { x: -0.035, y: 0.08, duration: 1, ease: 'sine.inOut' }, 0)
    .to(cameraState.position, { ...frames.upperStart.position, duration: 1, ease: 'power1.inOut' }, 1)
    .to(cameraState.target, { ...frames.upperStart.target, duration: 1, ease: 'power1.inOut' }, 1)
    .to(rotationState, { x: -0.018, y: 0.16, duration: 1, ease: 'power1.inOut' }, 1)
    .to(cameraState.position, { ...frames.upperEnd.position, duration: 0.7, ease: 'sine.inOut' }, 1.8)
    .to(cameraState.target, { ...frames.upperEnd.target, duration: 0.7, ease: 'sine.inOut' }, 1.8)
    .to(rotationState, { x: -0.015, y: 0.22, duration: 0.7, ease: 'sine.inOut' }, 1.8)
    .to(cameraState.position, { ...frames.lowerStart.position, duration: 0.9, ease: 'power1.inOut' }, 2.55)
    .to(cameraState.target, { ...frames.lowerStart.target, duration: 0.9, ease: 'power1.inOut' }, 2.55)
    .to(rotationState, { x: -0.012, y: 0.08, duration: 0.9, ease: 'power1.inOut' }, 2.55)
    .to(cameraState.position, { ...frames.lowerEnd.position, duration: 0.65, ease: 'sine.inOut' }, 3.35)
    .to(cameraState.target, { ...frames.lowerEnd.target, duration: 0.65, ease: 'sine.inOut' }, 3.35)
    .to(rotationState, { x: -0.01, y: 0.02, duration: 0.65, ease: 'sine.inOut' }, 3.35)
    .to(cameraState.position, { ...frames.full.position, duration: 0.85, ease: 'power2.out' }, 4.05)
    .to(cameraState.target, { ...frames.full.target, duration: 0.85, ease: 'power2.out' }, 4.05)
    .to(rotationState, { x: -0.02, y: 0.16, duration: 0.85, ease: 'power2.out' }, 4.05)
}

function getCameraFrames() {
  const mobile = viewportState.isMobile

  return {
    headStart: {
      position: { x: mobile ? 0.02 : 0.08, y: 1.34, z: mobile ? 2.84 : 2.34 },
      target: { x: 0, y: 1.18, z: 0 },
    },
    headEnd: {
      position: { x: mobile ? -0.02 : -0.06, y: 1.26, z: mobile ? 2.94 : 2.42 },
      target: { x: 0, y: 1.18, z: 0 },
    },
    upperStart: {
      position: { x: mobile ? 0.04 : 0.14, y: 0.55, z: mobile ? 3.38 : 2.86 },
      target: { x: 0, y: 0.42, z: 0 },
    },
    upperEnd: {
      position: { x: mobile ? 0.02 : 0.1, y: 0.22, z: mobile ? 3.56 : 3.02 },
      target: { x: 0, y: 0.1, z: 0 },
    },
    lowerStart: {
      position: { x: mobile ? 0.01 : 0.06, y: -0.56, z: mobile ? 3.98 : 3.42 },
      target: { x: 0, y: -0.86, z: 0 },
    },
    lowerEnd: {
      position: { x: mobile ? 0 : 0.04, y: -0.95, z: mobile ? 4.2 : 3.58 },
      target: { x: 0, y: -1.25, z: 0 },
    },
    full: {
      position: { x: mobile ? 0.02 : 0.08, y: 0.12, z: mobile ? 6.28 : 5.72 },
      target: { x: 0, y: -0.02, z: 0 },
    },
  }
}

function applyStageProgress(progress) {
  effectState.progress = progress
  effectState.head = getStageOpacity('head', progress)
  effectState.upper = getStageOpacity('upper', progress)
  effectState.lower = getStageOpacity('lower', progress)
  activeStage.value = getStageName(progress)
  canDragModel.value = progress >= 0.94

  if (!canDragModel.value) {
    manualRotation.x = 0
    manualRotation.y = 0
    dragState.active = false
  }

  const opacities = labelStates.map((part) => ({
    part,
    opacity: getPartOpacity(part, progress),
  }))
  const strongestMobileLabel = viewportState.isMobile
    ? opacities.reduce((current, item) => (item.opacity > current.opacity ? item : current), { opacity: 0, part: null }).part
    : null

  opacities.forEach(({ part, opacity }) => {
    part.opacity = !strongestMobileLabel || strongestMobileLabel.id === part.id ? opacity : 0
  })
}

function getStageName(progress) {
  if (progress < 0.31) return 'head'
  if (progress < 0.58) return 'upper'
  if (progress < 0.86) return 'lower'
  return 'full'
}

function getStageOpacity(stage, progress) {
  if (stage === 'head') {
    return 1 - smoothstep(0.29, 0.36, progress)
  }

  if (stage === 'upper') {
    return smoothstep(0.28, 0.36, progress) * (1 - smoothstep(0.58, 0.65, progress))
  }

  if (stage === 'lower') {
    return smoothstep(0.56, 0.64, progress) * (1 - smoothstep(0.84, 0.9, progress))
  }

  return 0
}

function getPartOpacity(part, progress) {
  const [start, end] = PART_FOCUS_WINDOWS[part.id] || [0, 0]
  const fade = 0.035

  return smoothstep(start, start + fade, progress) * (1 - smoothstep(end - fade, end, progress))
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1)
  return t * t * (3 - 2 * t)
}

function updateLabelProjection() {
  if (!model || !camera || !renderer || !pinEl.value) return

  model.updateMatrixWorld(true)

  const visibleParts = labelStates.filter((part) => part.opacity > 0.001 && isLabelAllowed(part))

  labelStates.forEach((part) => {
    if (part.opacity <= 0.001 || !isLabelAllowed(part)) {
      part.screenVisible = false
      return
    }

    const localAnchor = partAnchors.get(part.id)
    if (!localAnchor) {
      part.screenVisible = false
      return
    }

    scratchWorld.copy(localAnchor)
    model.localToWorld(scratchWorld)
    const projection = project3DToScreen(scratchWorld, camera, renderer, {
      referenceElement: pinEl.value,
      margin: 90,
    })

    if (!projection.visible) {
      part.screenVisible = false
      return
    }

    const stageIndex = Math.max(0, visibleParts.findIndex((item) => item.id === part.id))
    const labelPosition = getLabelPosition(part, projection, stageIndex, visibleParts.length)

    part.screenVisible = true
    part.anchorX = projection.x
    part.anchorY = projection.y
    part.x = labelPosition.x
    part.y = labelPosition.y
    part.lineX = labelPosition.lineX
    part.lineY = labelPosition.lineY
  })
}

function getLabelPosition(part, projection, stageIndex, stageTotal) {
  const width = viewportState.width
  const height = viewportState.height
  const labelWidth = viewportState.isMobile ? 154 : 194
  const labelHeight = viewportState.isMobile ? 58 : 64
  const edgeGap = viewportState.isMobile ? 18 : 32
  let x = edgeGap
  let y = projection.y - labelHeight / 2
  let lineX = x

  if (viewportState.isMobile) {
    const rightSide = part.labelSide !== 'left'
    x = rightSide ? width - labelWidth - edgeGap : edgeGap
    y = clamp(projection.y + (projection.y < height * 0.56 ? 80 : -112), 76, height - labelHeight - 28)
    lineX = rightSide ? x : x + labelWidth
  } else if (part.labelSide === 'left') {
    const stackOffset = (stageIndex - (stageTotal - 1) / 2) * 76
    x = clamp(Math.min(projection.x - labelWidth - 86, width * 0.29), edgeGap, width - labelWidth - edgeGap)
    y = clamp(projection.y + stackOffset - labelHeight / 2, 82, height - labelHeight - 38)
    lineX = x + labelWidth
  } else {
    const stackOffset = (stageIndex - (stageTotal - 1) / 2) * 76
    x = clamp(Math.max(projection.x + 86, width * 0.64), edgeGap, width - labelWidth - edgeGap)
    y = clamp(projection.y + stackOffset - labelHeight / 2, 82, height - labelHeight - 38)
    lineX = x
  }

  return {
    x,
    y,
    lineX,
    lineY: y + labelHeight / 2,
  }
}

function isLabelAllowed(part) {
  return Boolean(part)
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function startRenderLoop() {
  if (disposed || rafId || document.hidden) return
  clock.getDelta()
  rafId = requestAnimationFrame(renderLoop)
}

function stopRenderLoop() {
  if (!rafId) return
  cancelAnimationFrame(rafId)
  rafId = 0
}

function renderLoop() {
  if (disposed) return

  rafId = requestAnimationFrame(renderLoop)
  const elapsed = clock.getElapsedTime()

  if (model) {
    model.position.y = (model.userData.baseY || 0) + Math.sin(elapsed * 1.35) * 0.012
    model.rotation.set(
      rotationState.x + manualRotation.x,
      rotationState.y + manualRotation.y,
      rotationState.z,
    )
  }

  camera.position.copy(cameraState.position)
  camera.lookAt(cameraState.target)
  updateMaterialEffects(elapsed)
  updateLabelProjection()
  renderer.render(scene, camera)
}

function handlePointerDown(event) {
  if (!canDragModel.value || !model) return

  dragState.active = true
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY
  dragState.startRotationX = manualRotation.x
  dragState.startRotationY = manualRotation.y

  try {
    event.currentTarget?.setPointerCapture?.(event.pointerId)
  } catch (error) {
    // Synthetic events in tests may not have an active pointer capture target.
  }
}

function handlePointerMove(event) {
  if (!dragState.active || dragState.pointerId !== event.pointerId) return

  manualRotation.y = dragState.startRotationY + (event.clientX - dragState.startX) * 0.008
  manualRotation.x = clamp(dragState.startRotationX + (event.clientY - dragState.startY) * 0.004, -0.24, 0.18)
}

function handlePointerEnd(event) {
  if (dragState.pointerId !== null && event.pointerId !== dragState.pointerId) return

  dragState.active = false
  dragState.pointerId = null
}

function updateMaterialEffects(elapsed) {
  const pulse = 0.5 + Math.sin(elapsed * 3.7) * 0.5
  const headGlow = 0.25 + effectState.head * (0.7 + pulse * 0.24)
  const coreGlow = 0.2 + effectState.upper * (1.15 + pulse * 0.45)
  const jointGlow = 0.06 + Math.max(effectState.upper, effectState.lower) * (0.35 + pulse * 0.18)

  materialGroups.eyes.forEach((material) => {
    material.emissiveIntensity = headGlow
  })

  materialGroups.core.forEach((material) => {
    material.emissiveIntensity = coreGlow
  })

  materialGroups.joints.forEach((material) => {
    material.emissiveIntensity = jointGlow
  })

  if (coreLight) {
    coreLight.intensity = (lightEnabled.value ? 1.25 : 0.55) + effectState.upper * (0.7 + pulse * 0.35)
  }
}

function getLabelStyle(part) {
  return {
    opacity: part.screenVisible ? part.opacity : 0,
    transform: `translate3d(${part.x}px, ${part.y}px, 0)`,
  }
}

function getLineOpacity(part) {
  return part.screenVisible ? part.opacity : 0
}

function setLightEnabled(value) {
  lightEnabled.value = Boolean(value)
  const lightScale = lightEnabled.value ? 1 : 0.45

  if (ambientLight) ambientLight.intensity = 0.72 * lightScale
  if (keyLight) keyLight.intensity = 2.2 * lightScale
  if (rimLight) rimLight.intensity = 2.3 * lightScale
}

function disposeScene() {
  disposed = true

  if (resizeRefreshId) {
    cancelAnimationFrame(resizeRefreshId)
    resizeRefreshId = 0
  }
  if (resizeRefreshTimeoutId) {
    window.clearTimeout(resizeRefreshTimeoutId)
    resizeRefreshTimeoutId = 0
  }

  scrollSceneCleanup({
    timeline,
    resizeObserver,
    resizeTarget: window,
    resizeHandler,
    renderer,
    scene,
    model,
    disposeModel,
    stopRaf: stopRenderLoop,
    disposers: [
      () => dracoLoader?.dispose?.(),
      () => document.removeEventListener('visibilitychange', visibilityHandler),
    ],
  })

  timeline = null
  scene = null
  camera = null
  renderer = null
  model = null
  dracoLoader = null
  nodeMap.clear()
  partAnchors.clear()
}

function loadModel() {
  return Promise.resolve()
}

function previewModel() {}

defineExpose({
  loadModel,
  previewModel,
  setLightEnabled,
})
</script>

<style scoped>
.case-screen {
  position: relative;
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--screen-accent) 22%, transparent), transparent 34%),
    #08080c;
  color: #eafcff;
}

.screen-shell {
  width: min(calc(100% - 64px));
  height: min(calc(100vh - 58px));
  min-height: 420px;
  margin: 0 auto;
  padding-top: 58px;
  box-sizing: border-box;
}

.robot-scroll-demo {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 240px;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 52%, rgba(255, 255, 255, 0.08), transparent 42%),
    #08080c;
  scrollbar-width: none;
}

.robot-scroll-demo::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.robot-scroll-track {
  position: relative;
  min-height: 620%;
  width: 100%;
}

.robot-scroll-pin {
  position: relative;
  max-width: 100%;
  height: var(--robot-pin-height, 100%);
  min-height: 360px;
  overflow: hidden;
  border: 1px solid rgba(230, 237, 243, 0.12);
  background:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    radial-gradient(circle at center, color-mix(in srgb, var(--screen-accent) 15%, transparent), transparent 58%),
    #08080c;
  background-size: 40px 40px, 40px 40px, auto, auto;
  isolation: isolate;
  touch-action: pan-y;
}

.robot-scroll-pin.is-draggable {
  cursor: grab;
}

.robot-scroll-pin.is-dragging {
  cursor: grabbing;
}

.robot-scroll-pin::before,
.robot-scroll-pin::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: '';
  pointer-events: none;
}

.robot-scroll-pin::before {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 12% 88%, rgba(255, 255, 255, 0.035)),
    repeating-linear-gradient(180deg, transparent 0 7px, rgba(255, 255, 255, 0.025) 8px 9px);
  mix-blend-mode: screen;
}

.robot-scroll-pin::after {
  inset: 11% 13% 10%;
  border: 1px solid rgba(69, 232, 255, 0.12);
  background:
    radial-gradient(circle at 18% 20%, rgba(88, 255, 219, 0.16), transparent 24%),
    radial-gradient(circle at 82% 72%, rgba(58, 180, 255, 0.13), transparent 22%);
  filter: blur(0.2px);
}

.robot-drag-hint {
  position: absolute;
  right: 18px;
  bottom: 16px;
  z-index: 4;
  padding: 7px 10px;
  border: 1px solid rgba(101, 245, 255, 0.22);
  border-radius: 6px;
  background: rgba(5, 12, 18, 0.5);
  color: rgba(202, 250, 255, 0.72);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  pointer-events: none;
  transition: opacity 0.22s ease;
  backdrop-filter: blur(10px);
}

.robot-canvas,
.robot-label-lines,
.robot-label-layer {
  position: absolute;
  inset: 0;
}

.robot-canvas {
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
}

.robot-label-lines {
  z-index: 2;
  overflow: visible;
  pointer-events: none;
}

.robot-label-lines line {
  stroke: rgba(101, 245, 255, 0.82);
  stroke-width: 1.25;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 8px rgba(45, 231, 255, 0.45));
}

.robot-label-layer {
  z-index: 3;
  pointer-events: none;
}

.robot-label {
  position: absolute;
  width: 194px;
  min-height: 64px;
  padding: 13px 15px 12px;
  border: 1px solid rgba(113, 241, 255, 0.34);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(11, 30, 38, 0.82), rgba(7, 12, 20, 0.68)),
    rgba(5, 12, 18, 0.66);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 12px 34px rgba(0, 0, 0, 0.36),
    0 0 22px rgba(50, 231, 255, 0.12);
  backdrop-filter: blur(12px);
  color: #ecfeff;
  will-change: transform, opacity;
}

.robot-label::before {
  position: absolute;
  top: 12px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #62f6ff;
  box-shadow: 0 0 14px rgba(98, 246, 255, 0.9);
  content: '';
}

.robot-label.is-left::before {
  right: 12px;
}

.robot-label.is-right::before {
  left: 12px;
}

.robot-label strong {
  display: block;
  color: #f7ffff;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.robot-label span {
  display: block;
  margin-top: 7px;
  color: rgba(199, 246, 255, 0.72);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.robot-label.is-left {
  text-align: right;
}

.robot-status {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 5;
  min-width: 132px;
  padding: 10px 14px;
  border: 1px solid rgba(99, 245, 255, 0.28);
  border-radius: 8px;
  background: rgba(4, 12, 18, 0.68);
  color: rgba(225, 252, 255, 0.86);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-align: center;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(10px);
}

.robot-status.is-error {
  border-color: rgba(255, 104, 104, 0.46);
  color: #ffd6d6;
  letter-spacing: 0.04em;
}

.is-light-off .robot-scroll-pin {
  filter: saturate(0.78) brightness(0.82);
}

@media (max-width: 720px) {
  .screen-shell {
    width: calc(100% - 28px);
    height: calc(100vh - 92px);
    min-height: 360px;
    padding-top: 64px;
  }

  .robot-scroll-pin {
    min-height: 360px;
    background-size: 36px 36px, 36px 36px, auto, auto;
  }

  .robot-scroll-pin::after {
    inset: 9% 6% 12%;
  }

  .robot-label {
    width: 154px;
    min-height: 58px;
    padding: 11px 12px 10px;
  }

  .robot-label strong {
    font-size: 13px;
  }

  .robot-label span {
    margin-top: 6px;
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .robot-label-lines line {
    stroke-width: 1;
  }
}
</style>
