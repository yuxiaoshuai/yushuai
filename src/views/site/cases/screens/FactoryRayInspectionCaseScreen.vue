<template>
  <div class="factory-ray-screen">
    <div ref="canvasContainerRef" class="canvas-container"></div>

    <aside class="mini-map-panel">
      <div class="panel-title">
        <strong>巡检小地图</strong>
        <span>路线 / 已走 / 监测扇形</span>
      </div>
      <canvas ref="miniMapCanvasRef" class="mini-map-canvas" width="660" height="340"></canvas>
      <div class="mini-map-legend">
        <span><i class="legend-line route"></i>路线</span>
        <span><i class="legend-line done"></i>已走</span>
        <span><i class="legend-dot robot"></i>机器人</span>
      </div>
    </aside>

    <aside class="control-panel">
      <h1>工厂射线巡检</h1>
      <p>数字孪生巡检、路径巡检、设备范围检测</p>

      <section>
        <div class="button-row">
          <button class="secondary" :class="{ active: ui.editMode }" @click="toggleEditMode">
            {{ ui.editMode ? '退出编辑' : '点位编辑' }}
          </button>
          <button class="secondary" :class="{ active: ui.addMode }" @click="toggleAddMode">
            {{ ui.addMode ? '退出新增' : '新增点' }}
          </button>
          <button class="danger" @click="deleteSelectedPoint">删除点</button>
        </div>
        <label class="checkbox">
          <input v-model="ui.snapRoad" type="checkbox" />
          吸附道路中心线
        </label>
        <input
          v-model="ui.selectedPointName"
          class="text-input"
          placeholder="点位名称"
          :disabled="ui.selectedIndex < 0"
          @input="renameSelectedPoint"
        />
      </section>

      <section>
        <div class="button-row">
          <button @click="startPatrol">开始</button>
          <button class="secondary" @click="pausePatrol">暂停</button>
          <button class="warning" @click="resetRobot">重置</button>
        </div>
        <label class="range-row">
          <span>速度</span>
          <input v-model.number="ui.speed" type="range" min="1" max="20" step="0.5" />
          <strong>{{ ui.speed }} m/s</strong>
        </label>
        <div
          ref="progressWrapRef"
          class="progress-wrap"
          @pointerdown="handleProgressPointerDown"
          @pointermove="handleProgressPointerMove"
          @pointerup="handleProgressPointerUp"
          @pointercancel="handleProgressPointerUp"
        >
          <div class="progress-bar" :style="{ width: `${ui.progressPercent}%` }"></div>
          <div class="progress-handle" :style="{ left: `${ui.progressPercent}%` }"></div>
        </div>
      </section>

      <section>
        <div class="kv">
          <span>点位</span><strong>{{ pointCount }}</strong>
          <span>路线长度</span><strong>{{ routeLengthText }}</strong>
          <span>巡检状态</span><strong>{{ ui.patrolState }}</strong>
          <span>范围命中</span><strong>{{ ui.hitCount }} 个设备</strong>
        </div>
      </section>

      <section>
        <div class="button-row">
          <button class="secondary" @click="exportRouteAndDevices">导出 JSON</button>
          <button class="warning" @click="clearInspectionSession({ clearLogs: true })">清空记录</button>
        </div>
      </section>
    </aside>

    <aside class="device-panel">
      <header>
        <h2>设备配置</h2>
      </header>

      <section class="range-config">
        <label class="checkbox">
          <input v-model="ui.rayEnabled" type="checkbox" />
          范围检测
        </label>
        <label>
          <span>前向深度</span>
          <input v-model.number="ui.rayRange" type="number" min="3" max="80" step="1" />
        </label>
        <label>
          <span>左右宽度</span>
          <input v-model.number="ui.rayWidth" type="number" min="2" max="80" step="1" />
        </label>
        <label>
          <span>检测高度</span>
          <input v-model.number="ui.rayHeight" type="number" min="1" max="30" step="1" />
        </label>
      </section>

      <section class="device-list">
        <button
          v-for="device in devices"
          :key="device.id"
          class="device-item"
          :class="{ active: ui.selectedDeviceId === device.id }"
          @click="selectDevice(device.id)"
        >
          <span>
            <strong>{{ device.name }}</strong>
            <em>{{ device.type }} · {{ device.remark }}</em>
          </span>
          <i :class="getDeviceBadgeClass(device)">{{ getDeviceBadgeText(device) }}</i>
        </button>
      </section>

      <section v-if="selectedDevice" class="device-config">
        <label>
          <span>设备名称</span>
          <input v-model="selectedDevice.name" type="text" @input="syncDevicesToScene" />
        </label>
        <label>
          <span>设备类型</span>
          <input v-model="selectedDevice.type" type="text" @input="syncDevicesToScene" />
        </label>
        <label class="checkbox compact">
          <input v-model="selectedDevice.needInspection" type="checkbox" @change="handleDeviceConfigChange" />
          纳入记录
        </label>
        <label class="checkbox compact">
          <input v-model="selectedDevice.showLabel" type="checkbox" @change="syncDevicesToScene" />
          显示标签
        </label>
        <label class="checkbox compact">
          <input v-model="selectedDevice.skipPause" type="checkbox" :disabled="!selectedDevice.needInspection" @change="handleDeviceConfigChange" />
          跳过停留
        </label>
        <label class="checkbox compact">
          <input v-model="selectedDevice.pauseOnHit" type="checkbox" :disabled="selectedDevice.skipPause || !selectedDevice.needInspection" @change="handleDeviceConfigChange" />
          命中停留
        </label>
        <label>
          <span>停留秒数</span>
          <input v-model.number="selectedDevice.pauseSeconds" type="number" min="0" max="30" step="1" :disabled="selectedDevice.skipPause || !selectedDevice.needInspection" @input="handleDeviceConfigChange" />
        </label>
        <label>
          <span>命中动作</span>
          <select v-model="selectedDevice.action">
            <option value="none">记录检查</option>
            <option value="showLabel">展示提示</option>
            <option value="openPanel">打开设备面板</option>
            <option value="checkStatus">查询设备状态</option>
            <option value="takePhoto">模拟拍照</option>
          </select>
        </label>
        <label class="wide">
          <span>备注</span>
          <textarea v-model="selectedDevice.remark" @input="syncDevicesToScene"></textarea>
        </label>
        <button class="secondary locate" @click="focusCameraToDevice(selectedDevice.id)">镜头定位</button>
      </section>

      <section class="inspection-log">
        <h2>检查日志</h2>
        <div v-if="!inspectionLogs.length" class="log-empty">暂无检查记录</div>
        <div v-for="log in inspectionLogs" :key="log.id" class="log-row">
          <strong>{{ log.time }} · {{ log.name }}</strong>
          <span>{{ log.action }} · 距离 {{ log.distance }}m</span>
          <em>{{ log.remark }}</em>
        </div>
      </section>
    </aside>

    <div class="ray-hud" :class="{ show: ui.hudVisible }">
      <strong>{{ ui.hudTitle }}</strong>
      <span>{{ ui.hudText }}</span>
    </div>
    <div class="toast" :class="{ show: ui.toastVisible }">{{ ui.toastText }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

defineProps({
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

const EMBEDDED_OBJ = `
v 95.283661 7.950100 -28.298635
v 101.869385 7.981092 -19.733261
v 105.399940 8.106040 -18.721354
v 102.220261 8.053975 -16.882111
v 102.198845 7.761204 -12.125700
v 103.928719 7.749181 -11.388286
v 104.116051 8.063475 -5.473351
v 102.595222 7.747849 -5.324968
v 102.687691 5.435895 -5.304990
v 102.981392 5.293427 -7.684916
v 99.017853 5.450396 -7.161973
v 96.845360 8.356595 -6.421432
v 98.451080 8.015445 -11.366675
v 99.225433 7.888636 -12.154398
v 99.999786 7.874790 -12.004519
v 100.036011 7.267390 -10.775248
v 100.017326 6.299903 -9.921135
v 99.986382 4.501297 -8.299452
v 96.337616 4.428935 -6.120224
v 95.611588 4.435884 -3.619237
v 95.107079 4.693654 -1.605849
v 71.744507 5.379526 -1.306412
v 68.659882 5.106650 3.645586
v 77.184822 5.765676 13.745378
v 94.966850 8.231712 25.054218
v 97.718483 13.546941 20.842545
v 98.438278 13.504334 20.990028
v 98.652695 13.475392 20.944563
v 100.138901 13.481377 20.958677
v 101.485329 13.487884 21.424927
v 102.017723 7.407732 21.901793
v 103.313789 7.407732 21.781673
v 103.267487 7.697116 10.996570
v 101.392654 7.660660 10.169806
v 100.888306 12.292233 10.501726
v 100.287094 12.339029 10.890836
v 98.421989 12.362429 10.201637
v 97.435738 7.678084 9.848175
v 96.464668 7.700947 9.874828
v 96.434868 7.697116 13.419781
v 62.975189 5.154266 20.634033
v 29.998688 5.199300 20.790833
v 27.272552 6.163527 5.488616
v 24.442816 6.131747 0.605020
v 17.841461 6.209914 0.546574
v 13.046857 1.128781 0.547263
v 12.480686 1.057054 1.619522
v 12.965577 1.094626 2.805345
v 23.699173 1.643730 2.483948
v 34.432766 3.761497 2.574844
v 38.055264 4.658726 2.170133
v 38.046692 4.578516 -0.519374
v 39.623512 5.184186 -1.857117
v 39.792152 5.519501 -6.768387
v 39.830360 5.476295 -8.218614
v 40.216011 1.243185 -9.571967
v 39.328072 1.260878 -9.662543
v 39.651524 1.349854 -1.626730
v 37.783703 1.352442 -4.991757
v 36.152405 1.507912 -3.752289
v 33.194794 1.780661 -4.318817
v 33.739025 2.128606 -7.413112
v 34.436291 2.470986 -10.681978
v 15.481232 1.013862 -11.694943
v 11.211539 1.018932 -12.178882
v 11.563644 1.054078 -8.501282
v 12.715675 1.096567 -5.802836
v 8.798558 3.899698 -5.843184
v 6.900916 4.369225 -5.808856
v 5.046454 4.883231 -5.784094
v 5.055357 4.872582 -7.454082
v 7.922631 4.355330 -8.936727
v 7.922540 4.355192 -11.511425
v 6.926062 4.368439 -11.718573
v 3.837828 1.071847 -11.803339
v 3.964279 1.059918 -9.636666
v 6.592129 1.114321 -8.350352
v 6.592869 1.106413 -2.108160
v 3.647866 1.102457 -3.781486
v 3.351139 1.100479 -0.672936
v -2.232285 1.099490 -0.666316
v -1.976372 1.098502 -6.911180
v -19.006130 1.291651 -7.051841
v -20.809824 1.293074 -6.657664
v -28.608650 1.293786 -6.616009
v -28.613747 1.294142 -4.769045
v -31.272400 1.294498 -4.779365
v -31.276142 1.295206 -9.071262
v -29.285204 1.295561 -11.298013
v -29.300648 1.295740 -17.837494
v -29.305796 2.569148 -25.078588
v -28.030693 2.476505 -28.491108
v -30.826956 2.969168 -31.909807
v -32.483986 3.099009 -33.731899
v -40.332924 3.094963 -42.385780
v -45.254238 3.073702 -48.291870
v -47.479671 3.094825 -49.129417
v -49.952415 3.102584 -49.813770
v -57.873337 3.067245 -59.609680
v -58.691032 3.698771 -60.016800
v -59.657555 3.704901 -59.893970
v -62.837254 3.707970 -57.246571
v -68.048874 2.780572 -52.749031
v -68.830048 2.719090 -49.344269
v -76.106705 2.688354 -43.112076
`

const INITIAL_DEVICES = [
  { id: 'dev_power_01', name: '1号配电柜', type: '配电设备', pos: [-24, 1.7, -18], size: [3.2, 3.4, 1.4], needInspection: true, showLabel: true, pauseOnHit: true, pauseSeconds: 2, action: 'checkStatus', remark: '温度、电流、告警灯' },
  { id: 'dev_compressor_01', name: '空压机 A', type: '动力设备', pos: [12, 1.4, -8], size: [4.5, 2.8, 2.2], needInspection: true, showLabel: true, pauseOnHit: true, pauseSeconds: 3, action: 'openPanel', remark: '压力值、运行状态' },
  { id: 'dev_pump_01', name: '循环水泵', type: '泵站设备', pos: [34, 1.2, 12], size: [3.8, 2.4, 2.0], needInspection: true, showLabel: true, pauseOnHit: false, pauseSeconds: 0, action: 'takePhoto', remark: '仪表读数识别' },
  { id: 'dev_tank_01', name: '储液罐', type: '储罐', pos: [58, 3.2, 26], size: [3.5, 6.4, 3.5], needInspection: true, showLabel: true, pauseOnHit: true, pauseSeconds: 2, action: 'checkStatus', remark: '液位、阀门状态' },
  { id: 'dev_panel_02', name: '2号控制柜', type: '控制设备', pos: [-56, 1.6, 18], size: [3.0, 3.2, 1.3], needInspection: true, showLabel: false, skipPause: true, pauseOnHit: false, pauseSeconds: 0, action: 'none', remark: '记录但不停留' },
  { id: 'dev_fire_01', name: '消防栓', type: '安全设备', pos: [-4, 1.0, 34], size: [1.3, 2.0, 1.3], needInspection: true, showLabel: true, pauseOnHit: false, pauseSeconds: 0, action: 'showLabel', remark: '遮挡与可达性' },
]

const canvasContainerRef = ref(null)
const miniMapCanvasRef = ref(null)
const progressWrapRef = ref(null)
const devices = ref(INITIAL_DEVICES.map((device) => ({ ...device })))
const inspectionLogs = ref([])

const ui = reactive({
  editMode: false,
  addMode: false,
  snapRoad: true,
  selectedIndex: -1,
  selectedPointName: '',
  selectedDeviceId: INITIAL_DEVICES[0].id,
  playing: false,
  seeking: false,
  wasPlayingBeforeSeek: false,
  patrolStarted: false,
  patrolState: '未开始',
  distance: 0,
  speed: 6,
  pointCount: 0,
  totalLength: 0,
  progressPercent: 0,
  hitCount: 0,
  rayEnabled: true,
  rayRange: 18,
  rayWidth: 12,
  rayHeight: 8,
  rayCooldown: 8,
  toastText: '',
  toastVisible: false,
  hudTitle: '发现设备',
  hudText: '范围命中设备',
  hudVisible: false,
})

const selectedDevice = computed(() => devices.value.find((device) => device.id === ui.selectedDeviceId) || null)
const pointCount = computed(() => ui.pointCount)
const routeLengthText = computed(() => `${ui.totalLength.toFixed(1)} m`)

const runtime = {
  points: [],
  roadBasePoints: [],
  pointMeta: [],
  markers: [],
  routeGroup: null,
  roadGroup: null,
  deviceGroup: null,
  rayGroup: null,
  inspectableMeshes: [],
  groundObjects: [],
  segmentLengths: [],
  selectedIndex: -1,
  draggingIndex: -1,
  stopUntil: 0,
  hitDeviceIds: new Set(),
  inspectedThisRun: new Set(),
  lastDeviceHitTime: new Map(),
}

let scene
let camera
let renderer
let controls
let raycaster
let pointer
let dragPlane
let clock
let robot
let animationFrameId = 0
let toastTimer = 0
let hudTimer = 0
let resizeObserver = null
let resizeAnimationFrameId = 0
let canvasWidth = 0
let canvasHeight = 0
let materials = {}
let sharedMaterials = new Set()

const ROBOT_MODEL_FORWARD_AXIS = new THREE.Vector3(0, 0, 1)

onMounted(() => {
  bootstrap()
})

onBeforeUnmount(() => {
  cleanup()
})

function initRenderer() {
  const container = canvasContainerRef.value
  const rect = container.getBoundingClientRect()
  canvasWidth = Math.max(1, Math.round(rect.width))
  canvasHeight = Math.max(1, Math.round(rect.height))
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvasWidth, canvasHeight)
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.enableDamping = true
}

function initMaterials() {
  materials = {
    ground: new THREE.MeshStandardMaterial({ color: 0x4f6f4f, roughness: 0.95 }),
    road: new THREE.MeshStandardMaterial({ color: 0x333842, roughness: 0.96 }),
    roadLine: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.75 }),
    route: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    marker: new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x221400 }),
    markerSelected: new THREE.MeshStandardMaterial({ color: 0xff5a5f, emissive: 0x331111 }),
    building: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.7 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.55, roughness: 0.2 }),
    robotBody: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 }),
    robotDark: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 }),
    robotEye: new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
    deviceInspect: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 }),
    deviceHit: new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x332400, roughness: 0.35 }),
    deviceOff: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 }),
    rayNormal: new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 }),
    rayHit: new THREE.LineBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95 }),
    rayX: new THREE.LineBasicMaterial({ color: 0xff5a5f, transparent: true, opacity: 0.95 }),
    rayY: new THREE.LineBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.95 }),
    rayZ: new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 }),
    rayVolume: new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.12, depthWrite: false }),
  }
  sharedMaterials = new Set(Object.values(materials))
}

