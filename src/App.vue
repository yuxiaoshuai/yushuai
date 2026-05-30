<template>
  <RouterView v-if="isBlankLayout" />
  <MainLayout v-else />
</template>

<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()
const isBlankLayout = computed(() => route.meta?.layout === 'blank')
</script>

<style scoped>
</style>
