<template>
  <div class="month3d-wrapper" ref="wrapRef">
    <div class="month3d-pin" ref="pinRef">
      <canvas ref="canvasRef" class="month3d-canvas"></canvas>
      <div class="month3d-hint">SCROLL</div>
    </div>
    <div class="month3d-spacer" :style="{ height: spacerHeight + 'px' }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from "vue";
import * as THREE from "three";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const props = defineProps({
  assets: { type: Array, default: () => [] },
});

const wrapRef = ref(null);
const pinRef = ref(null);
const canvasRef = ref(null);

let scene, camera, renderer;
let timelineGroup, lineMesh, nodes = [];

let axisCurve, axisTube, axisMat, axisGeo;
let particles, pGeo, pMat;

let rafId, st;

// 滚动进度（0~1）
let scrollP = 0;

// ===== 时间轴参数（背景竖线+节点）=====
const NODE_SPACING = 240;
const LINE_LENGTH_EXTRA = 400;

// ===== “陀螺轴 + 环绕粒子”参数（核心）=====
const AXIS_HEIGHT = 1400;        // 轴的可视高度
const AXIS_TURNS  = 6;           // 轴自身的轻微扭转圈数
const AXIS_RADIUS = 40;          // 轴横向摆幅（小 -> 更直）
const AXIS_TUBE_R = 1.6;         // 轴线粗细

const P_COUNT      = 2400;       // 粒子数量
const P_RING_R_MIN = 18;         // 粒子围绕半径范围（细管感）
const P_RING_R_MAX = 32;
const P_SIZE       = 2.0;        // 粒子尺寸

// 粒子参数缓存
let pU = null;      // along-curve u (0~1)
let pPhi = null;    // orbit angle (0~2pi)
let pR = null;      // orbit radius

// ✅ 稳定 Frenet frames 缓存（避免后段翻转/大摇摆）
const FRAME_SEGMENTS = 800;
let frFrames = null; // { tangents, normals, binormals }

const nodeCount = computed(() => Math.max(1, props.assets.length || 6));
const totalHeight = computed(() =>
  (nodeCount.value - 1) * NODE_SPACING + LINE_LENGTH_EXTRA
);

const spacerHeight = computed(() =>
  Math.max(1200, nodeCount.value * 520)
);

// ===== Three init =====
function initThree() {
  const canvas = canvasRef.value;
  const w = pinRef.value.clientWidth;
  const h = pinRef.value.clientHeight;

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 6000);
  camera.position.set(0, 120, 900);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 3, 4);
  scene.add(dir);
}

// ===== 构建“陀螺轴”曲线 + Tube =====
function buildAxis() {
  if (axisTube) {
    axisGeo.dispose();
    axisMat.dispose();
    scene.remove(axisTube);
  }

  const pts = [];
  const samples = 220;
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const y = (t - 0.5) * AXIS_HEIGHT;

    const angle = t * Math.PI * 2 * AXIS_TURNS;
    const x = Math.cos(angle) * AXIS_RADIUS;
    const z = Math.sin(angle) * AXIS_RADIUS;

    pts.push(new THREE.Vector3(x, y, z));
  }

  axisCurve = new THREE.CatmullRomCurve3(pts);

  // ✅ 预计算稳定 Frenet frames，避免后段翻转抖动
  frFrames = axisCurve.computeFrenetFrames(FRAME_SEGMENTS, false);

  axisGeo = new THREE.TubeGeometry(
    axisCurve,
    600,
    AXIS_TUBE_R,
    10,
    false
  );

  axisMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.22,
  });

  axisTube = new THREE.Mesh(axisGeo, axisMat);
  scene.add(axisTube);
}

// ===== 粒子：围绕轴的“细管环绕” =====
function buildParticles() {
  if (particles) {
    pGeo.dispose();
    pMat.dispose();
    scene.remove(particles);
  }

  pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(P_COUNT * 3);

  pU = new Float32Array(P_COUNT);
  pPhi = new Float32Array(P_COUNT);
  pR = new Float32Array(P_COUNT);

  for (let i = 0; i < P_COUNT; i++) {
    const i3 = i * 3;

    const u = i / (P_COUNT - 1);
    const phi = Math.random() * Math.PI * 2;
    const r = P_RING_R_MIN + Math.random() * (P_RING_R_MAX - P_RING_R_MIN);

    pU[i] = u;
    pPhi[i] = phi;
    pR[i] = r;

    positions[i3] = 0;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = 0;
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  pMat = new THREE.PointsMaterial({
    size: P_SIZE,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);
}

// ===== Background vertical timeline =====
function buildTimeline() {
  if (timelineGroup) {
    nodes.forEach(n => {
      n.geometry.dispose();
      n.material.dispose();
      timelineGroup.remove(n);
    });
    nodes = [];
    if (lineMesh) {
      lineMesh.geometry.dispose();
      lineMesh.material.dispose();
      timelineGroup.remove(lineMesh);
    }
    scene.remove(timelineGroup);
  }

  timelineGroup = new THREE.Group();
  scene.add(timelineGroup);

  const topY = LINE_LENGTH_EXTRA * 0.5;
  const bottomY = -totalHeight.value + LINE_LENGTH_EXTRA * 0.5;

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, topY, 0),
    new THREE.Vector3(0, bottomY, 0),
  ]);

  const lineMat = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.35,
  });

  lineMesh = new THREE.Line(lineGeo, lineMat);
  timelineGroup.add(lineMesh);

  const nodeGeo = new THREE.SphereGeometry(9, 24, 24);
  const nodeMat = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color(0x9a7bff),
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.2,
    transparent: true,
    opacity: 0.95,
  });

  for (let i = 0; i < nodeCount.value; i++) {
    const node = new THREE.Mesh(nodeGeo.clone(), nodeMat.clone());
    node.position.set(0, -i * NODE_SPACING, 0);
    node.position.z = i * -18;
    timelineGroup.add(node);
    nodes.push(node);
  }
}