function initScene() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b1020)

  const rect = canvasContainerRef.value.getBoundingClientRect()
  camera = new THREE.PerspectiveCamera(55, Math.max(1, rect.width) / Math.max(1, rect.height), 0.1, 2000)
  camera.position.set(80, 95, 125)

  runtime.routeGroup = new THREE.Group()
  runtime.roadGroup = new THREE.Group()
  runtime.deviceGroup = new THREE.Group()
  runtime.rayGroup = new THREE.Group()

  scene.add(new THREE.AmbientLight(0xffffff, 0.72))
  const sun = new THREE.DirectionalLight(0xffffff, 1.25)
  sun.position.set(80, 120, 60)
  sun.castShadow = true
  scene.add(sun)

  const grid = new THREE.GridHelper(220, 44, 0x334155, 0x1e293b)
  grid.position.y = 0.02
  scene.add(grid)

  const ground = makeBox(new THREE.Vector3(220, 0.18, 150), new THREE.Vector3(0, -0.09, 0), materials.ground, 'factory-ground')
  runtime.groundObjects.push(ground)
  makeFactoryBuildings()
  scene.add(runtime.roadGroup, runtime.routeGroup, runtime.deviceGroup, runtime.rayGroup)
}

function makeFactoryBuildings() {
  makeBox(new THREE.Vector3(44, 15, 28), new THREE.Vector3(-54, 7.5, -34), materials.building, '主厂房A')
  makeBox(new THREE.Vector3(46, 2, 30), new THREE.Vector3(-54, 16, -34), materials.roof, '主厂房A屋顶')
  makeBox(new THREE.Vector3(12, 5, 0.6), new THREE.Vector3(-54, 6, -48.3), materials.glass, '主厂房A玻璃')
  makeBox(new THREE.Vector3(38, 13, 24), new THREE.Vector3(52, 6.5, -26), materials.building, '仓储中心')
  makeBox(new THREE.Vector3(40, 2, 26), new THREE.Vector3(52, 14, -26), materials.roof, '仓储中心屋顶')
  makeBox(new THREE.Vector3(34, 12, 20), new THREE.Vector3(-42, 6, 38), materials.building, '办公楼')
  makeBox(new THREE.Vector3(36, 1.6, 22), new THREE.Vector3(-42, 12.8, 38), materials.roof, '办公楼屋顶')
  makeBox(new THREE.Vector3(22, 8, 16), new THREE.Vector3(48, 4, 34), materials.building, '动力站')
  makeBox(new THREE.Vector3(24, 1.2, 18), new THREE.Vector3(48, 8.6, 34), materials.roof, '动力站屋顶')
  makeBox(new THREE.Vector3(12, 6, 8), new THREE.Vector3(0, 3, -62), materials.building, '门卫')
  makeBox(new THREE.Vector3(14, 1, 10), new THREE.Vector3(0, 6.5, -62), materials.roof, '门卫屋顶')

  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
  sharedMaterials.add(fenceMat)
  makeBox(new THREE.Vector3(200, 2, 3), new THREE.Vector3(0, 1.5, -72), fenceMat, '南围墙')
  makeBox(new THREE.Vector3(200, 2, 3), new THREE.Vector3(0, 1.5, 72), fenceMat, '北围墙')
  makeBox(new THREE.Vector3(2, 3, 144), new THREE.Vector3(-100, 1.5, 0), fenceMat, '西围墙')
  makeBox(new THREE.Vector3(2, 3, 144), new THREE.Vector3(100, 1.5, 0), fenceMat, '东围墙')
}

