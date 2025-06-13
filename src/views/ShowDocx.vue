<template>
  <div 
    class="docx-container" 
    :class="{ 'is-mobile': isMobile }"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @wheel.passive="handleWheel"
  >
    <!-- 电脑端控制栏 -->
    <div v-if="!isMobile" class="desktop-controls">
      <div class="zoom-controls">
        <button @click="zoomOut" title="缩小">-</button>
        <input 
          type="range" 
          v-model.number="zoomLevel" 
          min="0.3" 
          max="3" 
          step="0.1"
          @input="updateZoomManually"
        >
        <button @click="zoomIn" title="放大">+</button>
        <span class="zoom-value">{{ (zoomLevel * 100).toFixed(0) }}%</span>
      </div>
      <button @click="resetZoom" class="reset-btn" title="重置缩放">🙌</button>
    </div>

    <!-- 移动端控制栏 -->
    <div v-if="isMobile" class="mobile-controls" :class="{ 'controls-hidden': hideControls }">
      <button @click="zoomOut" class="zoom-btn">-</button>
      <span class="zoom-level">{{ (zoomLevel * 100).toFixed(0) }}%</span>
      <button @click="zoomIn" class="zoom-btn">+</button>
      <button @click="resetZoom" class="zoom-btn">🙌</button>
    </div>

    <!-- 文档容器 -->
    <div 
      ref="word" 
      id="fileShow" 
      class="doc-viewport"
      :style="{
        transform: `scale(${zoomLevel}) translate(${offsetX}px, ${offsetY}px)`,
        transformOrigin: '0 0',
        width: `${containerWidth}px`,
        height: `${containerHeight}px`
      }"
      @mousedown="handleMouseDown"
    ></div>

    <!-- 移动端提示（仅首次显示） -->
    <div v-if="isMobile && showTouchHint" class="touch-hint" @click="showTouchHint = false">
      <div class="hint-content">
        <p>双指缩放调整大小</p>
        <p>单指拖动查看内容</p>
        <button class="got-it-btn">知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { renderAsync } from 'docx-preview';

// 响应式状态
const zoomLevel = ref(1.0);
const offsetX = ref(0);
const offsetY = ref(0);
const containerWidth = ref(0);
const containerHeight = ref(0);
const hideControls = ref(false);
const showTouchHint = ref(true);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);

// 检测是否移动端
const isMobile = ref(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

// 触摸状态记录
const touchState = ref({
  initialDistance: null,
  initialZoom: 1,
  initialX: null,
  initialY: null,
  lastTouchTime: 0
});

// 初始化文档
const init = async () => {
  const previewContainer = document.getElementById("fileShow");
  
  try {
    const response = await fetch("/docxs/w.docx");
    const blob = await response.blob();
    await renderAsync(blob, previewContainer, null, {
      ignoreWidth: true,
      ignoreHeight: true,
      className: isMobile.value ? "mobile-docx" : "desktop-docx"
    });
    
    // 获取渲染后的实际尺寸
    const docElement = previewContainer.querySelector(isMobile.value ? '.mobile-docx' : '.desktop-docx');
    if (docElement) {
      containerWidth.value = docElement.scrollWidth;
      containerHeight.value = docElement.scrollHeight;
    }
    
    // 自动调整初始缩放比例
    autoFitZoom();
  } catch (error) {
    console.error("文档加载失败:", error);
    previewContainer.innerHTML = "<div class='error-message'>文档加载失败，请稍后重试</div>";
  }
};

// 自动调整缩放以适应屏幕
const autoFitZoom = () => {
  const container = document.getElementById("fileShow");
  if (!container) return;
  
  const docElement = container.querySelector(isMobile.value ? '.mobile-docx' : '.desktop-docx');
  if (!docElement) return;
  
  // 计算适合屏幕宽度的缩放比例
  const docWidth = docElement.scrollWidth;
  const screenWidth = isMobile.value ? window.innerWidth : Math.min(window.innerWidth, 1200);
  const newZoom = (screenWidth - (isMobile.value ? 20 : 40)) / docWidth;
  
  zoomLevel.value = Math.min(Math.max(newZoom, isMobile.value ? 0.5 : 0.3), isMobile.value ? 2 : 3);
  resetPosition();
};

// 缩放控制
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + (isMobile.value ? 0.1 : 0.2), isMobile.value ? 3 : 4);
  hideControls.value = true;
  if (!isMobile.value) {
    resetPosition();
  }
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - (isMobile.value ? 0.1 : 0.2), isMobile.value ? 0.3 : 0.1);
  hideControls.value = true;
  if (!isMobile.value) {
    resetPosition();
  }
};

const resetZoom = () => {
  autoFitZoom();
  hideControls.value = true;
};

