<template>
  <section class="under-develop-page">
    <div class="bg-grid"></div>
    <div class="glow glow-one"></div>
    <div class="glow glow-two"></div>

    <div class="content-card">
      <div class="planet-wrap">
        <div class="orbit orbit-one">
          <span>Vue3</span>
        </div>
        <div class="orbit orbit-two">
          <span>Design</span>
        </div>
        <div class="orbit orbit-three">
          <span>Ideas</span>
        </div>

        <div class="planet">
          <div class="planet-light"></div>
          <div class="planet-ring"></div>
          <div class="planet-hole hole-one"></div>
          <div class="planet-hole hole-two"></div>
          <div class="planet-hole hole-three"></div>
        </div>
      </div>

      <!-- <h1>这片区域还在生长中</h1> -->

      <div class="status-box">
        <span class="status-dot"></span>
        <span>模块构建中 · 灵感加载中 · 页面即将开放</span>
      </div>

      <button class="back-btn" @click="goBack">
        返回上一页
      </button>
    </div>
  </section>
</template>

<script setup>
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = '/'
  }
}
</script>

<style scoped>
.under-develop-page {
  position: relative;
  min-height: calc(100vh - 70px - 225px);
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  background:
    radial-gradient(circle at top, rgba(122, 92, 255, 0.25), transparent 35%),
    linear-gradient(135deg, #080a18 0%, #11142a 45%, #05060d 100%);
  color: #fff;
}

.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(circle at center, black, transparent 72%);
}

.glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.55;
  animation: floatGlow 8s ease-in-out infinite;
}

.glow-one {
  width: 260px;
  height: 260px;
  left: 12%;
  top: 16%;
  background: rgba(90, 130, 255, 0.36);
}

.glow-two {
  width: 320px;
  height: 320px;
  right: 8%;
  bottom: 12%;
  background: rgba(255, 118, 214, 0.24);
  animation-delay: -3s;
}

.content-card {
  position: relative;
  z-index: 2;
  width: min(680px, 100%);
  padding: 56px 36px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 32px;
  text-align: center;
  background: rgba(255, 255, 255, 0.075);
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(18px);
}

.planet-wrap {
  position: relative;
  width: 220px;
  height: 220px;
  margin: 0 auto 28px;
}

.planet {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 128px;
  height: 128px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 26%, #fff7c7 0%, #ffd36e 16%, transparent 17%),
    linear-gradient(135deg, #7c5cff, #37d5ff 52%, #ff79d1);
  box-shadow:
    0 0 38px rgba(87, 211, 255, 0.45),
    inset -18px -20px 35px rgba(0, 0, 0, 0.25);
  animation: planetFloat 4.6s ease-in-out infinite;
}

.planet-light {
  position: absolute;
  inset: 12px auto auto 18px;
  width: 36px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.42);
  transform: rotate(-28deg);
}

.planet-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 186px;
  height: 42px;
  border: 8px solid rgba(255, 255, 255, 0.22);
  border-left-color: rgba(255, 255, 255, 0.04);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotate(-18deg);
}

.planet-hole {
  position: absolute;
  border-radius: 50%;
  background: rgba(23, 25, 58, 0.28);
}

.hole-one {
  width: 16px;
  height: 16px;
  right: 28px;
  top: 32px;
}

.hole-two {
  width: 22px;
  height: 22px;
  left: 28px;
  bottom: 30px;
}

.hole-three {
  width: 10px;
  height: 10px;
  right: 40px;
  bottom: 36px;
}

.orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: rotateOrbit 12s linear infinite;
}

.orbit span {
  position: absolute;
  left: 50%;
  top: -13px;
  transform: translateX(-50%);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #dce7ff;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  white-space: nowrap;
}

.orbit-one {
  width: 170px;
  height: 170px;
}

.orbit-two {
  width: 205px;
  height: 205px;
  animation-duration: 16s;
  animation-direction: reverse;
}

.orbit-three {
  width: 230px;
  height: 230px;
  animation-duration: 20s;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 54px);
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.04em;
  background: linear-gradient(90deg, #ffffff, #b8d8ff, #ffb7eb);
  -webkit-background-clip: text;
  color: transparent;
}

.status-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  padding: 12px 16px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 14px;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #72ffbd;
  box-shadow: 0 0 16px rgba(114, 255, 189, 0.9);
  animation: pulse 1.8s ease-in-out infinite;
}

.back-btn {
  display: block;
  margin: 30px auto 0;
  padding: 13px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  color: #101327;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff, #b9e2ff);
  box-shadow: 0 14px 30px rgba(55, 213, 255, 0.22);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(55, 213, 255, 0.32);
}

@keyframes rotateOrbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }

  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes planetFloat {
  0%,
  100% {
    transform: translate(-50%, -50%) translateY(0);
  }

  50% {
    transform: translate(-50%, -50%) translateY(-10px);
  }
}

@keyframes floatGlow {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(20px, -18px, 0) scale(1.08);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.5);
    opacity: 0.45;
  }
}

@media (max-width: 640px) {
  .content-card {
    padding: 42px 22px;
    border-radius: 26px;
  }

  .planet-wrap {
    width: 190px;
    height: 190px;
  }

  .planet {
    width: 110px;
    height: 110px;
  }

  .planet-ring {
    width: 158px;
  }

  .orbit-one {
    width: 148px;
    height: 148px;
  }

  .orbit-two {
    width: 178px;
    height: 178px;
  }

  .orbit-three {
    width: 202px;
    height: 202px;
  }

  .status-box {
    border-radius: 18px;
    line-height: 1.5;
  }
}
</style>