function makeBox(size, pos, mat, name, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat)
  mesh.position.copy(pos)
  mesh.name = name
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function parseObjRoute(objText) {
  const raw = []
  objText.split(/\r?\n/).forEach((line) => {
    const value = line.trim()
    if (!value.startsWith('v ')) return
    const parts = value.split(/\s+/)
    raw.push(new THREE.Vector3(Number(parts[1]), Number(parts[2]), Number(parts[3])))
  })
  if (!raw.length) return []

  const box = new THREE.Box3().setFromPoints(raw)
  const center = new THREE.Vector3()
  box.getCenter(center)
  return raw.map((point) => new THREE.Vector3((point.x - center.x) * 0.72, 0.32, (point.z - center.z) * 0.72))
}

function createRoadsFromRoute(points) {
  clearGroup(runtime.roadGroup)
  runtime.groundObjects.length = 1

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index]
    const b = points[index + 1]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.01) continue

    const center = new THREE.Vector3((a.x + b.x) / 2, 0.055, (a.z + b.z) / 2)
    const road = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.08, len), materials.road)
    road.position.copy(center)
    road.rotation.y = Math.atan2(dx, dz)
    road.receiveShadow = true
    runtime.roadGroup.add(road)
    runtime.groundObjects.push(road)

    if (index % 2 === 0) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.025, Math.min(4, len * 0.55)), materials.roadLine)
      line.position.set(center.x, 0.12, center.z)
      line.rotation.y = road.rotation.y
      runtime.roadGroup.add(line)
    }
  }

  const entryRoad = new THREE.Mesh(new THREE.BoxGeometry(16, 0.09, 28), materials.road)
  entryRoad.position.set(0, 0.06, -62)
  entryRoad.receiveShadow = true
  runtime.roadGroup.add(entryRoad)
  runtime.groundObjects.push(entryRoad)
}

