<template>
  <div
    v-if="caseItem"
    class="screen-page"
    :style="{ '--screen-accent': caseItem.accent }"
  >
    <RouterLink class="screen-back" to="/demo">返回案例</RouterLink>

    <main class="screen-shell">
      <section class="screen-title">
        <p>{{ caseItem.groupTitle }}</p>
        <h1>{{ caseItem.title }}</h1>
        <span>{{ caseItem.summary }}</span>
      </section>

      <section class="metric-strip">
        <div
          v-for="metric in caseItem.metrics"
          :key="metric.label"
          class="metric-card"
        >
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </div>
      </section>

      <section class="screen-grid">
        <div class="screen-panel visual-panel">
          <div class="panel-title">
            <span>三维态势</span>
            <em>LIVE</em>
          </div>
          <div class="twin-stage" aria-hidden="true">
            <div class="scan-line"></div>
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div
              v-for="tower in towers"
              :key="tower"
              class="tower"
              :style="{
                '--tower-height': `${36 + tower * 8}%`,
                '--tower-delay': `${tower * 0.16}s`,
              }"
            ></div>
          </div>
        </div>

        <div class="screen-panel trend-panel">
          <div class="panel-title">
            <span>运行趋势</span>
            <em>24H</em>
          </div>
          <div class="trend-bars" aria-hidden="true">
            <span
              v-for="bar in trendBars"
              :key="bar"
              :style="{ '--bar-height': `${bar}%` }"
            ></span>
          </div>
        </div>

        <div
          v-for="panel in caseItem.panels"
          :key="panel.title"
          class="screen-panel info-panel"
        >
          <div class="panel-title">
            <span>{{ panel.title }}</span>
            <em>CORE</em>
          </div>
          <strong>{{ panel.value }}</strong>
          <p>{{ panel.text }}</p>
        </div>
      </section>
    </main>
  </div>

  <div v-else class="missing-screen">
    <div>
      <p>案例不存在</p>
      <RouterLink class="screen-back-inline" to="/demo">返回案例列表</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { findCase } from './caseData'

const route = useRoute()
const towers = [1, 2, 3, 4, 5]
const trendBars = [44, 58, 52, 66, 74, 61, 82, 76, 88, 69, 92, 84]

const caseItem = computed(() => findCase(route.params.caseId))
</script>

<style scoped>
.screen-page {
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--screen-accent) 24%, transparent), transparent 28%),
    radial-gradient(circle at 78% 88%, rgba(255, 255, 255, 0.08), transparent 24%),
    #08080c;
  color: #fff;
}

.screen-back {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 5;
  padding: 8px 12px;
  border: 1px solid rgba(230, 237, 243, 0.16);
  border-radius: 8px;
  background: rgba(15, 15, 22, 0.72);
  color: rgba(230, 237, 243, 0.76);
  text-decoration: none;
  backdrop-filter: blur(8px);
}

.screen-back:hover {
  border-color: color-mix(in srgb, var(--screen-accent) 46%, rgba(230, 237, 243, 0.16));
  color: #fff;
}

.screen-shell {
  width: min(1600px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 42px 34px 34px;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 18px;
}

.screen-title {
  text-align: center;
}

.screen-title p {
  margin: 0 0 8px;
  color: color-mix(in srgb, var(--screen-accent) 88%, white);
  font-size: 13px;
  letter-spacing: 0.12em;
}

.screen-title h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(28px, 4vw, 52px);
  font-weight: 800;
  line-height: 1.18;
}

.screen-title span {
  display: block;
  width: min(720px, 100%);
  margin: 12px auto 0;
  color: rgba(230, 237, 243, 0.62);
  line-height: 1.7;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.screen-panel {
  border: 1px solid rgba(230, 237, 243, 0.12);
  border-radius: 8px;
  background: rgba(15, 22, 35, 0.68);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.28);
}

.metric-card {
  padding: 14px 16px;
}

