<template>
  <section class="case-page">
    <section
      v-for="group in caseGroups"
      :key="group.id"
      class="case-group"
    >
      <h2>{{ group.title }}</h2>

      <div class="case-grid">
        <RouterLink
          v-for="item in group.cases"
          :key="item.id"
          class="case-card"
          :to="{ name: 'CaseScreen', params: { caseId: item.id } }"
          :style="{ '--card-accent': item.accent }"
        >
          <div class="case-thumb" :class="`case-thumb--${item.visual}`" aria-hidden="true">
            <div class="thumb-grid"></div>
            <div class="thumb-object"></div>
            <div class="thumb-object thumb-object-secondary"></div>
          </div>

          <div class="case-title-row">
            <h3>{{ item.title }}</h3>
            <span v-if="item.badge" class="case-badge">{{ item.badge }}</span>
          </div>
          <p class="case-summary">{{ item.summary }}</p>
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { caseGroups } from './caseData'
</script>

<style scoped>
.case-page {
  min-height: calc(100vh - 70px - 145px);
  width: 100%;
  background: transparent;
  color: #fff;
}

.case-group + .case-group {
  margin-top: 48px;
}

.case-group h2 {
  margin: 0 0 10px;
  color: #f5f7fb;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
}

.case-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 39px;
  row-gap: 46px;
}

.case-card {
  display: block;
  min-width: 0;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}

.case-thumb {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  background: #071126;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.case-card:hover .case-thumb {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.case-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
}

.case-title-row h3 {
  margin: 0;
  color: #f5f7fb;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.25;
}

.case-badge {
  flex: 0 0 auto;
  padding: 1px 6px;
  border: 1px solid #d4d8df;
  border-radius: 3px;
  background: #fff;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.case-summary {
  margin: 3px 0 0;
  overflow: hidden;
  color: rgba(230, 237, 243, 0.68);
  font-size: 14px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thumb-grid,
.thumb-object,
.thumb-object-secondary {
  position: absolute;
}

.thumb-grid {
  inset: 0;
  opacity: 0.55;
}

.thumb-object {
  z-index: 1;
}

.case-thumb--park {
  background:
    linear-gradient(160deg, transparent 48%, rgba(116, 211, 151, 0.32) 49% 67%, transparent 68%),
    #050505;
}

.case-thumb--park .thumb-grid {
  background:
    linear-gradient(90deg, transparent 8%, rgba(255, 255, 255, 0.08) 9% 10%, transparent 11%),
    linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
  background-size: 54px 100%, 100% 24px;
  transform: perspective(300px) rotateX(58deg) translateY(34%);
}

.case-thumb--park .thumb-object {
  left: 22%;
  bottom: 25%;
  width: 56%;
  height: 38%;
  border-radius: 4px 4px 0 0;
  background:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.82) 0 11px, rgba(180, 220, 255, 0.72) 12px 18px),
    linear-gradient(#e9edf3, #b6c4d5);
  transform: skewX(-12deg);
  box-shadow: -34px 34px 0 rgba(155, 196, 214, 0.9), 42px 28px 0 rgba(206, 218, 229, 0.9);
}

