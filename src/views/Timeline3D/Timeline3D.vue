<!-- src/views/Timeline3D/Timeline3D.vue -->
<template>
  <div class="timeline-page">
    <StarsBackground />

    <TopNav />

    <ScrollHint :hidden="modalOpen" :scrolled="scrolledDown" />

    <YearTimeline
      :years="years"
      :hidden="modalOpen"
      @select-year="onSelectYear"
    />

    <ContentModal
      :active="modalOpen"
      :year="String(currentYear)"
      :yearData="currentYearData"
      :activeMonth="currentMonth"
      :visibleMonths="visibleMonths"
      :likeState="getLikeState"
      :commentState="getCommentState"
      @close="closeModal"
      @back-to-year-overview="backToYearOverview"
      @select-month="onSelectMonth"
      @toggle-like="toggleLike"
      @toggle-comment="toggleComment"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { yearMonthData } from "./data/yearMonthData";
import StarsBackground from "./components/StarsBackground.vue";
import TopNav from "./components/TopNav.vue";
import ScrollHint from "./components/ScrollHint.vue";
import YearTimeline from "./components/YearTimeline.vue";
import ContentModal from "./components/ContentModal.vue";
import { useScrollLock } from "./composables/useScrollLock";

const years = Object.keys(yearMonthData).sort(); // 2022/2023/2024

const currentYear = ref(null);
const currentMonth = ref(null);

const modalOpen = computed(() => currentYear.value != null);
const currentYearData = computed(() =>
  currentYear.value ? yearMonthData[currentYear.value] : { title: "", overview: "", months: [] }
);

// 模拟 demo 的喜欢/评论 Map 行为，但做成可反应的状态
const explicitLiked = ref(new Set());
const explicitUnliked = ref(new Set());
const explicitCommented = ref(new Set());
const explicitUncommented = ref(new Set());

const visibleMonths = ref(new Set()); // 用于渐入动画

const { lockScroll, unlockScroll } = useScrollLock();

// scroll hint 隐藏逻辑（与 demo 一致：滚动 >50px 隐藏）
const scrolledDown = ref(false);
function onScroll() {
  scrolledDown.value = window.scrollY > 50;
}

onMounted(() => window.addEventListener("scroll", onScroll));
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

function isDefaultSolid(month) {
  return month <= 7; // demo 1-7 月默认实心
}

function getLikeState(month) {
  const key = `${currentYear.value}-${month}`;
  const solidDefault = isDefaultSolid(month);

  const liked =
    explicitLiked.value.has(key)
      ? true
      : explicitUnliked.value.has(key)
        ? false
        : solidDefault;

  const solid = liked; // 实心/线框体现在 MonthCard 的 class 上

  let count = currentYearData.value.months.find(m => m.month === month)?.stats.likes ?? 0;
  if (explicitLiked.value.has(key)) count += 1;
  if (explicitUnliked.value.has(key)) count -= 1;

  return { liked, solid, count };
}

function getCommentState(month) {
  const key = `${currentYear.value}-${month}`;
  const solidDefault = isDefaultSolid(month);

  const commented =
    explicitCommented.value.has(key)
      ? true
      : explicitUncommented.value.has(key)
        ? false
        : solidDefault;

  const solid = commented;

  let count = currentYearData.value.months.find(m => m.month === month)?.stats.comments ?? 0;
  if (explicitCommented.value.has(key)) count += 1;
  if (explicitUncommented.value.has(key)) count -= 1;

  return { commented, solid, count };
}

function onSelectYear(y) {
  currentYear.value = y;
  currentMonth.value = null;
  visibleMonths.value = new Set(); // 重置渐入
  showModal();
  // 模拟 demo 的卡片渐入（逐月显示）
  setTimeout(() => {
    const s = new Set();
    for (let i = 1; i <= 12; i++) {
      setTimeout(() => {
        s.add(i);
        visibleMonths.value = new Set(s);
      }, i * 50);
    }
  }, 0);
}

function onSelectMonth(m) {
  currentMonth.value = m;
}

function backToYearOverview() {
  currentMonth.value = null;
}

function showModal() {
  lockScroll();
}

function closeModal() {
  currentYear.value = null;
  currentMonth.value = null;
  unlockScroll();
}

