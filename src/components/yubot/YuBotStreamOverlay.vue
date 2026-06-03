<template>
  <div
    ref="rootRef"
    class="yubot-stream-overlay"
    :class="{ 'is-interactive': interactive }"
    aria-hidden="true"
  >
    <div ref="containerRef" class="yubot-stream-overlay__canvas"></div>
    <div class="yubot-stream-overlay__action">
      <button
        class="yubot-stream-overlay__enter"
        :class="{ 'is-visible': enterButtonVisible }"
        type="button"
        :disabled="!enterButtonVisible"
        @click.stop="handleEnterPlanet"
      >
        进入星球
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  modelBasePath: {
    type: String,
    default: '/models/yubot/stream',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['stage-change', 'loaded', 'error'])

const rootRef = ref(null)
const containerRef = ref(null)
const interactive = ref(false)
const enterButtonVisible = ref(false)

const STAGES = computed(() => [
  {
    key: 'face',
    label: '01 面罩 / 眼睛 / 嘴巴',
    url: `${props.modelBasePath}/stage-01-face-v3.glb`,
    camera: { z: 2.15, y: 1.32, targetY: 1.22 },
    pause: 0,
    appear: 620,
  },
  {
    key: 'head',
    label: '02 头罩 / 头部外壳',
    url: `${props.modelBasePath}/stage-02-head-shell-v3.glb`,
    camera: { z: 3.0, y: 1.18, targetY: 1.1 },
    pause: 180,
    appear: 520,
  },
  {
    key: 'upper',
    label: '03 上部身体 / 胸腔',
    url: `${props.modelBasePath}/stage-03-upper-body-v3.glb`,
    camera: { z: 4.25, y: 0.82, targetY: 0.62 },
    pause: 120,
    appear: 380,
  },
  {
    key: 'arms',
    label: '04 手臂 / 肩部',
    url: `${props.modelBasePath}/stage-04-arms-v3.glb`,
    camera: { z: 5.35, y: 0.55, targetY: 0.35 },
    pause: 110,
    appear: 360,
  },
  {
    key: 'lower',
    label: '05 下部身体 / 腰胯',
    url: `${props.modelBasePath}/stage-05-lower-body-v3.glb`,
    camera: { z: 6.25, y: 0.32, targetY: 0.05 },
    pause: 100,
    appear: 340,
  },
  {
    key: 'legs',
    label: '06 腿部 / 鞋子',
    url: `${props.modelBasePath}/stage-06-legs-v3.glb`,
    camera: { z: 8.45, y: 0.16, targetY: -0.08 },
    pause: 0,
    appear: 360,
  },
])

let scene = null
let camera = null
let renderer = null
let controls = null
let robotRoot = null
let loader = null
let dracoLoader = null
let resizeObserver = null
let animationFrameId = null
let currentCameraTween = null
let cameraPathTween = null
let loadingRunId = 0
let faceFx = null
let accentFx = null
let initialized = false
let disposed = true
let userControlReady = false
let enterButtonTimerId = null

const transientFrameIds = new Set()

function init() {
  if (initialized || !containerRef.value) return
  disposed = false
  initThree()
  initResizeObserver()
  animate()

  if (props.autoStart) {
    startLoading()
  }
}

function initThree() {
  initScene()
  initRenderer()
  initControls()
  loader = new GLTFLoader()
  dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  loader.setDRACOLoader(dracoLoader)
  initialized = true
  resize()
}

function initScene() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100)
  camera.position.set(0, 1.32, 2.15)

  robotRoot = new THREE.Group()
  robotRoot.name = 'YuBot_Root_Streamed'
  robotRoot.scale.setScalar(0.045)
  robotRoot.position.y = -1.82
  scene.add(robotRoot)

  const ambientLight = new THREE.HemisphereLight(0xd8f6ff, 0x11121a, 2.2)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
  keyLight.position.set(3, 5, 4)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x66ddff, 2.4)
  rimLight.position.set(-4, 2, -3)
  scene.add(rimLight)
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })

  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  containerRef.value.appendChild(renderer.domElement)
  renderer.domElement.addEventListener('pointerdown', cancelAutoCameraOnUserIntent, { passive: true })
  renderer.domElement.addEventListener('wheel', cancelAutoCameraOnUserIntent, { passive: true })
  renderer.domElement.addEventListener('touchstart', cancelAutoCameraOnUserIntent, { passive: true })
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.target.set(0, 1.2, 0)
  controls.maxDistance = 12
  controls.minDistance = 1.2
  controls.enabled = false
}

function initResizeObserver() {
  resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(containerRef.value)
}