.case-thumb--campus {
  background:
    radial-gradient(circle at center, rgba(255, 221, 155, 0.3), transparent 34%),
    linear-gradient(180deg, #0d1c34, #020713);
}

.case-thumb--campus .thumb-grid {
  inset: 10% 18%;
  border: 1px solid rgba(255, 190, 87, 0.42);
  border-radius: 6px;
  background:
    linear-gradient(90deg, rgba(64, 180, 255, 0.2), transparent 26% 74%, rgba(64, 180, 255, 0.18)),
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: auto, 100% 22px;
}

.case-thumb--campus .thumb-object {
  inset: 32% 28% 18%;
  border-radius: 3px;
  background: linear-gradient(135deg, #233348, #0c1320);
  box-shadow: 30px 20px 0 #18283d, -36px 18px 0 #263a52, 0 -22px 0 #2f4159;
}

.case-thumb--earth {
  background:
    radial-gradient(circle at 42% 48%, rgba(71, 211, 255, 0.88) 0 17%, rgba(38, 116, 210, 0.6) 18% 24%, transparent 25%),
    radial-gradient(circle at 48% 48%, rgba(35, 166, 255, 0.28), transparent 36%),
    #020824;
}

.case-thumb--earth .thumb-grid {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 1px, transparent 1.5px);
  background-size: 38px 34px;
}

.case-thumb--earth .thumb-object {
  left: 37%;
  top: 22%;
  width: 28%;
  height: 42%;
  border: 1px solid rgba(113, 221, 255, 0.55);
  border-radius: 50%;
  transform: rotate(-28deg);
}

.case-thumb--ocean {
  background:
    linear-gradient(180deg, rgba(212, 239, 255, 0.72), transparent 46%),
    repeating-linear-gradient(168deg, rgba(255, 255, 255, 0.3) 0 2px, transparent 3px 12px),
    linear-gradient(180deg, #9fc7dc 0 46%, #5aa3c3 47% 100%);
}

.case-thumb--ocean::after {
  content: 'GhostCat';
  position: absolute;
  inset: 40% 0 auto;
  color: rgba(75, 85, 99, 0.58);
  font-size: clamp(22px, 3vw, 36px);
  font-weight: 800;
  text-align: center;
}

.case-thumb--distortion {
  background:
    radial-gradient(circle at center, rgba(67, 200, 255, 0.7) 0 10%, rgba(33, 94, 189, 0.35) 11% 18%, transparent 19%),
    #020202;
}

.case-thumb--distortion .thumb-object {
  inset: 26% 21%;
  border-radius: 46% 54% 47% 53%;
  background:
    radial-gradient(circle at center, rgba(65, 195, 255, 0.72), transparent 18%),
    #030b27;
  transform: skewY(-4deg);
}

.case-thumb--pie {
  background: #fff;
}

.case-thumb--pie .thumb-object {
  left: 38%;
  top: 31%;
  width: 26%;
  height: 26%;
  border-radius: 50%;
  background: conic-gradient(#e83f7e 0 42%, #1ba6c6 43% 72%, #0e5aa6 73% 100%);
  transform: rotateX(58deg);
  box-shadow: 0 18px 0 rgba(18, 110, 139, 0.42);
}

.case-thumb--city {
  background:
    radial-gradient(circle at 50% 70%, rgba(26, 247, 157, 0.32), transparent 42%),
    linear-gradient(180deg, #061539, #030718);
}

.case-thumb--city .thumb-grid {
  background:
    linear-gradient(90deg, rgba(51, 231, 178, 0.13) 1px, transparent 1px),
    linear-gradient(rgba(51, 231, 178, 0.1) 1px, transparent 1px);
  background-size: 22px 22px;
  transform: perspective(360px) rotateX(62deg) translateY(32%);
}

.case-thumb--city .thumb-object {
  left: 18%;
  right: 18%;
  bottom: 18%;
  height: 46%;
  background:
    linear-gradient(90deg, #1bbf9a 0 7%, transparent 8% 12%, #46f381 13% 20%, transparent 21% 30%, #1873e7 31% 40%, transparent 41% 46%, #3eee95 47% 58%, transparent 59% 64%, #1cb4ff 65% 74%, transparent 75% 80%, #46f381 81% 100%);
  clip-path: polygon(0 100%, 0 62%, 8% 62%, 8% 36%, 18% 36%, 18% 74%, 28% 74%, 28% 26%, 39% 26%, 39% 66%, 52% 66%, 52% 18%, 64% 18%, 64% 72%, 76% 72%, 76% 42%, 88% 42%, 88% 58%, 100% 58%, 100% 100%);
}

.case-thumb--car {
  background:
    linear-gradient(180deg, #f4f4f4, #dedede);
}

.case-thumb--car .thumb-object {
  left: 24%;
  right: 20%;
  bottom: 26%;
  height: 28%;
  border-radius: 44% 48% 14% 14%;
  background: linear-gradient(180deg, #3ca7ff, #0867bd);
  box-shadow: 16px 18px 0 -9px #111827, 118px 18px 0 -9px #111827;
}

.case-thumb--portal {
  background: #020202;
}

.case-thumb--portal .thumb-object,
.case-thumb--portal .thumb-object-secondary {
  top: 24%;
  width: 22%;
  height: 54%;
  border-radius: 50%;
  border: 8px solid #ff5c26;
  box-shadow: 0 0 34px #ff5c26;
}

.case-thumb--portal .thumb-object {
  left: 26%;
}

.case-thumb--portal .thumb-object-secondary {
  right: 24%;
  border-color: #21c5ff;
  box-shadow: 0 0 34px #21c5ff;
}

.case-thumb--room {
  background: #050505;
}

.case-thumb--room .thumb-object {
  left: 27%;
  top: 20%;
  width: 46%;
  height: 54%;
  border-radius: 4px;
  background:
    linear-gradient(135deg, #8165ff 0 31%, #ff6d99 32% 62%, #212132 63% 100%);
  transform: perspective(240px) rotateY(-22deg);
  box-shadow: 22px 20px 0 rgba(255, 255, 255, 0.13);
}

.case-thumb--robot {
  background:
    radial-gradient(circle at 50% 35%, rgba(54, 247, 255, 0.28), transparent 33%),
    linear-gradient(180deg, #041019, #02050a);
}

.case-thumb--robot .thumb-grid {
  background:
    linear-gradient(90deg, rgba(93, 239, 255, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(93, 239, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  transform: perspective(300px) rotateX(57deg) translateY(34%);
}

.case-thumb--robot .thumb-object {
  left: 42%;
  top: 18%;
  width: 16%;
  height: 54%;
  border-radius: 14px 14px 10px 10px;
  background:
    radial-gradient(circle at 50% 36%, #7ff7ff 0 8%, transparent 9%),
    linear-gradient(180deg, #e4fbff 0 22%, #37d8ef 23% 39%, #9defff 40% 67%, #1fb3d2 68% 100%);
  box-shadow:
    -27px 36px 0 -15px rgba(116, 247, 255, 0.9),
    27px 36px 0 -15px rgba(116, 247, 255, 0.9),
    0 -18px 0 -6px rgba(128, 249, 255, 0.88),
    0 0 34px rgba(54, 247, 255, 0.45);
}

.case-thumb--robot .thumb-object-secondary {
  left: 34%;
  right: 34%;
  bottom: 18%;
  height: 7%;
  border-radius: 999px;
  background: rgba(95, 244, 255, 0.78);
  box-shadow: 0 0 20px rgba(54, 247, 255, 0.68);
}

.case-thumb--map {
  background: #ff913d;
}

.case-thumb--map .thumb-grid {
  background:
    linear-gradient(145deg, transparent 0 40%, rgba(255, 255, 255, 0.72) 41% 45%, transparent 46%),
    linear-gradient(35deg, transparent 0 57%, rgba(255, 255, 255, 0.72) 58% 62%, transparent 63%);
}

.case-thumb--map .thumb-object {
  right: 24%;
  bottom: 28%;
  width: 22%;
  height: 34%;
  background: #e4eb5c;
  transform: skewY(-18deg);
  box-shadow: -84px 18px 0 -4px #f1f5f9, -42px 35px 0 -6px #f1f5f9, 48px 28px 0 -3px #f1f5f9;
}

@media (max-width: 1200px) {
  .case-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .case-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 22px;
  }
}

@media (max-width: 560px) {
  .case-grid {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }
}
</style>