.metric-card strong {
  display: block;
  color: color-mix(in srgb, var(--screen-accent) 84%, white);
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.metric-card span {
  display: block;
  margin-top: 8px;
  color: rgba(230, 237, 243, 0.52);
  font-size: 13px;
}

.screen-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: minmax(280px, 1.25fr) minmax(170px, 0.75fr);
  gap: 14px;
}

.screen-panel {
  overflow: hidden;
  padding: 16px;
}

.visual-panel {
  grid-column: span 2;
}

.trend-panel {
  min-height: 260px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-title span {
  color: #f5f7fb;
  font-weight: 650;
}

.panel-title em {
  font-style: normal;
  color: color-mix(in srgb, var(--screen-accent) 78%, white);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.twin-stage {
  position: relative;
  height: calc(100% - 38px);
  min-height: 240px;
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 18px;
  border-radius: 8px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, transparent 1px),
    radial-gradient(circle at center, color-mix(in srgb, var(--screen-accent) 18%, transparent), transparent 58%);
  background-size: 42px 42px, 42px 42px, auto;
}

.scan-line {
  position: absolute;
  inset: 16px 16px auto;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--screen-accent), transparent);
  animation: scan 3.2s ease-in-out infinite;
}

.orbit {
  position: absolute;
  left: 50%;
  top: 52%;
  border: 1px solid color-mix(in srgb, var(--screen-accent) 38%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(68deg);
}

.orbit-one {
  width: 64%;
  height: 64%;
}

.orbit-two {
  width: 42%;
  height: 42%;
}

.tower {
  width: 46px;
  height: var(--tower-height);
  border: 1px solid color-mix(in srgb, var(--screen-accent) 42%, rgba(255, 255, 255, 0.16));
  border-radius: 8px 8px 0 0;
  background:
    linear-gradient(to top, color-mix(in srgb, var(--screen-accent) 34%, transparent), rgba(255, 255, 255, 0.04)),
    rgba(255, 255, 255, 0.025);
  box-shadow: 0 0 28px color-mix(in srgb, var(--screen-accent) 22%, transparent);
  animation: pulse 2.6s ease-in-out infinite;
  animation-delay: var(--tower-delay);
}

.trend-bars {
  height: calc(100% - 38px);
  min-height: 190px;
  display: flex;
  align-items: end;
  gap: 8px;
}

.trend-bars span {
  flex: 1;
  height: var(--bar-height);
  border-radius: 6px 6px 0 0;
  background: linear-gradient(to top, color-mix(in srgb, var(--screen-accent) 64%, #111826), rgba(255, 255, 255, 0.18));
}

.info-panel strong {
  display: block;
  color: color-mix(in srgb, var(--screen-accent) 84%, white);
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
}

.info-panel p {
  margin: 14px 0 0;
  color: rgba(230, 237, 243, 0.6);
  line-height: 1.7;
}

.missing-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
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

@keyframes scan {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.2;
  }
  50% {
    transform: translateY(210px);
    opacity: 0.9;
  }
}

@keyframes pulse {
  0%,
  100% {
    filter: brightness(0.92);
  }
  50% {
    filter: brightness(1.18);
  }
}

@media (max-width: 980px) {
  .screen-page {
    overflow: auto;
  }

  .screen-shell {
    min-height: auto;
    padding: 72px 18px 24px;
  }

  .metric-strip,
  .screen-grid {
    grid-template-columns: 1fr 1fr;
  }

  .screen-grid {
    grid-template-rows: auto;
  }

  .visual-panel,
  .trend-panel {
    grid-column: span 2;
  }
}

@media (max-width: 620px) {
  .metric-strip,
  .screen-grid {
    grid-template-columns: 1fr;
  }

  .visual-panel,
  .trend-panel {
    grid-column: span 1;
  }

  .screen-title h1 {
    font-size: 28px;
  }

  .twin-stage {
    gap: 10px;
  }

  .tower {
    width: 34px;
  }
}
</style>