function resize() {
  if (!containerRef.value || !renderer || !camera) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  if (!width || !height) return

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

async function startLoading() {
  if (!loader || !robotRoot) return

  const runId = ++loadingRunId
  hideEnterPlanetButton()
  clearRobotRoot()
  faceFx = null
  accentFx = null
  lockUserControl()
  camera.position.set(0, 1.32, 2.15)
  controls.target.set(0, 1.22, 0)
  startCurvedCameraPullback(5600)

  try {
    const stages = STAGES.value
    for (let index = 0; index < stages.length; index += 1) {
      if (runId !== loadingRunId || disposed) return

      const stage = stages[index]
      emit('stage-change', { stage, index, state: 'active' })
      const gltf = await loadGLTF(stage.url)
      if (runId !== loadingRunId || disposed) {
        disposeObject(gltf.scene)
        return
      }

      processLoadedScene(gltf, stage.key, stage.appear || 420, runId)

      if (index === stages.length - 1) {
        addPostLoadAccentLineGlows(80)
        tweenRobotScale(0.0415, 820, runId)
        unlockUserControl({ keepAutoCamera: true })
        scheduleEnterPlanetButton(Math.max(stage.appear || 420, 960), runId)
      }

      if (index === 0) {
        addFaceTechGlow(180)
        await wait(1040)
      }

      emit('stage-change', { stage, index, state: 'done' })
      if (stage.pause) {
        await wait(stage.pause)
      }
    }
  } catch (error) {
    if (runId === loadingRunId && !disposed) {
      emit('error', error)
    }
  }
}

function hideEnterPlanetButton() {
  enterButtonVisible.value = false
  if (enterButtonTimerId) {
    window.clearTimeout(enterButtonTimerId)
    enterButtonTimerId = null
  }
}

function showEnterPlanetButton() {
  enterButtonVisible.value = true
}

function scheduleEnterPlanetButton(delay = 960, runId = loadingRunId) {
  if (enterButtonTimerId) {
    window.clearTimeout(enterButtonTimerId)
  }

  enterButtonTimerId = window.setTimeout(() => {
    enterButtonTimerId = null
    if (runId === loadingRunId && !disposed) {
      showEnterPlanetButton()
    }
  }, delay)
}

function handleEnterPlanet() {
  window.location.assign('/demo')
}

function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject)
  })
}

function processLoadedScene(gltf, stageKey, appearDuration = 420, runId = loadingRunId) {
  const group = gltf.scene

  group.traverse((object) => {
    if (!object.isMesh) return

    object.castShadow = false
    object.receiveShadow = false
    object.frustumCulled = true

    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.forEach((material) => {
      if (!material) return
      if (material.transparent || material.opacity < 1 || object.name.includes('mat07')) {
        material.transparent = true
        material.opacity = Math.min(material.opacity || 0.45, 0.45)
        material.depthWrite = false
        material.side = THREE.DoubleSide
        object.renderOrder = 20
      }
      material.needsUpdate = true
    })
  })

  group.name = `YuBot_${stageKey}`
  robotRoot.add(group)
  group.scale.setScalar(0.985)

  const start = performance.now()
  const tick = () => {
    if (disposed || runId !== loadingRunId) return

    const t = Math.min((performance.now() - start) / appearDuration, 1)
    const k = ease(t)
    group.scale.setScalar(0.985 + 0.015 * k)
    if (t < 1) {
      requestTransientFrame(tick)
    }
  }
  tick()
}

function addFaceTechGlow(bootDelay = 180) {
  if (faceFx) faceFx.removeFromParent()

  faceFx = new THREE.Group()
  faceFx.name = 'Face_Tech_Glow_Overlay_Mesh_Fitted_Boot_v6'
  faceFx.userData.bootStart = performance.now() + bootDelay
  faceFx.userData.meshOpenDuration = 560
  faceFx.userData.lightDelay = 70
  faceFx.userData.lightOnDuration = 190
  faceFx.userData.mouthDelay = 120

  const eyeAnchor = getObjectBoxAnchor('robot_058_pair_helmet_back_detail_back_mat05')
  const mouthAnchor = getObjectBoxAnchor('robot_015_center_head_back_detail_back_mat05')

  if (eyeAnchor) {
    cloneAndBoostGlowMaterial(eyeAnchor.obj, 0.92)
    const eyePivot = createCenteredPivotForMesh(
      eyeAnchor.obj,
      'Eye_Mesh_Closed_To_Open_Pivot_robot_058_pair_helmet_back_detail_back_mat05',
    )

    if (eyePivot) {
      eyePivot.scale.y = 0.035
      eyePivot.scale.x = 1.025
      eyePivot.userData.baseScale = new THREE.Vector3(1, 1, 1)
      faceFx.userData.eyePivot = eyePivot
    }

    faceFx.userData.eyeGlow = makeFittedMeshGlow(eyeAnchor, {
      name: 'Eye_Glow_Fitted_To_robot_058_pair_helmet_back_detail_back_mat05',
      kind: 'eye-contour',
      opacity: 0.92,
      inflate: 0.032,
      edgeSoftness: 0.078,
    })
    faceFx.userData.eyeAura = makeFittedAura(eyeAnchor, {
      name: 'Eye_Soft_Aura_Fitted_To_robot_058_pair_helmet_back_detail_back_mat05',
      opacity: 0.21,
      inflate: 0.13,
      edgeSoftness: 0.22,
    })
    faceFx.userData.eyeLight = makeBoundPointLight(eyeAnchor, {
      name: 'Eye_Point_Light_Bound_To_robot_058_pair_helmet_back_detail_back_mat05',
      intensity: 1.45,
      distance: Math.max(eyeAnchor.size.x * 0.17, 1.35),
      zOffset: 0.18,
    })
  }

  if (mouthAnchor) {
    cloneAndBoostGlowMaterial(mouthAnchor.obj, 0.4)
    faceFx.userData.mouthGlow = makeFittedMeshGlow(mouthAnchor, {
      name: 'Mouth_Glow_Fitted_To_robot_015_center_head_back_detail_back_mat05',
      kind: 'mouth-contour',
      opacity: 0.48,
      inflate: 0.025,
      edgeSoftness: 0.12,
    })
    faceFx.userData.mouthAura = makeFittedAura(mouthAnchor, {
      name: 'Mouth_Soft_Aura_Fitted_To_robot_015_center_head_back_detail_back_mat05',
      opacity: 0.12,
      inflate: 0.075,
      edgeSoftness: 0.24,
    })
    faceFx.userData.mouthLight = makeBoundPointLight(mouthAnchor, {
      name: 'Mouth_Point_Light_Bound_To_robot_015_center_head_back_detail_back_mat05',
      intensity: 0.5,
      distance: Math.max(mouthAnchor.size.x * 0.16, 1.1),
      zOffset: 0.14,
    })
  }

  robotRoot.add(faceFx)
}

