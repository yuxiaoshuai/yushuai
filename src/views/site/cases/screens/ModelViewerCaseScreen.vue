<template>
  <div
    class="case-screen model-viewer-screen"
    :style="{ '--screen-accent': caseItem?.accent || '#7dd3fc' }"
  >
    <main class="screen-shell">
      <ModelViewer
        class="viewer"
        model-id="dancer"
        default-animation="SambaDance"
        :auto-play="true"
        :loop="true"
        :lazy="true"
        :show-controls="true"
        :show-loading="true"
        :show-info="false"
        height="100%"
      />
    </main>
  </div>
</template>

<script setup>
import ModelViewer from '@/components/model/ModelViewer.vue'

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
.case-screen {
  position: relative;
  height: 100vh;
  max-height: 100vh;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--screen-accent) 22%, transparent), transparent 34%),
    #08080c;
}

.screen-shell {
  width: min(calc(100% - 64px));
  height: min(calc(100vh - 58px));
  min-height: 420px;
  margin: 0 auto;
  padding-top: 58px;
  box-sizing: border-box;
}

.viewer {
  height: 100%;
  border: 1px solid rgba(230, 237, 243, 0.12);
  background:
    linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    radial-gradient(circle at center, rgba(125, 211, 252, 0.12), transparent 58%),
    #08080c;
  background-size: 40px 40px, 40px 40px, auto, auto;
}

@media (max-width: 720px) {
  .screen-shell {
    width: calc(100% - 28px);
    height: calc(100vh - 92px);
    min-height: 360px;
    padding-top: 64px;
  }
}
</style>