function refreshRoute() {
  clearGroup(runtime.routeGroup)
  runtime.markers = []
  if (runtime.points.length < 2) return

  for (let index = 0; index < runtime.points.length - 1; index += 1) {
    const a = runtime.points[index]
    const b = runtime.points[index + 1]
    const dir = new THREE.Vector3().subVectors(b, a)
    const len = dir.length()
    if (len < 0.001) continue

    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, len, 10), materials.route)
    cylinder.position.copy(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5))
    cylinder.position.y = 0.62
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    runtime.routeGroup.add(cylinder)
  }

  runtime.points.forEach((point, index) => {
    const selected = index === ui.selectedIndex
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(selected ? 1.1 : 0.82, 18, 18),
      selected ? materials.markerSelected : materials.marker,
    )
    marker.position.set(point.x, 1.1, point.z)
    marker.userData.type = 'route-point'
    marker.userData.index = index
    marker.castShadow = true
    runtime.routeGroup.add(marker)
    runtime.markers.push(marker)

    if (index === 0 || index === runtime.points.length - 1 || selected) {
      runtime.routeGroup.add(makeLabel(runtime.pointMeta[index]?.name || `P${index + 1}`, new THREE.Vector3(point.x, 3.8, point.z), 3.2))
    }
  })

  recalcLengths()
  updateProgress()
  updateSelectedPointName()
}

function recalcLengths() {
  runtime.segmentLengths = []
  ui.pointCount = runtime.points.length
  ui.totalLength = 0
  for (let index = 0; index < runtime.points.length - 1; index += 1) {
    const len = runtime.points[index].distanceTo(runtime.points[index + 1])
    runtime.segmentLengths.push(len)
    ui.totalLength += len
  }
}

function getPointAtDistance(distance) {
  if (!runtime.points.length) return null
  if (runtime.points.length === 1) {
    return { position: runtime.points[0], next: null, segmentIndex: 0, progress: 1 }
  }

  let current = 0
  for (let index = 0; index < runtime.segmentLengths.length; index += 1) {
    const segLen = runtime.segmentLengths[index]
    if (current + segLen >= distance) {
      const progress = segLen === 0 ? 0 : (distance - current) / segLen
      return {
        position: new THREE.Vector3().lerpVectors(runtime.points[index], runtime.points[index + 1], progress),
        next: runtime.points[index + 1],
        segmentIndex: index,
        progress,
      }
    }
    current += segLen
  }

  return {
    position: runtime.points[runtime.points.length - 1],
    next: null,
    segmentIndex: runtime.points.length - 2,
    progress: 1,
  }
}

function makeRobot() {
  const group = new THREE.Group()
  const box = (size, pos, mat) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat)
    mesh.position.copy(pos)
    mesh.castShadow = true
    group.add(mesh)
  }
  const sphere = (radius, pos, mat) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 18), mat)
    mesh.position.copy(pos)
    mesh.castShadow = true
    group.add(mesh)
  }

  box(new THREE.Vector3(2.0, 3.0, 1.1), new THREE.Vector3(0, 3.1, 0), materials.robotBody)
  box(new THREE.Vector3(1.7, 1.35, 1.2), new THREE.Vector3(0, 5.45, 0), materials.robotBody)
  box(new THREE.Vector3(1.1, 0.12, 0.55), new THREE.Vector3(0, 5.48, -0.62), materials.glass)
  sphere(0.14, new THREE.Vector3(-0.34, 5.55, -0.72), materials.robotEye)
  sphere(0.14, new THREE.Vector3(0.34, 5.55, -0.72), materials.robotEye)
  sphere(0.32, new THREE.Vector3(-1.28, 4.0, 0), materials.robotDark)
  sphere(0.32, new THREE.Vector3(1.28, 4.0, 0), materials.robotDark)
  box(new THREE.Vector3(0.42, 2.0, 0.42), new THREE.Vector3(-1.55, 2.55, 0), materials.robotBody)
  box(new THREE.Vector3(0.42, 2.0, 0.42), new THREE.Vector3(1.55, 2.55, 0), materials.robotBody)
  box(new THREE.Vector3(0.55, 1.65, 0.55), new THREE.Vector3(-0.48, 0.9, 0), materials.robotDark)
  box(new THREE.Vector3(0.55, 1.65, 0.55), new THREE.Vector3(0.48, 0.9, 0), materials.robotDark)

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 24), materials.robotEye)
  nose.rotation.x = -Math.PI / 2
  nose.position.set(0, 4.2, -0.95)
  group.add(nose)
  group.scale.setScalar(0.8)
  scene.add(group)
  return group
}

function createInspectionDevices() {
  devices.value = INITIAL_DEVICES.map((device) => ({ ...device }))
  ui.selectedDeviceId = devices.value[0]?.id || null
  renderDevices()
}

function normalizeDevice(device) {
  if (typeof device.skipPause !== 'boolean') device.skipPause = false
  if (!device.needInspection) {
    device.skipPause = false
    device.pauseOnHit = false
    device.pauseSeconds = 0
  }
  if (device.skipPause) {
    device.pauseOnHit = false
    device.pauseSeconds = 0
  }
  return device
}

function renderDevices() {
  if (!runtime.deviceGroup) return
  clearGroup(runtime.deviceGroup)
  runtime.inspectableMeshes = []

  devices.value.forEach((device) => {
    normalizeDevice(device)
    const material = runtime.hitDeviceIds.has(device.id)
      ? materials.deviceHit
      : device.needInspection
        ? materials.deviceInspect
        : materials.deviceOff
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(device.size[0], device.size[1], device.size[2]), material)
    mesh.position.set(device.pos[0], device.pos[1], device.pos[2])
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.type = 'inspect-device'
    mesh.userData.deviceId = device.id
    runtime.deviceGroup.add(mesh)
    runtime.inspectableMeshes.push(mesh)

    if (device.showLabel) {
      runtime.deviceGroup.add(
        makeLabel(device.name, new THREE.Vector3(device.pos[0], device.pos[1] + device.size[1] * 0.72 + 1.3, device.pos[2]), 2.8),
      )
    }
  })
}

function syncDevicesToScene() {
  renderDevices()
}

function handleDeviceConfigChange() {
  if (selectedDevice.value) normalizeDevice(selectedDevice.value)
  renderDevices()
}

function updateRobot(delta) {
  if (!ui.playing || runtime.points.length < 2) return

  if (runtime.stopUntil > performance.now()) {
    const remain = Math.ceil((runtime.stopUntil - performance.now()) / 1000)
    ui.patrolState = `设备检查停留中：${remain}s`
    updateProgress()
    return
  }
  if (runtime.stopUntil > 0 && runtime.stopUntil <= performance.now()) runtime.stopUntil = 0

  ui.distance += ui.speed * delta
  if (ui.distance >= ui.totalLength) {
    ui.distance = ui.totalLength
    ui.playing = false
    ui.patrolStarted = false
    ui.patrolState = '已完成'
  }

  const result = getPointAtDistance(ui.distance)
  if (!result) return
  robot.position.set(result.position.x, 0, result.position.z)
  if (result.next) orientRobotToward(new THREE.Vector3(result.next.x, 0, result.next.z))
  if (ui.playing) {
    ui.patrolState = `巡检中：P${result.segmentIndex + 1} → P${Math.min(result.segmentIndex + 2, runtime.points.length)}`
  }
  updateProgress()
}

function updateRobotByDistance() {
  const result = getPointAtDistance(ui.distance)
  if (!result) return
  robot.position.set(result.position.x, 0, result.position.z)
  if (result.next) orientRobotToward(new THREE.Vector3(result.next.x, 0, result.next.z))
  updateProgress()
}