function animateFaceGlow(now) {
  if (!faceFx) return

  const bootStart = faceFx.userData.bootStart ?? now
  const elapsed = now - bootStart
  const meshOpenDuration = faceFx.userData.meshOpenDuration || 560
  const lightDelay = faceFx.userData.lightDelay || 70
  const lightOnDuration = faceFx.userData.lightOnDuration || 190
  const mouthDelay = faceFx.userData.mouthDelay || 120

  const meshT = clamp01(elapsed / meshOpenDuration)
  const openK = clamp01(easeOutBack(meshT))
  const lightT = clamp01((elapsed - meshOpenDuration - lightDelay) / lightOnDuration)
  const lightK = easeOutExpo(lightT)
  const mouthT = clamp01(
    (elapsed - meshOpenDuration - lightDelay + mouthDelay) / (lightOnDuration + 70),
  )
  const mouthK = easeOutExpo(mouthT)

  const eyePivot = faceFx.userData.eyePivot
  if (eyePivot) {
    const bootShake = meshT > 0 && meshT < 0.82 ? Math.sin(now * 0.052) * (1 - meshT) * 0.006 : 0
    eyePivot.scale.y = 0.035 + 0.965 * openK + bootShake
    eyePivot.scale.x = 1.025 - 0.025 * openK
  }

  const pulse = 0.9 + Math.sin(now * 0.006) * 0.1
  const bootFlash = lightT > 0 && lightT < 1 ? 1 + Math.sin(lightT * Math.PI) * 0.85 : 1
  const scan = lightT <= 0 ? -0.15 : Math.min(1.12, lightT * 1.18 - 0.06)

  updateGlowMesh(faceFx.userData.eyeGlow, openK, lightK, scan, pulse * bootFlash, 1)
  updateGlowMesh(faceFx.userData.eyeAura, Math.max(openK - 0.04, 0), lightK * 0.92, scan, pulse * bootFlash, 0.88)
  updateGlowMesh(faceFx.userData.mouthGlow, 1, mouthK, scan, pulse * bootFlash, 0.86)
  updateGlowMesh(faceFx.userData.mouthAura, 1, mouthK * 0.88, scan, pulse * bootFlash, 0.72)

  if (faceFx.userData.eyeLight) {
    const base = faceFx.userData.eyeLight.userData.baseIntensity || 1
    faceFx.userData.eyeLight.intensity = base * lightK * bootFlash * (0.92 + Math.sin(now * 0.005) * 0.08)
  }

  if (faceFx.userData.mouthLight) {
    const base = faceFx.userData.mouthLight.userData.baseIntensity || 1
    faceFx.userData.mouthLight.intensity = base * mouthK * (0.84 + Math.sin(now * 0.0046) * 0.12)
  }

  setMeshEmission('robot_058_pair_helmet_back_detail_back_mat05', lightK * bootFlash, 0.82, now)
  setMeshEmission('robot_015_center_head_back_detail_back_mat05', mouthK, 0.36, now)
}

function updateGlowMesh(mesh, revealValue, powerValue, scan, pulse, opacityMultiplier = 1) {
  if (!mesh?.material?.uniforms) return

  const { uniforms } = mesh.material
  uniforms.uReveal.value = clamp01(revealValue)
  uniforms.uPower.value = clamp01(powerValue)
  uniforms.uScan.value = scan
  uniforms.uPulse.value = pulse
  uniforms.uOpacity.value = (mesh.userData.baseOpacity || 0.5) * opacityMultiplier
}

function setMeshEmission(name, power, baseFallback, now) {
  const object = robotRoot?.getObjectByName(name)
  if (!object?.material) return

  const materials = Array.isArray(object.material) ? object.material : [object.material]
  materials.forEach((material) => {
    if ('emissiveIntensity' in material) {
      const base = material.userData.baseEmissiveIntensity || baseFallback
      material.emissiveIntensity = base * power * (0.78 + Math.sin(now * 0.0055) * 0.12)
    }
  })
}

function inflateGeometryAlongNormals(geometry, amount = 0.018) {
  const position = geometry.attributes.position
  let normal = geometry.attributes.normal
  if (!position) return geometry

  if (!normal) {
    geometry.computeVertexNormals()
    normal = geometry.attributes.normal
  }

  for (let index = 0; index < position.count; index += 1) {
    position.setXYZ(
      index,
      position.getX(index) + normal.getX(index) * amount,
      position.getY(index) + normal.getY(index) * amount,
      position.getZ(index) + normal.getZ(index) * amount,
    )
  }

  position.needsUpdate = true
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function createContourGlowMaterial({
  color = 0x66e7ff,
  opacity = 0.88,
  minX = -1,
  maxX = 1,
  minY = -1,
  maxY = 1,
  edgeSoftness = 0.1,
}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uReveal: { value: 0.02 },
      uPower: { value: 0 },
      uScan: { value: -0.2 },
      uPulse: { value: 1 },
      uMinX: { value: minX },
      uMaxX: { value: maxX },
      uMinY: { value: minY },
      uMaxY: { value: maxY },
      uEdgeSoftness: { value: edgeSoftness },
    },
    vertexShader: `
      varying vec3 vLocalPosition;
      varying vec3 vNormalView;
      void main() {
        vLocalPosition = position;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uReveal;
      uniform float uPower;
      uniform float uScan;
      uniform float uPulse;
      uniform float uMinX;
      uniform float uMaxX;
      uniform float uMinY;
      uniform float uMaxY;
      uniform float uEdgeSoftness;
      varying vec3 vLocalPosition;
      varying vec3 vNormalView;

      void main() {
        float centerY = (uMinY + uMaxY) * 0.5;
        float halfY = max((uMaxY - uMinY) * 0.5, 0.0001);
        float widthX = max(uMaxX - uMinX, 0.0001);

        float normalizedDistanceFromCenter = abs((vLocalPosition.y - centerY) / halfY);
        float aperture = mix(0.025, 1.0, clamp(uReveal, 0.0, 1.0));
        float visibleMask = smoothstep(aperture + uEdgeSoftness, aperture - uEdgeSoftness, normalizedDistanceFromCenter);

        float x01 = clamp((vLocalPosition.x - uMinX) / widthX, 0.0, 1.0);
        float scan = 1.0 - smoothstep(0.0, 0.075, abs(x01 - uScan));
        scan *= smoothstep(0.02, 0.35, uPower);

        float centerLine = 1.0 - smoothstep(0.0, 0.30, normalizedDistanceFromCenter);
        float rim = pow(1.0 - abs(vNormalView.z), 1.45) * 0.30;
        float bootPower = mix(0.0, 1.0, clamp(uPower, 0.0, 1.0));
        float flash = scan * 0.75;
        float alpha = (0.35 + centerLine * 0.55 + rim + flash) * visibleMask * uOpacity * uPulse * bootPower;

        vec3 glowColor = uColor * (1.0 + scan * 1.35 + bootPower * 0.18);
        gl_FragColor = vec4(glowColor, alpha);
      }
    `,
  })
}