// ===== ScrollTrigger =====
function resolveScrollerEl() {
  const pin = pinRef.value;
  if (!pin) return null;
  return pin.closest(".content-area") || null;
}

function initScroll() {
  if (st) st.kill();

  const scrollerEl = resolveScrollerEl() || wrapRef.value;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: wrapRef.value,
      scroller: scrollerEl,
      start: "top top",
      end: `+=${spacerHeight.value}`,
      scrub: 1.1,
      pin: pinRef.value,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        scrollP = self.progress;
      }
    },
  });

  // 相机沿时间轴下潜
  tl.to(camera.position, {
    y: -totalHeight.value + 120,
    duration: 1,
  }, 0);

  // 左右轻摆（如你后面不想要，可删）
  tl.to(camera.position, { x: 40, z: 820, duration: 0.5 }, 0)
    .to(camera.position, { x: -40, z: 900, duration: 0.5 }, 0.5);

  // 节点呼吸闪烁
  nodes.forEach((n, i) => {
    tl.to(n.material, {
      emissiveIntensity: 2.0,
      duration: 0.15,
      yoyo: true,
      repeat: 1
    }, i * 0.08);
  });

  st = tl.scrollTrigger;
  ScrollTrigger.refresh();
}

// ===== Animate：粒子围绕轴运动（稳定 Frenet frames）=====
function animate() {
  rafId = requestAnimationFrame(animate);

  if (axisCurve && frFrames && particles && pU) {
    const posAttr = particles.geometry.attributes.position;

    // 滚动驱动参数
    const travel = scrollP * 0.9;           // 沿轴推进
    const spin = scrollP * Math.PI * 10;    // 绕轴自转（快）
    const precess = scrollP * Math.PI * 2;  // 进动（慢）

    // ✅ 只保留极轻的陀螺感，不累积夸张摇摆
    axisTube.rotation.y = spin * 0.04;
    axisTube.rotation.z = precess * 0.08;
    particles.rotation.y = spin * 0.04;
    particles.rotation.z = precess * 0.08;

    for (let i = 0; i < P_COUNT; i++) {
      let u = (pU[i] + travel) % 1;

      const p = axisCurve.getPointAt(u);

      // ===== 稳定 Frenet frame（插值取 normal/binormal）=====
      const segFloat = u * FRAME_SEGMENTS;
      const segIdx = Math.floor(segFloat);
      const segT = segFloat - segIdx;

      const n0 = frFrames.normals[segIdx];
      const n1 = frFrames.normals[Math.min(segIdx + 1, FRAME_SEGMENTS)];
      const b0 = frFrames.binormals[segIdx];
      const b1 = frFrames.binormals[Math.min(segIdx + 1, FRAME_SEGMENTS)];

      const normal = n0.clone().lerp(n1, segT).normalize();
      const binormal = b0.clone().lerp(b1, segT).normalize();

      const phi = pPhi[i] + spin;
      const r = pR[i];

      const offset = new THREE.Vector3()
        .addScaledVector(normal, Math.cos(phi) * r)
        .addScaledVector(binormal, Math.sin(phi) * r);

      const finalPos = p.clone().add(offset);
      posAttr.setXYZ(i, finalPos.x, finalPos.y, finalPos.z);
    }

    posAttr.needsUpdate = true;
  }

  // ✅ 背景时间轴保持笔直（不再摇摆）
  if (timelineGroup) {
    timelineGroup.rotation.z = 0;
  }

  camera.lookAt(0, camera.position.y - 80, 0);
  renderer.render(scene, camera);
}

function onResize() {
  if (!renderer) return;
  const w = pinRef.value.clientWidth;
  const h = pinRef.value.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  ScrollTrigger.refresh();
}

async function rebuildAll() {
  await nextTick();
  buildAxis();
  buildParticles();
  buildTimeline();
  initScroll();
}

onMounted(async () => {
  await nextTick();
  initThree();
  await rebuildAll();
  animate();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (st) st.kill();
  if (rafId) cancelAnimationFrame(rafId);

  nodes.forEach(n => {
    n.geometry.dispose();
    n.material.dispose();
  });
  lineMesh?.geometry.dispose();
  lineMesh?.material.dispose();

  axisGeo?.dispose();
  axisMat?.dispose();
  pGeo?.dispose();
  pMat?.dispose();

  renderer?.dispose();
});

watch(
  () => props.assets,
  async () => {
    await rebuildAll();
  },
  { deep: true }
);
</script>

<style scoped>
.month3d-wrapper{
  position: relative;
  width: 100%;
}
.month3d-pin{
  position: relative;
  width: 100%;
  height: min(72vh, 560px);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(10,10,26,0.6);
  border: 1px solid rgba(255,255,255,0.08);
}
.month3d-canvas{
  width: 100%;
  height: 100%;
  display: block;
}
.month3d-hint{
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.5);
  user-select: none;
  pointer-events: none;
}
.month3d-spacer{
  width: 100%;
}
</style>