function updateRayInspection() {
  clearGroup(runtime.rayGroup)
  if (!ui.rayEnabled || !robot) return

  const base = robot.position.clone()
  base.y = 0.15

  const forward = getRobotForward()
  const up = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3().crossVectors(forward, up).normalize().multiplyScalar(-1)
  const width = Math.max(1, Number(ui.rayWidth || 12))
  const height = Math.max(1, Number(ui.rayHeight || 8))
  const depth = Math.max(1, Number(ui.rayRange || 18))
  const now = performance.now()
  let hasHit = false

  runtime.inspectableMeshes.forEach((mesh) => {
    const device = devices.value.find((item) => item.id === mesh.userData.deviceId)
    if (!device?.needInspection) return
    if (meshInsideInspectionVolume(mesh, base, right, up, forward, width, height, depth)) {
      hasHit = true
      const deviceCenter = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3())
      handleDeviceHit(mesh.userData.deviceId, deviceCenter.distanceTo(robot.position), now)
    }
  })

  drawRay(base, right, width / 2, materials.rayX, false)
  drawRay(base, right.clone().multiplyScalar(-1), width / 2, materials.rayX, false)
  drawRay(base, up, height, materials.rayY, false)
  drawRay(base, forward, depth, hasHit ? materials.rayHit : materials.rayZ, hasHit)
  drawInspectionVolume(base, right, up, forward, width, height, depth, hasHit)
}

function drawInspectionVolume(base, right, up, forward, width, height, depth, hasHit) {
  const volume = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials.rayVolume)
  const center = base.clone().add(forward.clone().multiplyScalar(depth / 2)).add(up.clone().multiplyScalar(height / 2))
  volume.position.copy(center)
  volume.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward))
  runtime.rayGroup.add(volume)

  const edges = new THREE.EdgesGeometry(volume.geometry)
  const edgeLine = new THREE.LineSegments(edges, hasHit ? materials.rayHit : materials.rayNormal)
  edgeLine.position.copy(volume.position)
  edgeLine.quaternion.copy(volume.quaternion)
  runtime.rayGroup.add(edgeLine)
}

function handleDeviceHit(deviceId, distance, now) {
  const device = devices.value.find((item) => item.id === deviceId)
  if (!device?.needInspection || runtime.inspectedThisRun.has(deviceId)) return

  runtime.inspectedThisRun.add(deviceId)
  runtime.hitDeviceIds.add(deviceId)
  runtime.lastDeviceHitTime.set(deviceId, now)
  ui.hitCount = runtime.inspectedThisRun.size
  renderDevices()

  const actionText = getActionText(device.action)
  inspectionLogs.value.unshift({
    id: `${deviceId}-${now}`,
    time: new Date().toLocaleTimeString(),
    name: device.name,
    action: device.skipPause ? `${actionText}（跳过停留）` : actionText,
    distance: Number(distance.toFixed(1)),
    remark: device.remark || '',
  })
  inspectionLogs.value = inspectionLogs.value.slice(0, 30)

  if (!device.skipPause && device.pauseOnHit && Number(device.pauseSeconds || 0) > 0 && ui.playing) {
    runtime.stopUntil = performance.now() + Number(device.pauseSeconds) * 1000
  }
  showRayHud(device, distance, device.skipPause ? `${actionText} · 跳过停留` : actionText)
}

function drawRay(origin, direction, length, material, hit) {
  const end = origin.clone().add(direction.clone().multiplyScalar(length))
  const geometry = new THREE.BufferGeometry().setFromPoints([origin, end])
  const line = new THREE.Line(geometry, material)
  runtime.rayGroup.add(line)

  const tip = new THREE.Mesh(new THREE.SphereGeometry(hit ? 0.34 : 0.2, 10, 10), hit ? materials.deviceHit : materials.route)
  tip.position.copy(end)
  runtime.rayGroup.add(tip)
}

function pointInsideInspectionVolume(point, base, right, up, forward, width, height, depth) {
  const delta = point.clone().sub(base)
  const localX = delta.dot(right)
  const localY = delta.dot(up)
  const localZ = delta.dot(forward)
  return localZ >= 0 && localZ <= depth && Math.abs(localX) <= width / 2 && localY >= 0 && localY <= height
}

function meshInsideInspectionVolume(mesh, base, right, up, forward, width, height, depth) {
  const box = new THREE.Box3().setFromObject(mesh)
  const min = box.min
  const max = box.max
  const points = [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
    box.getCenter(new THREE.Vector3()),
  ]
  return points.some((point) => pointInsideInspectionVolume(point, base, right, up, forward, width, height, depth))
}

function initMiniMap() {
  const canvas = miniMapCanvasRef.value
  if (!canvas) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))
}

function drawMiniMap() {
  const canvas = miniMapCanvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx || runtime.points.length < 2) return

  const bounds = getMiniMapBounds()
  const toMap = (x, z) => worldToMiniMap(x, z, canvas, bounds)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, 'rgba(15, 23, 42, 0.98)')
  gradient.addColorStop(1, 'rgba(2, 6, 23, 0.98)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
  ctx.restore()

  drawMiniMapRoute(ctx, toMap)
  drawMiniMapSector(ctx, toMap)
  drawMiniMapRobot(ctx, toMap)

  const percent = ui.totalLength > 0 ? Math.min(100, (ui.distance / ui.totalLength) * 100) : 0
  ctx.save()
  ctx.font = `${12 * (window.devicePixelRatio || 1)}px Microsoft YaHei, Arial`
  ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'
  ctx.fillText(`进度 ${percent.toFixed(1)}%`, 14 * (window.devicePixelRatio || 1), canvas.height - 14 * (window.devicePixelRatio || 1))
  ctx.restore()
}

function drawMiniMapRoute(ctx, toMap) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  runtime.points.forEach((point, index) => {
    const mapPoint = toMap(point.x, point.z)
    if (index === 0) ctx.moveTo(mapPoint.x, mapPoint.y)
    else ctx.lineTo(mapPoint.x, mapPoint.y)
  })
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.72)'
  ctx.lineWidth = 4 * (window.devicePixelRatio || 1)
  ctx.stroke()

  if (ui.distance > 0) {
    ctx.beginPath()
    let current = 0
    let started = false
    for (let index = 0; index < runtime.points.length - 1; index += 1) {
      const a = runtime.points[index]
      const b = runtime.points[index + 1]
      const segLen = runtime.segmentLengths[index] || a.distanceTo(b)
      if (!started) {
        const start = toMap(a.x, a.z)
        ctx.moveTo(start.x, start.y)
        started = true
      }
      if (current + segLen <= ui.distance) {
        const end = toMap(b.x, b.z)
        ctx.lineTo(end.x, end.y)
      } else {
        const t = THREE.MathUtils.clamp((ui.distance - current) / Math.max(segLen, 0.0001), 0, 1)
        const mid = new THREE.Vector3().lerpVectors(a, b, t)
        const currentPoint = toMap(mid.x, mid.z)
        ctx.lineTo(currentPoint.x, currentPoint.y)
        break
      }
      current += segLen
    }
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.95)'
    ctx.lineWidth = 5 * (window.devicePixelRatio || 1)
    ctx.stroke()
  }

  drawMiniMapPoint(ctx, toMap(runtime.points[0].x, runtime.points[0].z), '#22c55e', '起')
  drawMiniMapPoint(ctx, toMap(runtime.points[runtime.points.length - 1].x, runtime.points[runtime.points.length - 1].z), '#ef4444', '终')
  ctx.restore()
}