function getObjectBoxAnchor(objectName) {
  const object = robotRoot.getObjectByName(objectName)
  if (!object) {
    console.warn(`[YuBot] 未找到目标 mesh：${objectName}，将跳过对应贴合光效。`)
    return null
  }

  robotRoot.updateMatrixWorld(true)
  object.updateWorldMatrix(true, true)

  const box = new THREE.Box3().setFromObject(object)
  const centerWorld = new THREE.Vector3()
  const sizeWorld = new THREE.Vector3()
  box.getCenter(centerWorld)
  box.getSize(sizeWorld)

  const centerLocal = robotRoot.worldToLocal(centerWorld.clone())
  const scale = robotRoot.getWorldScale(new THREE.Vector3())
  const sizeLocal = new THREE.Vector3(
    sizeWorld.x / Math.max(scale.x, 0.0001),
    sizeWorld.y / Math.max(scale.y, 0.0001),
    sizeWorld.z / Math.max(scale.z, 0.0001),
  )

  return { obj: object, box, center: centerLocal, size: sizeLocal }
}

function createCenteredPivotForMesh(target, pivotName) {
  if (!target?.parent) return null

  robotRoot.updateMatrixWorld(true)
  target.updateWorldMatrix(true, true)

  const parent = target.parent
  const targetWorld = target.matrixWorld.clone()
  const box = new THREE.Box3().setFromObject(target)
  const centerWorld = new THREE.Vector3()
  box.getCenter(centerWorld)
  const centerInParent = parent.worldToLocal(centerWorld.clone())

  const pivot = new THREE.Group()
  pivot.name = pivotName || `${target.name}_Boot_Open_Pivot`
  pivot.position.copy(centerInParent)
  parent.add(pivot)
  pivot.updateMatrixWorld(true)

  parent.remove(target)
  pivot.add(target)
  const localMatrix = new THREE.Matrix4().copy(pivot.matrixWorld).invert().multiply(targetWorld)
  localMatrix.decompose(target.position, target.quaternion, target.scale)
  target.updateMatrixWorld(true)
  pivot.userData.bootTargetMeshName = target.name
  return pivot
}

function cloneAndBoostGlowMaterial(object, baseIntensity = 0.75) {
  if (!object?.isMesh || !object.material) return

  const cloneOne = (material) => {
    const next = material.clone()
    if ('emissive' in next) next.emissive = new THREE.Color(0x66e7ff)
    if ('emissiveIntensity' in next) next.emissiveIntensity = 0
    next.userData.baseEmissiveIntensity = baseIntensity
    next.needsUpdate = true
    return next
  }

  object.material = Array.isArray(object.material) ? object.material.map(cloneOne) : cloneOne(object.material)
  object.userData.glowTarget = true
}

function makeFittedMeshGlow(anchor, options = {}) {
  const target = anchor.obj
  if (!target?.isMesh || !target.geometry) return null

  target.geometry.computeBoundingBox()
  const localBox = target.geometry.boundingBox.clone()
  const glowGeometry = target.geometry.clone()
  inflateGeometryAlongNormals(glowGeometry, options.inflate ?? 0.026)

  const glowMaterial = createContourGlowMaterial({
    color: options.color ?? 0x66e7ff,
    opacity: options.opacity ?? 0.82,
    minX: localBox.min.x,
    maxX: localBox.max.x,
    minY: localBox.min.y,
    maxY: localBox.max.y,
    edgeSoftness: options.edgeSoftness ?? 0.1,
  })

  const glow = new THREE.Mesh(glowGeometry, glowMaterial)
  glow.name = options.name || `${target.name}_Fitted_Contour_Glow`
  glow.renderOrder = options.renderOrder ?? 72
  glow.frustumCulled = false
  glow.userData.baseOpacity = options.opacity ?? 0.82
  glow.userData.glowKind = options.kind || 'contour'
  glow.userData.targetMeshName = target.name
  target.add(glow)
  return glow
}

