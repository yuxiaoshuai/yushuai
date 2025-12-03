<!-- src/views/Timeline3D/components/ContentModal.vue -->
<template>
  <div class="content-container" :class="{ active: active }">
    <!-- 左侧月份时间轴 -->
    <div class="modal-left">
      <div class="month-timeline">
        <div
          class="timeline-year-indicator"
          @click="$emit('back-to-year-overview')"
        >
          {{ year }}
        </div>
        <div class="month-timeline-line"></div>

        <div
          v-for="m in 12"
          :key="m"
          class="month-node-container"
        >
          <div
            class="month-node"
            :class="{ active: activeMonth == m }"
            @click="$emit('select-month', m)"
          >
            {{ m }}月
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-area">
      <div class="content-actions">
        <button class="back-year-btn" @click="onBackClick">
          {{ backBtnText }}
        </button>
        <div class="close-btn" @click="$emit('close')">×</div>
      </div>

      <div class="content-inner">
        <h2 class="content-title">{{ yearData.title }}</h2>

        <!-- 年度总览 -->
        <div
          class="year-overview-card"
          :class="{ active: showOverview }"
          @click="onOverviewCardClick"
        >
          <div class="year-overview-title">{{ year }}年 年度总览</div>

          <div
            ref="overviewContentRef"
            class="year-overview-content"
            :class="{ 'overview-clamp': isClampActive }"
            :style="{ '--clamp-lines': clampLines }"
          >
            {{ yearData.overview }}
          </div>

          <!-- >576：超过3行才显示“更多”，点后展开全文 -->
          <button
            v-if="!isMobile && hasOverflow && isClampActive"
            class="overview-more-btn"
            @click.stop="overviewExpanded = true"
          >
            更多
          </button>

        </div>

        <!-- <=576：翻牌展开层 -->
        <div
          v-if="isMobile"
          class="overview-flip-overlay"
          :class="{ active: overviewFlipOpen }"
          @click.self="overviewFlipOpen = false"
        >
          <div class="overview-flip-card">
            <div class="overview-flip-title-row">
              <div class="overview-flip-title">
                {{ year }}年 年度总览
              </div>
              <button
                class="overview-flip-close"
                @click.stop="overviewFlipOpen = false"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div class="overview-flip-content">{{ yearData.overview }}</div>
          </div>
        </div>

        <!-- 全部月份卡片 -->
        <div v-show="showOverview" class="all-months-list">
          <MonthCard
            v-for="(mo, idx) in yearData.months"
            :key="mo.month"
            :year="year"
            :month="mo"
            :active="activeMonth == mo.month"
            :liked="likeState(mo.month).liked"
            :commented="commentState(mo.month).commented"
            :likeSolid="likeState(mo.month).solid"
            :commentSolid="commentState(mo.month).solid"
            :likeCount="likeState(mo.month).count"
            :commentCount="commentState(mo.month).count"
            :visible="visibleMonths.has(mo.month)"
            :delayIndex="idx + 1"
            @select-month="$emit('select-month', $event)"
            @toggle-like="$emit('toggle-like', $event)"
            @toggle-comment="$emit('toggle-comment', $event)"
          />
        </div>

        <!-- 单个月份正文 -->
        <div class="single-month-content" :class="{ active: !showOverview }">
          <h3 class="month-card-title">{{ activeMonth }}月</h3>

          <!-- ✅ 新增：3D滚动展示（副轴） -->
          <Month3DStack
            v-if="month3DAssets.length"
            :assets="month3DAssets"
          />

          <!-- fallback：没有图片就显示原文字 -->
          <div v-else class="month-card-content">
            {{ activeMonthContent }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import MonthCard from "./MonthCard.vue";
import Month3DStack from "./Month3DStack.vue";

const props = defineProps({
  active: Boolean,
  year: String,
  yearData: Object,
  activeMonth: Number,                 // null 表示年度总览
  visibleMonths: Object,               // Set<number>
  likeState: Function,                 // (monthNumber)=>{liked,solid,count}
  commentState: Function,              // (monthNumber)=>{commented,solid,count}
});

const emit = defineEmits([
  "close",
  "select-month",
  "back-to-year-overview",
  "toggle-like",
  "toggle-comment",
]);

/* ===================== 层级/内容控制 ===================== */
const showOverview = computed(() => props.activeMonth == null);

const activeMonthContent = computed(() => {
  if (props.activeMonth == null) return "";
  const mo = props.yearData.months.find(m => m.month === props.activeMonth);
  return mo?.content || "";
});

/* back-year-btn 文案 + 按层级返回 */
const backBtnText = computed(() =>
  props.activeMonth == null ? "返回主轴" : "返回副轴"
);

function onBackClick() {
  if (props.activeMonth == null) {
    // 当前在主轴，再点就退出弹层回外层年份轴
    emit("close");
  } else {
    // 当前在副轴，先回到主轴
    emit("back-to-year-overview");
  }
}

/* ===================== 年度总览：大屏“更多” / 小屏“翻牌” ===================== */
const isMobile = ref(typeof window !== "undefined" ? window.innerWidth <= 576 : false);
const overviewExpanded = ref(false);    // >576 展开全文
const overviewFlipOpen = ref(false);    // <=576 翻牌全文层
const overviewContentRef = ref(null);
const hasOverflow = ref(false);

// 行数阈值：大屏3行，小屏2行
const clampLines = computed(() => (isMobile.value ? 2 : 3));

// 是否处于 clamp 截断状态
const isClampActive = computed(() => {
  if (isMobile.value) return true; // 小屏始终截断（两行）
  return !overviewExpanded.value;  // 大屏未展开时截断（三行）
});

const month3DAssets = computed(() => {
  if (props.activeMonth == null) return [];
  const mo = props.yearData.months.find(m => m.month === props.activeMonth);
  return mo?.images || []; // 你之后给每月补：images:[...]
});

function measureOverflow() {
  const el = overviewContentRef.value;
  if (!el) return;
  hasOverflow.value = el.scrollHeight - el.clientHeight > 1;
}

// 小屏下点击卡片也打开翻牌全文
function onOverviewCardClick() {
  if (isMobile.value && hasOverflow.value) {
    overviewFlipOpen.value = true;
  }
}

const onResize = async () => {
  isMobile.value = window.innerWidth <= 576;
  // 切换尺寸时复位展开状态，避免串层
  overviewExpanded.value = false;
  overviewFlipOpen.value = false;
  await nextTick();
  measureOverflow();
};

onMounted(async () => {
  window.addEventListener("resize", onResize);
  await nextTick();
  measureOverflow();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

// overview 文本、展示层级、尺寸、展开状态变化时重测溢出
watch(
  () => [props.yearData?.overview, showOverview.value, isMobile.value, overviewExpanded.value],
  async () => {
    await nextTick();
    measureOverflow();
  }
);
</script>

<style scoped>
/* 行数截断（行数用 CSS 变量控制） */
.year-overview-content.overview-clamp{
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--clamp-lines);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  position: relative;
}

/* >576 “更多” 按钮 */
.overview-more-btn{
  margin-top: 10px;
  padding: 6px 12px;
  font-size: 12px;
  color: #a78bfa;
  background: rgba(124,58,237,0.12);
  border: 1px solid rgba(124,58,237,0.35);
  border-radius: 8px;
  cursor: pointer;
}

/* <=576 翻牌层 */
.overview-flip-overlay{
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .35s ease;
}
.overview-flip-overlay.active{
  opacity: 1;
  pointer-events: auto;
}
.overview-flip-card{
  width: calc(100% - 36px);
  max-width: 520px;

  /* ✅ 关键：限制高度 */
  max-height: 75vh;       /* 你可调 70~80vh */
  overflow: hidden;       /* 卡片本体不滚 */

  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  padding: 20px 18px;

  transform: rotateY(90deg);
  transform-style: preserve-3d;
  transition: transform .5s ease;
  display: flex;
  flex-direction: column; /* ✅ 让标题固定，内容滚 */
  margin-top: -6vh;
}
.overview-flip-overlay.active .overview-flip-card{
  transform: rotateY(0deg);
}
.overview-flip-title-row{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;   /* 替代原 title 的 margin-bottom */
}
.overview-flip-title{
  font-size: 18px;
  font-weight: bold;
  color: #a78bfa;
  margin-bottom: 0;      /* 交给 row 控制 */
}
.overview-flip-close{
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.9);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.overview-flip-close:active{
  transform: scale(0.95);
}
.overview-flip-content{
  line-height: 1.8;
  color: rgba(255,255,255,0.9);

  overflow-y: auto;       /* 内容内部滚 */
  padding-right: 6px;     /* 留点空间给滚动条 */
  flex: 1;                /* 占满剩余高度 */
  -webkit-overflow-scrolling: touch;
}
</style>