function drawMiniMapPoint(ctx, point, color, text) {
  const ratio = window.devicePixelRatio || 1
  ctx.save()
  ctx.beginPath()
  ctx.arc(point.x, point.y, 8 * ratio, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.font = `bold ${10 * ratio}px Microsoft YaHei, Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, point.x, point.y + 0.5 * ratio)
  ctx.restore()
}

function drawMiniMapSector(ctx, toMap) {
  if (!robot) return
  const origin = toMap(robot.position.x, robot.position.z)
  const forward = getRobotForward()
  const depth = Math.max(1, Number(ui.rayRange || 18))
  const width = Math.max(1, Number(ui.rayWidth || 12))
  const halfAngle = Math.atan((width / 2) / depth)
  const baseAngle = Math.atan2(-forward.z, forward.x)
  const radius = depth * origin.scale

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(origin.x, origin.y)
  ctx.arc(origin.x, origin.y, radius, baseAngle - halfAngle, baseAngle + halfAngle)
  ctx.closePath()
  ctx.fillStyle = 'rgba(250, 204, 21, 0.20)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.90)'
  ctx.lineWidth = 2 * (window.devicePixelRatio || 1)
  ctx.stroke()
  ctx.restore()
}

function drawMiniMapRobot(ctx, toMap) {
  if (!robot) return
  const ratio = window.devicePixelRatio || 1
  const point = toMap(robot.position.x, robot.position.z)
  const forward = getRobotForward()
  const angle = Math.atan2(-forward.z, forward.x)

  ctx.save()
  ctx.translate(point.x, point.y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(12 * ratio, 0)
  ctx.lineTo(-9 * ratio, -7 * ratio)
  ctx.lineTo(-5 * ratio, 0)
  ctx.lineTo(-9 * ratio, 7 * ratio)
  ctx.closePath()
  ctx.fillStyle = '#facc15'
  ctx.fill()
  ctx.strokeStyle = 'rgba(15,23,42,0.85)'
  ctx.lineWidth = 2 * ratio
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(point.x, point.y, 12 * ratio, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)'
  ctx.lineWidth = 2 * ratio
  ctx.stroke()
  ctx.restore()
}

function getMiniMapBounds() {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  runtime.points.forEach((point) => {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minZ = Math.min(minZ, point.z)
    maxZ = Math.max(maxZ, point.z)
  })
  const extra = Math.max(20, Number(ui.rayRange || 18))
  return { minX: minX - extra, maxX: maxX + extra, minZ: minZ - extra, maxZ: maxZ + extra }
}

function worldToMiniMap(x, z, canvas, bounds) {
  const pad = 22 * (window.devicePixelRatio || 1)
  const w = canvas.width - pad * 2
  const h = canvas.height - pad * 2
  const worldW = Math.max(1, bounds.maxX - bounds.minX)
  const worldH = Math.max(1, bounds.maxZ - bounds.minZ)
  const scale = Math.min(w / worldW, h / worldH)
  const usedW = worldW * scale
  const usedH = worldH * scale
  const offsetX = pad + (w - usedW) / 2
  const offsetY = pad + (h - usedH) / 2
  return {
    x: offsetX + (x - bounds.minX) * scale,
    y: offsetY + (bounds.maxZ - z) * scale,
    scale,
  }
}

function bindEvents() {
  renderer.domElement.addEventListener('pointerdown', handleScenePointerDown)
  renderer.domElement.addEventListener('pointermove', handleScenePointerMove)
  window.addEventListener('pointerup', handleScenePointerUp)
  window.addEventListener('resize', handleResize)

  if (typeof ResizeObserver !== 'undefined' && canvasContainerRef.value) {
    resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(canvasContainerRef.value)
  }
}

function handleScenePointerDown(event) {
  if (!ui.editMode) return
  toPointer(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(runtime.markers, false)
  if (hits.length) {
    runtime.draggingIndex = hits[0].object.userData.index
    selectMarker(runtime.draggingIndex)
    controls.enabled = false
    return
  }

  if (!ui.addMode) return
  const intersects = raycaster.intersectObjects(runtime.groundObjects, true)
  if (!intersects.length) return

  let point = intersects[0].point.clone()
  point.y = 0.32
  point = snapToRoad(point)
  runtime.points.push(point)
  runtime.pointMeta.push({ id: String(Date.now()), name: `P${runtime.points.length}` })
  selectMarker(runtime.points.length - 1)
  toast('已新增路线点')
}

function handleScenePointerMove(event) {
  if (runtime.draggingIndex < 0) return
  toPointer(event)
  raycaster.setFromCamera(pointer, camera)
  const hit = new THREE.Vector3()
  if (raycaster.ray.intersectPlane(dragPlane, hit)) {
    const point = snapToRoad(new THREE.Vector3(hit.x, 0.32, hit.z))
    runtime.points[runtime.draggingIndex].copy(point)
    refreshRoute()
  }
}

function handleScenePointerUp() {
  if (runtime.draggingIndex >= 0) toast('路线点已更新')
  runtime.draggingIndex = -1
  if (controls) controls.enabled = true
}

function handleProgressPointerDown(event) {
  ui.seeking = true
  ui.wasPlayingBeforeSeek = ui.playing
  ui.playing = false
  progressWrapRef.value?.setPointerCapture?.(event.pointerId)
  seekToClientX(event.clientX)
}

function handleProgressPointerMove(event) {
  if (ui.seeking) seekToClientX(event.clientX)
}

function handleProgressPointerUp(event) {
  if (!ui.seeking) return
  ui.seeking = false
  progressWrapRef.value?.releasePointerCapture?.(event.pointerId)
  if (ui.wasPlayingBeforeSeek) {
    ui.playing = true
    ui.patrolState = '从新位置继续巡检'
  } else {
    ui.patrolState = '已定位'
  }
}

function seekToClientX(clientX) {
  if (ui.totalLength <= 0) return
  const rect = progressWrapRef.value.getBoundingClientRect()
  const ratio = THREE.MathUtils.clamp((clientX - rect.left) / rect.width, 0, 1)
  ui.distance = ui.totalLength * ratio
  runtime.stopUntil = 0
  updateRobotByDistance()
  const result = getPointAtDistance(ui.distance)
  if (result) ui.patrolState = `已定位：P${result.segmentIndex + 1}`
}

function toggleEditMode() {
  ui.editMode = !ui.editMode
  toast(ui.editMode ? '已进入点位编辑' : '已退出点位编辑')
}

function toggleAddMode() {
  ui.addMode = !ui.addMode
  if (ui.addMode && !ui.editMode) ui.editMode = true
  toast(ui.addMode ? '点击地面新增点' : '已关闭新增点')
}

function deleteSelectedPoint() {
  if (ui.selectedIndex < 0) {
    toast('请先选中点位')
    return
  }
  if (runtime.points.length <= 2) {
    toast('至少保留 2 个点')
    return
  }
  runtime.points.splice(ui.selectedIndex, 1)
  runtime.pointMeta.splice(ui.selectedIndex, 1)
  ui.selectedIndex = -1
  refreshRoute()
  resetRobot()
  toast('已删除选中点')
}

function startPatrol() {
  if (runtime.points.length < 2) {
    toast('至少需要 2 个点')
    return
  }
  const isNewSession = !ui.patrolStarted || ui.distance >= ui.totalLength
  if (ui.distance >= ui.totalLength) ui.distance = 0
  if (isNewSession) {
    clearInspectionSession({ clearLogs: true })
    ui.patrolStarted = true
  }
  ui.playing = true
  ui.patrolState = '巡检中'
  toast(isNewSession ? '开始巡检' : '继续巡检')
}

function pausePatrol() {
  ui.playing = false
  ui.patrolState = '已暂停'
  toast('已暂停')
}

function resetRobot() {
  ui.playing = false
  ui.patrolStarted = false
  ui.distance = 0
  runtime.stopUntil = 0
  clearInspectionSession({ clearLogs: true })
  if (runtime.points.length) robot.position.set(runtime.points[0].x, 0, runtime.points[0].z)
  updateRobotByDistance()
  ui.patrolState = '未开始'
}

function clearInspectionSession({ clearLogs = true } = {}) {
  runtime.hitDeviceIds.clear()
  runtime.inspectedThisRun.clear()
  runtime.lastDeviceHitTime.clear()
  ui.hitCount = 0
  if (clearLogs) inspectionLogs.value = []
  renderDevices()
}

function exportRouteAndDevices() {
  const data = {
    id: 'factory_ray_patrol_demo',
    name: '工厂射线巡检',
    unit: 'meter',
    createdAt: new Date().toISOString(),
    rayConfig: {
      depth: ui.rayRange,
      width: ui.rayWidth,
      height: ui.rayHeight,
      oncePerDevicePerRun: true,
    },
    devices: devices.value,
    points: runtime.points.map((point, index) => ({
      id: runtime.pointMeta[index]?.id || String(index + 1),
      name: runtime.pointMeta[index]?.name || `P${index + 1}`,
      x: Number(point.x.toFixed(4)),
      y: Number(point.y.toFixed(4)),
      z: Number(point.z.toFixed(4)),
    })),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'factory_ray_patrol_config.json'
  anchor.click()
  URL.revokeObjectURL(url)
  toast('已导出配置')
}

function selectMarker(index) {
  ui.selectedIndex = index
  runtime.selectedIndex = index
  refreshRoute()
}

function renameSelectedPoint() {
  if (ui.selectedIndex < 0) return
  runtime.pointMeta[ui.selectedIndex].name = ui.selectedPointName || `P${ui.selectedIndex + 1}`
  refreshRoute()
}

function updateSelectedPointName() {
  ui.selectedPointName = ui.selectedIndex >= 0 ? runtime.pointMeta[ui.selectedIndex]?.name || `P${ui.selectedIndex + 1}` : ''
}

function selectDevice(deviceId) {
  ui.selectedDeviceId = deviceId
  focusCameraToDevice(deviceId)
}

function focusCameraToDevice(deviceId) {
  const device = devices.value.find((item) => item.id === deviceId)
  if (!device || !controls || !camera) return
  const point = new THREE.Vector3(device.pos[0], 0, device.pos[2])
  controls.target.copy(point)
  camera.position.set(point.x + 18, 20, point.z + 18)
  controls.update()
}

function getDeviceBadgeText(device) {
  if (runtime.hitDeviceIds.has(device.id)) return '已巡检'
  if (!device.needInspection) return '不记录'
  if (device.skipPause) return '跳过停留'
  if (device.pauseOnHit) return `停留${device.pauseSeconds}s`
  return '记录'
}

function getDeviceBadgeClass(device) {
  return {
    badge: true,
    done: runtime.hitDeviceIds.has(device.id),
    skip: !device.needInspection,
    stop: device.pauseOnHit && !device.skipPause && device.needInspection,
    inspect: device.needInspection && !device.pauseOnHit && !device.skipPause,
    skipPause: device.skipPause,
  }
}

function getActionText(action) {
  return {
    none: '记录检查',
    showLabel: '展示提示',
    openPanel: '打开设备面板',
    checkStatus: '查询设备状态',
    takePhoto: '模拟拍照',
  }[action] || '检查设备'
}

function toPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

function nearestPointOnSegment(point, a, b) {
  const ab = new THREE.Vector3().subVectors(b, a)
  const denominator = ab.lengthSq()
  if (denominator <= 0.0001) return a.clone()
  const ap = new THREE.Vector3().subVectors(point, a)
  const t = THREE.MathUtils.clamp(ap.dot(ab) / denominator, 0, 1)
  return new THREE.Vector3().copy(a).add(ab.multiplyScalar(t))
}

function snapToRoad(point) {
  if (!ui.snapRoad || runtime.roadBasePoints.length < 2) return point
  let best = point
  let bestDist = Infinity
  for (let index = 0; index < runtime.roadBasePoints.length - 1; index += 1) {
    const candidate = nearestPointOnSegment(point, runtime.roadBasePoints[index], runtime.roadBasePoints[index + 1])
    const distance = candidate.distanceTo(point)
    if (distance < bestDist) {
      bestDist = distance
      best = candidate
    }
  }
  return new THREE.Vector3(best.x, 0.32, best.z)
}

function orientRobotToward(target) {
  const dir = new THREE.Vector3().subVectors(target, robot.position)
  dir.y = 0
  if (dir.lengthSq() < 1e-8) return
  dir.normalize()
  robot.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(ROBOT_MODEL_FORWARD_AXIS.clone(), dir))
}

function getRobotForward() {
  const forward = ROBOT_MODEL_FORWARD_AXIS.clone().applyQuaternion(robot.quaternion)
  forward.y = 0
  if (forward.lengthSq() < 0.0001) return new THREE.Vector3(0, 0, 1)
  return forward.normalize()
}

function makeLabel(text, position, scale = 4) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)'
  roundRect(ctx, 8, 12, 240, 58, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.stroke()
  ctx.font = 'bold 28px Microsoft YaHei, Arial'
  ctx.fillStyle = '#e5e7eb'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 128, 42)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.position.copy(position)
  sprite.scale.set(scale * 2.2, scale * 0.82, 1)
  return sprite
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function updateProgress() {
  ui.progressPercent = ui.totalLength > 0 ? Math.min(100, (ui.distance / ui.totalLength) * 100) : 0
}

function showRayHud(device, distance, actionText) {
  ui.hudTitle = `发现设备：${device.name}`
  ui.hudText = `${actionText} · 距离 ${distance.toFixed(1)}m · ${device.remark || device.type}`
  ui.hudVisible = true
  window.clearTimeout(hudTimer)
  hudTimer = window.setTimeout(() => {
    ui.hudVisible = false
  }, 2200)
}

function toast(text) {
  ui.toastText = text
  ui.toastVisible = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    ui.toastVisible = false
  }, 1800)
}

function handleResize() {
  if (!renderer || !camera || !canvasContainerRef.value) return
  const rect = canvasContainerRef.value.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))

  if (width === canvasWidth && height === canvasHeight) return

  canvasWidth = width
  canvasHeight = height
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  initMiniMap()
}

function scheduleResize() {
  if (resizeAnimationFrameId) return

  resizeAnimationFrameId = window.requestAnimationFrame(() => {
    resizeAnimationFrameId = 0
    handleResize()
  })
}

function animate() {
  animationFrameId = window.requestAnimationFrame(animate)
  const delta = clock.getDelta()
  controls.update()
  updateRobot(delta)
  updateRayInspection()
  drawMiniMap()
  renderer.render(scene, camera)
}

function bootstrap() {
  initMaterials()
  initRenderer()
  initScene()
  initControls()
  initMiniMap()

  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()
  dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  robot = makeRobot()

  const points = parseObjRoute(EMBEDDED_OBJ)
  runtime.points = points
  runtime.roadBasePoints = points.map((point) => point.clone())
  runtime.pointMeta = points.map((_, index) => ({
    id: String(index + 1),
    name: index === 0 ? '起点' : index === points.length - 1 ? '终点' : `P${index + 1}`,
  }))
  createRoadsFromRoute(runtime.roadBasePoints)
  createInspectionDevices()
  refreshRoute()
  resetRobot()
  bindEvents()
  clock = new THREE.Clock()
  animate()
}

function cleanup() {
  window.cancelAnimationFrame(animationFrameId)
  if (resizeAnimationFrameId) {
    window.cancelAnimationFrame(resizeAnimationFrameId)
    resizeAnimationFrameId = 0
  }
  window.clearTimeout(toastTimer)
  window.clearTimeout(hudTimer)

  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('pointerdown', handleScenePointerDown)
    renderer.domElement.removeEventListener('pointermove', handleScenePointerMove)
  }
  window.removeEventListener('pointerup', handleScenePointerUp)
  window.removeEventListener('resize', handleResize)
  resizeObserver?.disconnect?.()
  resizeObserver = null

  controls?.dispose?.()
  if (scene) disposeObject(scene)
  sharedMaterials.forEach((material) => material?.dispose?.())
  renderer?.dispose?.()
  renderer?.domElement?.remove?.()

  scene = null
  camera = null
  renderer = null
  controls = null
  robot = null
}

function clearGroup(group) {
  if (!group) return
  while (group.children.length) {
    const child = group.children[0]
    group.remove(child)
    disposeObject(child, false)
  }
}

function disposeObject(object, disposeShared = false) {
  object.traverse?.((child) => {
    child.geometry?.dispose?.()
    disposeMaterial(child.material, disposeShared)
  })
}

function disposeMaterial(material, disposeShared = false) {
  if (!material) return
  const list = Array.isArray(material) ? material : [material]
  list.forEach((item) => {
    if (!disposeShared && sharedMaterials.has(item)) return
    item.map?.dispose?.()
    item.dispose?.()
  })
}

function loadModel() {}
function previewModel() {}
function setLightEnabled() {}

defineExpose({
  loadModel,
  previewModel,
  setLightEnabled,
})
</script>

<style scoped>
.factory-ray-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #0b1020;
  color: #e5e7eb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
}

.canvas-container {
  position: absolute;
  inset: 0;
}

.mini-map-panel,
.control-panel,
.device-panel,
.ray-hud,
.toast {
  position: absolute;
  z-index: 10;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
}

.mini-map-panel {
  top: 78px;
  left: 56px;
  width: 300px;
  border-radius: 10px;
  padding: 10px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.panel-title strong,
.control-panel h1,
.device-panel h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 15px;
  line-height: 1.25;
}

.panel-title span,
.control-panel p {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
}

.mini-map-canvas {
  display: block;
  width: 100%;
  height: 155px;
  border-radius: 8px;
}

.mini-map-legend {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  color: #cbd5e1;
  font-size: 11px;
}

.mini-map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend-line {
  width: 14px;
  height: 3px;
  border-radius: 999px;
}

.legend-line.route {
  background: #22d3ee;
}

.legend-line.done {
  background: #a3e635;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.robot {
  background: #facc15;
}

.control-panel {
  top: 280px;
  left: 56px;
  width: 300px;
  max-height: calc(100vh - 276px);
  overflow: auto;
  border-radius: 10px;
  padding: 12px;
}

.control-panel section + section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 8px 10px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

button:hover {
  background: #1d4ed8;
}

button.secondary {
  background: #334155;
}

button.secondary:hover {
  background: #475569;
}

button.warning {
  background: #d97706;
}

button.danger {
  background: #dc2626;
}

button.active {
  background: #06b6d4;
  color: #04111a;
  font-weight: 800;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  color: #cbd5e1;
  font-size: 12px;
}

.checkbox.compact {
  min-height: 0;
}

.text-input,
.range-config input,
.device-config input,
.device-config select,
.device-config textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 8px;
  outline: none;
  background: rgba(15, 23, 42, 0.92);
  color: #e5e7eb;
  padding: 7px;
  font-size: 12px;
}

.text-input {
  margin-top: 6px;
}

.range-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  color: #94a3b8;
  font-size: 12px;
}

.range-row strong {
  color: #e5e7eb;
  font-size: 12px;
}

.progress-wrap {
  position: relative;
  height: 12px;
  margin-top: 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  cursor: pointer;
  touch-action: none;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22d3ee, #a3e635);
  pointer-events: none;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  border: 3px solid #22d3ee;
  border-radius: 999px;
  background: #f8fafc;
  box-shadow: 0 0 0 5px rgba(34, 211, 238, 0.18), 0 6px 18px rgba(0, 0, 0, 0.35);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.kv {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px;
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.5;
}

.kv span {
  color: #94a3b8;
}

.device-panel {
  top: 16px;
  right: 16px;
  width: min(460px, calc(100vw - 350px));
  min-width: 360px;
  max-height: calc(100vh - 32px);
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 10px;
}

.device-panel header,
.device-panel section {
  padding: 11px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.range-config,
.device-config {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 88px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.device-config {
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: start;
}

.range-config label,
.device-config label {
  display: contents;
  color: #94a3b8;
  font-size: 12px;
}

.range-config .checkbox,
.device-config .checkbox {
  display: flex;
  grid-column: span 2;
}

.device-config .checkbox {
  grid-column: auto;
  min-height: 30px;
}

.device-config .wide {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.device-config textarea {
  min-height: 46px;
  resize: vertical;
}

.device-config .locate {
  grid-column: 2;
  justify-self: start;
}

.device-list {
  max-height: 24vh;
  min-height: 0;
  overflow: auto;
}

.device-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  width: 100%;
  margin-bottom: 7px;
  padding: 9px 10px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
}

.device-item:hover,
.device-item.active {
  background: rgba(51, 65, 85, 0.65);
}

.device-item.active {
  border-color: rgba(34, 211, 238, 0.5);
}

.device-item strong {
  display: block;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-item em {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.badge {
  padding: 4px 6px;
  border-radius: 999px;
  background: rgba(8, 145, 178, 0.85);
  color: #e5e7eb;
  font-size: 10px;
  font-style: normal;
  line-height: 1;
  white-space: nowrap;
}

.badge.done {
  background: rgba(22, 163, 74, 0.95);
}

.badge.skip,
.badge.skipPause {
  background: rgba(100, 116, 139, 0.95);
}

.badge.stop {
  background: rgba(217, 119, 6, 0.95);
}

.inspection-log {
  min-height: 0;
  max-height: 24vh;
  overflow: auto;
}

.inspection-log h2 {
  margin-bottom: 8px;
}

.log-empty {
  color: #94a3b8;
  font-size: 12px;
}

.log-row {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  line-height: 1.5;
}

.log-row + .log-row {
  margin-top: 7px;
}

.log-row strong,
.log-row span,
.log-row em {
  display: block;
}

.log-row strong {
  color: #e5e7eb;
}

.log-row em {
  color: #94a3b8;
  font-style: normal;
}

.ray-hud {
  top: 22px;
  left: 50%;
  max-width: 460px;
  min-width: 280px;
  padding: 12px 16px;
  border-radius: 10px;
  border-color: rgba(34, 211, 238, 0.35);
  opacity: 0;
  pointer-events: none;
  text-align: center;
  transform: translateX(-50%);
  transition: opacity 0.2s ease;
}

.ray-hud.show {
  opacity: 1;
}

.ray-hud strong {
  display: block;
  color: #f8fafc;
  font-size: 15px;
}

.ray-hud span {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.toast {
  left: 50%;
  bottom: 24px;
  padding: 10px 14px;
  border-radius: 999px;
  color: #e5e7eb;
  font-size: 13px;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 0.2s ease;
}

.toast.show {
  opacity: 1;
}

@media (max-width: 1280px) {
  .mini-map-panel,
  .control-panel {
    width: 280px;
  }

  .device-panel {
    width: 380px;
    min-width: 340px;
  }
}

@media (max-width: 980px) {
  .mini-map-panel {
    width: 240px;
  }

  .control-panel {
    top: 236px;
    width: 240px;
  }

  .device-panel {
    right: 10px;
    width: 330px;
    min-width: 300px;
  }

  .range-config,
  .device-config {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .range-config .checkbox,
  .device-config .checkbox,
  .device-config .wide {
    grid-column: 1 / -1;
  }
}
</style>