function makeFittedAura(anchor, options = {}) {
  const target = anchor.obj
  if (!target?.isMesh || !target.geometry) return null

  target.geometry.computeBoundingBox()
  const localBox = target.geometry.boundingBox.clone()
  const auraGeometry = target.geometry.clone()
  inflateGeometryAlongNormals(auraGeometry, options.inflate ?? 0.09)

  const auraMaterial = createContourGlowMaterial({
    color: options.color ?? 0x66e7ff,
    opacity: options.opacity ?? 0.22,
    minX: localBox.min.x,
    maxX: localBox.max.x,
    minY: localBox.min.y,
    maxY: localBox.max.y,
    edgeSoftness: options.edgeSoftness ?? 0.18,
  })

  const aura = new THREE.Mesh(auraGeometry, auraMaterial)
  aura.name = options.name || `${target.name}_Fitted_Soft_Aura`
  aura.renderOrder = options.renderOrder ?? 68
  aura.frustumCulled = false
  aura.userData.baseOpacity = options.opacity ?? 0.22
  aura.userData.glowKind = 'aura'
  aura.userData.targetMeshName = target.name
  target.add(aura)
  return aura
}

function makeBoundPointLight(anchor, options = {}) {
  const light = new THREE.PointLight(
    options.color ?? 0x66e7ff,
    0,
    options.distance ?? Math.max(anchor.size.x * 0.18, 1.2),
  )

  light.name = options.name || `${anchor.obj.name}_Bound_Point_Light`
  light.userData.baseIntensity = options.intensity ?? 1
  light.userData.glowKind = 'point-light'
  anchor.obj.add(light)

  const localBox = anchor.obj.geometry?.boundingBox
  if (localBox) {
    const center = new THREE.Vector3()
    localBox.getCenter(center)
    light.position.copy(center)
    light.position.z += options.zOffset ?? 0.12
  }

  return light
}

const ACCENT_LINE_TARGETS = [
  {
    sourceName: 'robot_027_pair_head_helmet_shell_middle_mat00',
    label: 'headphone-gap-line',
    mode: 'mesh',
    color: 0x6be9ff,
    opacity: 0.52,
    auraOpacity: 0.12,
    intensity: 0.3,
    inflate: 0.018,
    auraInflate: 0.07,
    delay: 0,
  },
  {
    sourceName: 'robot_023_pair_helmet_shell_full_depth_mat03',
    label: 'helmet-top-line-left',
    mode: 'region',
    region: {
      x: [0.18, 0.43],
      y: [0.86, 1],
      z: [0.42, 0.82],
      minTriangles: 4,
    },
    color: 0x6be9ff,
    opacity: 0.5,
    auraOpacity: 0.1,
    intensity: 0.24,
    inflate: 0.016,
    auraInflate: 0.07,
    delay: 80,
  },
  {
    sourceName: 'robot_023_pair_helmet_shell_full_depth_mat03',
    label: 'helmet-top-line-right',
    mode: 'region',
    region: {
      x: [0.57, 0.82],
      y: [0.86, 1],
      z: [0.42, 0.82],
      minTriangles: 4,
    },
    color: 0x6be9ff,
    opacity: 0.5,
    auraOpacity: 0.1,
    intensity: 0.24,
    inflate: 0.016,
    auraInflate: 0.07,
    delay: 110,
  },
  {
    sourceName: 'robot_000_pair_leg_detail_middle_mat00',
    label: 'leg-line-upper',
    mode: 'mesh',
    color: 0x8fffe0,
    opacity: 0.56,
    auraOpacity: 0.12,
    intensity: 0.28,
    inflate: 0.014,
    auraInflate: 0.062,
    delay: 180,
  },
  {
    sourceName: 'robot_007_pair_leg_pair_middle_mat04',
    label: 'leg-line-lower',
    mode: 'mesh',
    color: 0x8fffe0,
    opacity: 0.48,
    auraOpacity: 0.1,
    intensity: 0.22,
    inflate: 0.012,
    auraInflate: 0.056,
    delay: 230,
  },
]

function removeExistingChildByName(parent, childName) {
  if (!parent) return

  const old = parent.children.find((child) => child.name === childName)
  if (!old) return

  parent.remove(old)
  disposeObject(old)
}

function addPostLoadAccentGlows(bootDelay = 80) {
  if (accentFx) {
    accentFx.removeFromParent()
    disposeObject(accentFx)
  }

  accentFx = new THREE.Group()
  accentFx.name = 'Post_Load_Thin_Mesh_Line_Glows_v9'
  accentFx.userData.bootStart = performance.now() + bootDelay
  accentFx.userData.lightOnDuration = 360
  accentFx.userData.items = findAccentLineTargets()

  robotRoot.add(accentFx)
}

function addPostLoadAccentLineGlows(bootDelay = 80) {
  addPostLoadAccentGlows(bootDelay)
}

function findAccentLineTargets() {
  return ACCENT_LINE_TARGETS.map((config) => {
    const sourceMesh = robotRoot.getObjectByName(config.sourceName)
    if (!sourceMesh?.isMesh) {
      console.warn('[YuBot] accent line target not found', config.label)
      return null
    }

    return config.mode === 'region'
      ? createThinRegionGlow(sourceMesh, config)
      : createIndependentLineGlow(sourceMesh, config)
  }).filter(Boolean)
}