const updateZoomManually = () => {
  hideControls.value = false;
};

const resetPosition = () => {
  offsetX.value = 0;
  offsetY.value = 0;
};

// 电脑端鼠标事件处理
const handleMouseDown = (e) => {
  if (!isMobile.value && e.button === 0) { // 左键
    isDragging.value = true;
    startX.value = e.clientX - offsetX.value;
    startY.value = e.clientY - offsetY.value;
    document.body.style.cursor = 'grabbing';
    e.preventDefault();
  }
};

const handleMouseMove = (e) => {
  if (isDragging.value) {
    offsetX.value = e.clientX - startX.value;
    offsetY.value = e.clientY - startY.value;
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  document.body.style.cursor = '';
};

// 电脑端滚轮缩放
const handleWheel = (e) => {
  if (!isMobile.value && e.ctrlKey) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel.value = Math.min(Math.max(zoomLevel.value + delta, 0.1), 4);
  }
};

// 移动端触摸事件处理
const handleTouchStart = (e) => {
  if (!isMobile.value) return;
  
  if (e.touches.length === 1) {
    // 单指触摸 - 准备拖动
    touchState.value.initialX = e.touches[0].clientX - offsetX.value;
    touchState.value.initialY = e.touches[0].clientY - offsetY.value;
    
    // 检测双击
    const now = Date.now();
    if (now - touchState.value.lastTouchTime < 300) {
      resetZoom();
    }
    touchState.value.lastTouchTime = now;
    
  } else if (e.touches.length === 2) {
    // 双指触摸 - 准备缩放
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    touchState.value.initialDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    touchState.value.initialZoom = zoomLevel.value;
    hideControls.value = true;
  }
};

const handleTouchMove = (e) => {
  if (!isMobile.value) return;
  
  if (e.touches.length === 1) {
    // 单指移动 - 拖动文档
    offsetX.value = e.touches[0].clientX - touchState.value.initialX;
    offsetY.value = e.touches[0].clientY - touchState.value.initialY;
    
  } else if (e.touches.length === 2) {
    // 双指移动 - 缩放文档
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (touchState.value.initialDistance) {
      const scale = currentDistance / touchState.value.initialDistance;
      zoomLevel.value = Math.min(
        Math.max(touchState.value.initialZoom * scale, 0.3),
        3.0
      );
    }
  }
};

// 窗口大小变化处理
const handleResize = debounce(() => {
  if (zoomLevel.value === 1) {
    autoFitZoom();
  }
}, 200);

// 防抖函数
function debounce(fn, delay) {
  let timer = null;
  return function() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
}

// 生命周期钩子
onMounted(() => {
  init();
  window.addEventListener('resize', handleResize);
  if (!isMobile.value) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (!isMobile.value) {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
});
</script>

<style scoped>
.docx-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
}

/* 电脑端样式 */
.docx-container:not(.is-mobile) {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.desktop-controls {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.zoom-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-controls button:hover {
  background: #f0f0f0;
}

.zoom-controls input[type="range"] {
  width: 150px;
  cursor: pointer;
}

.zoom-value {
  min-width: 50px;
  text-align: center;
  font-size: 14px;
}

.reset-btn {
  padding: 6px 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: #40a9ff;
}

/* 移动端样式 */
.docx-container.is-mobile {
  touch-action: none;
}

.mobile-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  transition: opacity 0.3s;
  z-index: 100;
}

.controls-hidden {
  opacity: 0;
}

.mobile-controls:hover {
  opacity: 1;
}

.mobile-controls .zoom-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
}

.mobile-controls .zoom-level {
  margin: 0 10px;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

/* 文档容器通用样式 */
.doc-viewport {
  position: absolute;
  top: 50%;
  left: 50%;
  transform-origin: 0 0;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 电脑端文档容器 */
.docx-container:not(.is-mobile) .doc-viewport {
  max-width: 100%;
  max-height: calc(100% - 70px);
}

/* 移动端提示 */
.touch-hint {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.hint-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 80%;
}

.hint-content p {
  margin: 10px 0;
  font-size: 16px;
}

.got-it-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  margin-top: 15px;
  font-size: 14px;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #f5222d;
  font-size: 16px;
}

/* 文档内容样式调整 */
:deep(.desktop-docx) {
  font-size: 14px !important;
  line-height: 1.5 !important;
  padding: 20px !important;
}

:deep(.mobile-docx) {
  font-size: 16px !important;
  line-height: 1.6 !important;
  padding: 15px !important;
}

:deep(.desktop-docx p),
:deep(.mobile-docx p) {
  margin-bottom: 12px !important;
}

:deep(.desktop-docx table),
:deep(.mobile-docx table) {
  width: 100% !important;
}

:deep(.mobile-docx table) {
  font-size: 14px !important;
}
</style>