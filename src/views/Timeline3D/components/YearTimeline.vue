<!-- src/views/Timeline3D/components/YearTimeline.vue -->
<template>
  <div class="year-timeline-wrapper" :style="wrapperStyle">
    <div class="year-timeline-container" ref="yearContainerRef">
      <div class="year-timeline-line"></div>

      <div v-for="y in years" :key="y" class="year-node-container">
        <div class="year-node" @click="$emit('select-year', y)">
          {{ y }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const props = defineProps({
  years: { type: Array, required: true },
  hidden: { type: Boolean, default: false },
});
defineEmits(["select-year"]);

const yearContainerRef = ref(null);
let st;

const wrapperStyle = computed(() => ({
  opacity: props.hidden ? 0 : 1,
  visibility: props.hidden ? "hidden" : "visible",
}));

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger);

  const container = yearContainerRef.value;
  if (!container) return;

  const yearScrollRange = () => {
    const containerHeight = container.offsetHeight;
    const windowHeight = window.innerHeight;
    return containerHeight > windowHeight
      ? -(containerHeight - windowHeight) / 1.5
      : 0;
  };

  // 与 demo 一致：延迟触发 ScrollTrigger 旋转/位移
  setTimeout(() => {
    st = gsap.to(container, {
      y: yearScrollRange(),
      rotationX: 12,
      scrollTrigger: {
        trigger: ".year-timeline-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        ease: "power2.inOut",
        invalidateOnRefresh: true,
      },
    });
  }, 300);
});

onBeforeUnmount(() => {
  if (st?.scrollTrigger) st.scrollTrigger.kill();
  st?.kill?.();
});
</script>