function createIndependentLineGlow(sourceMesh, config) {
  if (!isValidAccentLineMesh(sourceMesh)) {
    console.warn('[YuBot] accent line target not found', config.label)
    return null
  }

  const anchor = getObjectBoxAnchor(config.sourceName)
  if (!anchor) {
    console.warn('[YuBot] accent line target not found', config.label)
    return null
  }

  removeExistingChildByName(anchor.obj, `${config.label}_Fitted_Line_Glow`)
  removeExistingChildByName(anchor.obj, `${config.label}_Soft_Aura`)
  removeExistingChildByName(anchor.obj, `${config.label}_Point_Light`)

  cloneAndBoostGlowMaterial(anchor.obj, config.intensity ?? 0.26)

  return {
    targetName: config.sourceName,
    lineGlow: makeFittedMeshGlow(anchor, {
      name: `${config.label}_Fitted_Line_Glow`,
      kind: 'post-load-line',
      color: config.color ?? 0x6be9ff,
      opacity: config.opacity ?? 0.52,
      inflate: config.inflate ?? 0.016,
      edgeSoftness: 0.055,
      renderOrder: 78,
    }),
    aura: makeFittedAura(anchor, {
      name: `${config.label}_Soft_Aura`,
      color: config.color ?? 0x6be9ff,
      opacity: config.auraOpacity ?? 0.12,
      inflate: config.auraInflate ?? 0.065,
      edgeSoftness: 0.19,
      renderOrder: 75,
    }),
    point: makeBoundPointLight(anchor, {
      name: `${config.label}_Point_Light`,
      color: config.color ?? 0x6be9ff,
      intensity: config.intensity ?? 0.26,
      distance: Math.max(anchor.size.x * 0.08, 0.9),
      zOffset: 0.09,
    }),
    delay: config.delay ?? 0,
    intensity: config.intensity ?? 0.26,
    shouldBoostSourceEmission: true,
  }
}

function createThinRegionGlow(sourceMesh, regionConfig) {
  removeExistingChildByName(sourceMesh, `${regionConfig.label}_Fitted_Line_Glow`)
  removeExistingChildByName(sourceMesh, `${regionConfig.label}_Soft_Aura`)
  removeExistingChildByName(sourceMesh, `${regionConfig.label}_Point_Light`)

  const lineGlow = createFilteredLineGlowFromMesh(sourceMesh, {
    ...regionConfig,
    name: `${regionConfig.label}_Fitted_Line_Glow`,
    opacity: regionConfig.opacity ?? 0.5,
    inflate: regionConfig.inflate ?? 0.014,
    edgeSoftness: 0.055,
    renderOrder: 78,
  })
  const aura = createFilteredLineGlowFromMesh(sourceMesh, {
    ...regionConfig,
    name: `${regionConfig.label}_Soft_Aura`,
    opacity: regionConfig.auraOpacity ?? 0.1,
    inflate: regionConfig.auraInflate ?? 0.06,
    edgeSoftness: 0.19,
    renderOrder: 75,
  })

  if (!lineGlow || !aura) {
    if (lineGlow) {
      lineGlow.removeFromParent()
      disposeObject(lineGlow)
    }
    if (aura) {
      aura.removeFromParent()
      disposeObject(aura)
    }
    console.warn('[YuBot] accent line target not found', regionConfig.label)
    return null
  }

  const point = new THREE.PointLight(
    regionConfig.color ?? 0x6be9ff,
    0,
    Math.max(lineGlow.userData.localSize.x * 0.08, 0.9),
  )
  point.name = `${regionConfig.label}_Point_Light`
  point.userData.baseIntensity = regionConfig.intensity ?? 0.24
  point.position.copy(lineGlow.userData.localCenter)
  point.position.z += 0.09
  sourceMesh.add(point)

  return {
    targetName: regionConfig.sourceName,
    lineGlow,
    aura,
    point,
    delay: regionConfig.delay ?? 0,
    intensity: regionConfig.intensity ?? 0.24,
    shouldBoostSourceEmission: false,
  }
}

function createFilteredLineGlowFromMesh(sourceMesh, options) {
  const filteredGeometry = createFilteredGeometryFromRegion(sourceMesh.geometry, options.region)
  if (!filteredGeometry) return null

  inflateGeometryAlongNormals(filteredGeometry, options.inflate ?? 0.014)
  filteredGeometry.computeBoundingBox()
  const localBox = filteredGeometry.boundingBox
  const localCenter = new THREE.Vector3()
  const localSize = new THREE.Vector3()
  localBox.getCenter(localCenter)
  localBox.getSize(localSize)

  const material = createContourGlowMaterial({
    color: options.color ?? 0x6be9ff,
    opacity: options.opacity ?? 0.5,
    minX: localBox.min.x,
    maxX: localBox.max.x,
    minY: localBox.min.y,
    maxY: localBox.max.y,
    edgeSoftness: options.edgeSoftness ?? 0.08,
  })

  const glow = new THREE.Mesh(filteredGeometry, material)
  glow.name = options.name
  glow.renderOrder = options.renderOrder ?? 78
  glow.frustumCulled = false
  glow.userData.baseOpacity = options.opacity ?? 0.5
  glow.userData.glowKind = 'post-load-filtered-line'
  glow.userData.targetMeshName = sourceMesh.name
  glow.userData.localCenter = localCenter
  glow.userData.localSize = localSize
  sourceMesh.add(glow)
  return glow
}

function createFilteredGeometryFromRegion(sourceGeometry, region) {
  if (!sourceGeometry?.attributes?.position || !region) return null

  const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const selectedPositions = []
  const selectedNormals = []

  for (let index = 0; index < position.count; index += 3) {
    const triangle = [readVertex(position, index), readVertex(position, index + 1), readVertex(position, index + 2)]
    const centroid = triangle[0].clone().add(triangle[1]).add(triangle[2]).multiplyScalar(1 / 3)

    if (!isPointInNormalizedRegion(centroid, box, region)) continue

    triangle.forEach((vertex) => selectedPositions.push(vertex.x, vertex.y, vertex.z))

    if (normal) {
      for (let offset = 0; offset < 3; offset += 1) {
        selectedNormals.push(normal.getX(index + offset), normal.getY(index + offset), normal.getZ(index + offset))
      }
    }
  }

  geometry.dispose()

  if (selectedPositions.length / 9 < (region.minTriangles ?? 3)) {
    return null
  }

  const filteredGeometry = new THREE.BufferGeometry()
  filteredGeometry.setAttribute('position', new THREE.Float32BufferAttribute(selectedPositions, 3))
  if (selectedNormals.length === selectedPositions.length) {
    filteredGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(selectedNormals, 3))
  } else {
    filteredGeometry.computeVertexNormals()
  }
  filteredGeometry.computeBoundingBox()
  filteredGeometry.computeBoundingSphere()
  return filteredGeometry
}

