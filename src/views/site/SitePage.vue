<template>
  <section class="site-page">
    <p class="site-page-kicker">{{ slug }}</p>
    <h1>{{ title }}</h1>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => route.meta?.siteTitle || '')
const slug = computed(() => route.meta?.siteSlug || '')
</script>

<style scoped>
.site-page {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-left: 4px solid #40b4ff;
  padding-left: 24px;
}

.site-page-kicker {
  margin: 0 0 8px;
  color: #40b4ff;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.site-page h1 {
  margin: 0;
  color: #f0f0f0;
  font-size: 34px;
  font-weight: 700;
}

@media (max-width: 560px) {
  .site-page {
    min-height: 240px;
    padding-left: 16px;
  }

  .site-page h1 {
    font-size: 28px;
  }
}
</style>