// 点赞 / 评论 toggle：保持 demo 的“点击一次 +1，再点一次 -1”的效果
function toggleLike(month) {
  const key = `${currentYear.value}-${month}`;
  const state = getLikeState(month).liked;

  if (state) {
    explicitLiked.value.delete(key);
    explicitUnliked.value.add(key);
  } else {
    explicitUnliked.value.delete(key);
    explicitLiked.value.add(key);
  }
  explicitLiked.value = new Set(explicitLiked.value);
  explicitUnliked.value = new Set(explicitUnliked.value);
}

function toggleComment(month) {
  const key = `${currentYear.value}-${month}`;
  const state = getCommentState(month).commented;

  if (state) {
    explicitCommented.value.delete(key);
    explicitUncommented.value.add(key);
  } else {
    explicitUncommented.value.delete(key);
    explicitCommented.value.add(key);
  }
  explicitCommented.value = new Set(explicitCommented.value);
  explicitUncommented.value = new Set(explicitUncommented.value);
}

// 关闭弹层时，保证年份轴与 hint 都会显示（由 modalOpen 驱动）
</script>

<style>
/* ======= 从 demo 迁移的全局样式（不改效果） ======= */
* { margin:0; padding:0; box-sizing:border-box; scroll-behavior:smooth; }
html { background:#0a0a1a; height:100%; }
body {
  overflow-x: hidden;
  /* perspective: 1000px; */
  background: linear-gradient(to bottom, #0a0a1a, #121228);
  position: relative;
  color: white;
  background-attachment: fixed;
}
/* 滚动锁定 */
body.scroll-locked {
  overflow: hidden !important;
  height: 100vh !important;
  position: fixed !important;
  width: 100% !important;
  background: linear-gradient(to bottom, #0a0a1a, #121228) !important;
}

.timeline-page{
  position: relative;
  height: 100vh;
  overflow: hidden;   /* ✅ 外层彻底不滚 */
}

/* 星星容器 */
#stars-container {
  position: fixed !important;
  top: 0; left:0;
  width: 100vw; height: 100vh;
  z-index: 1;
  pointer-events: none;
}

/* glass / shadow / clamp */
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}

/* 年份轴 */
.year-timeline-wrapper{
  height: 100vh;        /* ✅ 占满视口 */
  overflow-y: auto;     /* ✅ 只它滚 */
  overflow-x: hidden;
  padding: 100px 0;     /* 保持你原来的视觉间距 */
  -webkit-overflow-scrolling: touch;
}
.year-timeline-wrapper::-webkit-scrollbar{ width:0; height:0; }
.year-timeline-wrapper{ scrollbar-width:none; }
.year-timeline-container {
  transform-style: preserve-3d;
  position: relative;
  margin: 0 auto;
  width: fit-content;
}
.year-timeline-line {
  position: absolute;
  left: 50%; top: 0;
  transform: translateX(-50%);
  width: 3px; height: 100%;
  background: linear-gradient(to bottom, #4f46e5, #7c3aed);
  z-index: 5;
}
.year-node-container {
  height: 150px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.year-node {
  width: 60px; height: 60px; border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: 2px solid rgba(255,255,255,.2);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; z-index:99; position:relative;
  transition: all .3s ease;
  font-size:16px; font-weight:bold;
  box-shadow: 0 0 20px rgba(79,70,229,.5);
}
.year-node:hover {
  transform: scale(1.3) translateZ(30px);
}

/* 内容弹层 */
.content-container {
  position: fixed; top:0; left:0;
  width:100vw; height:100vh;
  z-index:200; opacity:0; visibility:hidden;
  transition: opacity .5s ease-in-out, visibility .5s ease-in-out;
  display:flex; background:#0a0a1a; overflow:hidden;
}
.content-container.active { opacity:1; visibility:visible; }

.modal-left {
  width: 120px; height:100%;
  background:#0a0a1a; border-right:1px solid rgba(255,255,255,.1);
  display:flex; flex-direction:column; align-items:center;
  padding: 50px 0; overflow-y:auto; scrollbar-width:none;
}
.modal-left::-webkit-scrollbar { display:none; }

.month-timeline { width:100%; display:flex; flex-direction:column; align-items:center; position:relative; }
.month-timeline-line {
  position:absolute; left:50%; top:60px; bottom:0;
  transform: translateX(-50%);
  width:2px; background: linear-gradient(to bottom, #7c3aed, #4f46e5);
  z-index:140;
}
.month-node-container {
  width: 100%; height:60px;
  display:flex; align-items:center; justify-content:center;
}
.month-node {
  width:30px; height:30px; border-radius:50%;
  background: rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.12);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; z-index:150;
  transition: all .3s ease;
  font-size:12px; font-weight:bold;
}
.month-node.active {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  box-shadow: 0 0 15px rgba(124,58,237,.5);
}
.month-node:hover {
  transform: scale(1.2) translateZ(20px);
  box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
}

.timeline-year-indicator {
  width:60px; height:60px; border-radius:50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border:2px solid rgba(255,255,255,.2);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; font-weight:bold;
  margin-bottom:30px; cursor:pointer;
  box-shadow: 0 0 20px rgba(79,70,229,.6);
}

/* 右侧 */
.content-area {
  flex:1; height:100%;
  padding:15px 40px 40px;
  background:#121228; overflow-y:auto; position:relative;
}
.content-actions {
  display:flex; justify-content:space-between; align-items:center;
  margin-bottom:30px; padding-bottom:15px;
  border-bottom:1px solid rgba(255,255,255,.1);
}
.back-year-btn {
  padding:8px 20px; border-radius:30px;
  background: rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.12);
  color:white; cursor:pointer;
}
.close-btn {
  width:40px; height:40px; border-radius:50%;
  background: rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.2);
  display:flex; align-items:center; justify-content:center;
  font-size:20px; cursor:pointer;
}
.content-title {
  font-size:32px; font-weight:bold;
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  -webkit-background-clip:text; background-clip:text; color:transparent;
  margin-bottom:30px; text-align:center;
}

.year-overview-card {
  max-width:1200px; margin: 0 auto 40px;
  background: rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  border-radius:12px; padding:30px; display:none;
}
.year-overview-card.active { display:block; animation: fadeIn .5s ease; }
.year-overview-title { font-size:24px; font-weight:bold; color:#a78bfa; margin-bottom:15px; }

.all-months-list {
  display:grid;
  grid-template-columns: repeat(4, minmax(250px, 1fr));
  gap:20px; margin-top:20px; max-width:1200px; margin-left:auto; margin-right:auto;
}
.single-month-content {
  max-width:800px; margin: 0 auto;
  background: rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  border-radius:12px; padding:30px; margin-top:20px; display:none;
}
.single-month-content.active { display:block; animation: fadeIn .5s ease; }

.month-card {
  background: rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  border-radius: 12px; padding:20px;
  transition: all .3s ease;
  cursor:pointer; height:100%;
  display:flex; flex-direction:column;
}
.month-card:hover {
  transform: translateY(-5px) translateZ(10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.2);
}
.month-card.active {
  border-color:#7c3aed;
  background: rgba(124,58,237,.08);
  box-shadow: 0 0 15px rgba(124,58,237,.3);
}
.month-card-title { font-size:18px; font-weight:bold; color:#a78bfa; margin-bottom:10px; }
.month-card-content {
  color: rgba(255,255,255,.8);
  line-height:1.6; flex:1; margin-bottom:15px;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; text-overflow:ellipsis; white-space:normal; min-height:42px;
}
.month-card-stats {
  display:flex; justify-content:space-between; align-items:center;
  padding-top:15px; border-top:1px solid rgba(255,255,255,.08)
}
.stat-item { display:flex; align-items:center; gap:6px; color: rgba(255,255,255,.6); font-size:14px; }
.stat-icon { font-size:16px; color:#a78bfa; transition: transform .2s ease; }
.stat-icon.solid { font-weight:900; }
.like-icon.active, .comment-icon.active { color:#a78bfa; transform:scale(1.2); }

@keyframes fadeIn {
  from { opacity:0; transform: translateY(20px); }
  to { opacity:1; transform: translateY(0); }
}

/* 响应式 */
@media (max-width:1200px){ .all-months-list{ grid-template-columns:repeat(3,minmax(250px,1fr)); } }
@media (max-width:900px){ .all-months-list{ grid-template-columns:repeat(2,minmax(250px,1fr)); } }
@media (max-width:576px){
  .all-months-list{ grid-template-columns:1fr; }
  .modal-left{ width:60px !important; }

  .timeline-year-indicator{
    width: 42px;
    height: 42px;
    font-size: 14px;
  }

  .month-timeline-line{
    top: 42px;
  }

  .content-area {
    padding: 15px 15px 15px;
  }
}
.content-inner { max-width:1200px; margin:0 auto; width:100%; }
</style>