function readVertex(position, index) {
  return new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
}

function isPointInNormalizedRegion(point, box, region) {
  const x = normalizeAxis(point.x, box.min.x, box.max.x)
  const y = normalizeAxis(point.y, box.min.y, box.max.y)
  const z = normalizeAxis(point.z, box.min.z, box.max.z)
  return isInRange(x, region.x) && isInRange(y, region.y) && isInRange(z, region.z)
}

function normalizeAxis(value, min, max) {
  const size = max - min
  return size > 0 ? (value - min) / size : 0
}

function isInRange(value, range = [0, 1]) {
  return value >= range[0] && value <= range[1]
}

function isValidAccentLineMesh(mesh) {
  if (!mesh?.isMesh || !mesh.geometry?.attributes?.position) return false

  mesh.geometry.computeBoundingBox()
  const size = new THREE.Vector3()
  mesh.geometry.boundingBox.getSize(size)
  const dimensions = [size.x, size.y, size.z].filter((value) => value > 0.0001).sort((a, b) => a - b)
  if (dimensions.length < 3) return false

  const [smallest, middle, largest] = dimensions
  return largest / smallest >= 5 && middle / largest <= 0.38
}

function animatePostLoadAccentGlows(now) {
  if (!accentFx) return

  const bootStart = accentFx.userData.bootStart ?? now
  const duration = accentFx.userData.lightOnDuration || 360
  const pulse = 0.86 + Math.sin(now * 0.0062) * 0.14

  ;(accentFx.userData.items || []).forEach((item, index) => {
    const t = clamp01((now - bootStart - (item.delay || 0)) / duration)
    const power = easeOutExpo(t)
    const scan = t <= 0 ? -0.18 : Math.min(1.15, t * 1.28 - 0.08)
    const flash = t > 0 && t < 1 ? 1 + Math.sin(t * Math.PI) * 0.55 : 1

    updateGlowMesh(item.lineGlow, 1, power, scan, pulse * flash, 0.96)
    updateGlowMesh(item.aura, 1, power, scan, pulse * flash, 0.78)

    if (item.point) {
      const base = item.point.userData.baseIntensity || item.intensity || 0.25
      item.point.intensity = base * power * flash * (0.88 + Math.sin(now * 0.0048 + index) * 0.1)
    }

    const object = item.shouldBoostSourceEmission ? robotRoot.getObjectByName(item.targetName) : null
    if (object?.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if ('emissiveIntensity' in material) {
          const base = material.userData.baseEmissiveIntensity || item.intensity || 0.25
          material.emissiveIntensity = base * power * (0.72 + Math.sin(now * 0.004 + index) * 0.08)
        }
      })
    }
  })
}

function lockUserControl() {
  userControlReady = false
  interactive.value = false
  if (controls) controls.enabled = false
  if (renderer?.domElement) renderer.domElement.style.cursor = 'wait'
}

function unlockUserControl(options = {}) {
  const { keepAutoCamera = false } = options
  userControlReady = true
  interactive.value = true

  if (!keepAutoCamera) {
    cameraPathTween = null
    currentCameraTween = null
  }

  if (controls) {
    controls.enabled = true
    if (!keepAutoCamera) {
      controls.target.set(0, -0.08, 0)
    }
    controls.update()
  }

  if (renderer?.domElement) {
    renderer.domElement.style.cursor = 'grab'
  }

  emit('loaded')
}

function cancelAutoCameraOnUserIntent() {
  if (!userControlReady) return
  cameraPathTween = null
  currentCameraTween = null
}

function finishCameraForInteraction(duration = 180, runId = loadingRunId) {
  cameraPathTween = null
  currentCameraTween = {
    start: performance.now(),
    duration,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: new THREE.Vector3(0, 0.16, 8.45),
    toTarget: new THREE.Vector3(0, -0.08, 0),
    onComplete: () => {
      if (runId === loadingRunId && !disposed) unlockUserControl()
    },
  }
}

function tweenCamera(to, duration = 1100) {
  cameraPathTween = null
  currentCameraTween = {
    start: performance.now(),
    duration,
    fromPos: camera.position.clone(),
    fromTarget: controls.target.clone(),
    toPos: new THREE.Vector3(0, to.y, to.z),
    toTarget: new THREE.Vector3(0, to.targetY, 0),
  }
}

function tweenRobotScale(toScale = 0.0415, duration = 820, runId = loadingRunId) {
  if (!robotRoot) return

  const fromScale = robotRoot.scale.x
  const start = performance.now()
  const tick = () => {
    if (disposed || runId !== loadingRunId || !robotRoot) return

    const t = Math.min((performance.now() - start) / duration, 1)
    const k = ease(t)
    robotRoot.scale.setScalar(fromScale + (toScale - fromScale) * k)

    if (t < 1) {
      requestTransientFrame(tick)
    }
  }
  tick()
}

function startCurvedCameraPullback(duration = 5600) {
  currentCameraTween = null
  const p0 = new THREE.Vector3(0, 1.32, 2.15)
  const p1 = new THREE.Vector3(0.42, 1.26, 3)
  const p2 = new THREE.Vector3(-0.32, 0.52, 6.35)
  const p3 = new THREE.Vector3(0, 0.16, 8.45)
  const t0 = new THREE.Vector3(0, 1.22, 0)
  const t1 = new THREE.Vector3(0.14, 1.08, 0)
  const t2 = new THREE.Vector3(-0.1, 0.18, 0)
  const t3 = new THREE.Vector3(0, -0.08, 0)
  cameraPathTween = { start: performance.now(), duration, p0, p1, p2, p3, t0, t1, t2, t3 }
}

function updateCameraTween(now) {
  if (cameraPathTween) {
    const t = Math.min((now - cameraPathTween.start) / cameraPathTween.duration, 1)
    const k = ease(t)
    camera.position.copy(cubicBezier(cameraPathTween.p0, cameraPathTween.p1, cameraPathTween.p2, cameraPathTween.p3, k))
    controls.target.copy(cubicBezier(cameraPathTween.t0, cameraPathTween.t1, cameraPathTween.t2, cameraPathTween.t3, k))
    if (t >= 1) cameraPathTween = null
    return
  }

  if (!currentCameraTween) return

  const t = Math.min((now - currentCameraTween.start) / currentCameraTween.duration, 1)
  const k = ease(t)
  camera.position.lerpVectors(currentCameraTween.fromPos, currentCameraTween.toPos, k)
  controls.target.lerpVectors(currentCameraTween.fromTarget, currentCameraTween.toTarget, k)

  if (t >= 1) {
    const onComplete = currentCameraTween.onComplete
    currentCameraTween = null
    if (onComplete) onComplete()
  }
}

function animate(now = performance.now()) {
  if (disposed || !renderer || !scene || !camera) return

  updateCameraTween(now)
  animateFaceGlow(now)
  animatePostLoadAccentGlows(now)

  if (robotRoot) {
    robotRoot.rotation.y = Math.sin(now * 0.00055) * 0.06
  }

  if (controls) controls.update()
  renderer.render(scene, camera)
  animationFrameId = window.requestAnimationFrame(animate)
}

function clearRobotRoot() {
  if (!robotRoot) return

  cancelTransientFrames()
  while (robotRoot.children.length) {
    const child = robotRoot.children[0]
    disposeObject(child)
    robotRoot.remove(child)
  }
}

function dispose() {
  loadingRunId += 1
  disposed = true
  initialized = false
  userControlReady = false
  interactive.value = false
  hideEnterPlanetButton()

  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  cancelTransientFrames()

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (scene) {
    disposeObject(scene)
    scene.clear()
    scene = null
  }

  robotRoot = null
  camera = null
  faceFx = null
  currentCameraTween = null
  cameraPathTween = null
  loader = null
  accentFx = null

  if (dracoLoader) {
    dracoLoader.dispose()
    dracoLoader = null
  }

  if (renderer) {
    const canvas = renderer.domElement
    canvas.removeEventListener('pointerdown', cancelAutoCameraOnUserIntent)
    canvas.removeEventListener('wheel', cancelAutoCameraOnUserIntent)
    canvas.removeEventListener('touchstart', cancelAutoCameraOnUserIntent)
    renderer.dispose()
    renderer.forceContextLoss()
    if (canvas?.parentElement) {
      canvas.parentElement.removeChild(canvas)
    }
    renderer = null
  }
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }

    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach(disposeMaterial)
    }
  })
}

function disposeMaterial(material) {
  Object.values(material).forEach((value) => {
    if (value?.isTexture) {
      value.dispose()
    }
  })
  material.dispose()
}

function requestTransientFrame(callback) {
  const id = window.requestAnimationFrame((time) => {
    transientFrameIds.delete(id)
    callback(time)
  })
  transientFrameIds.add(id)
  return id
}

function cancelTransientFrames() {
  transientFrameIds.forEach((id) => window.cancelAnimationFrame(id))
  transientFrameIds.clear()
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function cubicBezier(p0, p1, p2, p3, t) {
  const a = p0.clone().multiplyScalar((1 - t) ** 3)
  const b = p1.clone().multiplyScalar(3 * (1 - t) ** 2 * t)
  const c = p2.clone().multiplyScalar(3 * (1 - t) * t ** 2)
  const d = p3.clone().multiplyScalar(t ** 3)
  return a.add(b).add(c).add(d)
}

function ease(t) {
  return 1 - (1 - t) ** 3
}

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1)
}

function easeOutExpo(t) {
  return t >= 1 ? 1 : 1 - 2 ** (-10 * t)
}

function easeOutBack(t) {
  const c1 = 1.22
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

onMounted(() => {
  if (props.enabled && props.autoStart) {
    init()
  }
})

onBeforeUnmount(() => {
  dispose()
})

defineExpose({
  init,
  dispose,
  startLoading,
})
</script>

<style scoped>
.yubot-stream-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.yubot-stream-overlay.is-interactive {
  pointer-events: auto;
}

.yubot-stream-overlay__canvas {
  position: absolute;
  inset: 0;
}

.yubot-stream-overlay__canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}

.yubot-stream-overlay__action {
  position: fixed;
  left: calc(50% + 190px);
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  pointer-events: none;
}

.yubot-stream-overlay__enter {
  display: none;
  min-width: 118px;
  padding: 10px 18px;
  pointer-events: auto;
  cursor: pointer;
  border: 1px solid rgba(168, 255, 220, 0.52);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(79, 195, 255, 0.24), rgba(168, 255, 220, 0.18));
  color: rgba(235, 250, 255, 0.94);
  font-weight: 700;
  box-shadow: 0 0 22px rgba(102, 231, 255, 0.18);
  backdrop-filter: blur(10px);
}

.yubot-stream-overlay__enter.is-visible {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: yubotEnterButtonIn 0.36s ease both;
}

@keyframes yubotEnterButtonIn {
  from {
    opacity: 0;
    transform: translateX(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@media (max-width: 760px) {
  .yubot-stream-overlay__action {
    left: 50%;
    top: auto;
    bottom: 88px;
    transform: translateX(-50%);
  }
}
</style>
