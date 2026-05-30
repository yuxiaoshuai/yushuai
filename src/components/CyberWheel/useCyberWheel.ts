import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  type Ref,
  watch,
} from 'vue'
import type {
  CyberWheelConfig,
  CyberWheelItem,
  CyberWheelLoadingMode,
  CyberWheelPayload,
  CyberWheelState,
} from './types'

type StrictConfig = Required<CyberWheelConfig>

interface UseCyberWheelOptions {
  items: Ref<CyberWheelItem[]>
  config: Ref<CyberWheelConfig | undefined>
  activeKey: Ref<string | undefined>
  lightOn: Ref<boolean | undefined>
  storageKey: Ref<string | undefined>
  persist: Ref<boolean>
  emit: (event: string, ...args: any[]) => void
}

const FALLBACK_CONFIG: Omit<StrictConfig, 'visibleKeys' | 'orderKeys' | 'aliasMap' | 'pathMap' | 'defaultKey'> = {
  wakeupDelay: 500,
  wheelThreshold: 40,
  snapDuration: 450,
  loadingMode: 'confirm',
  soundEnabled: true,
  hapticEnabled: true,
  lightIntensity: 'standard',
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const nextValue = Number(value)
  if (!Number.isFinite(nextValue)) return fallback
  return Math.min(max, Math.max(min, nextValue))
}

function normalizeMode(value: unknown): CyberWheelLoadingMode {
  return value === 'auto' || value === 'preview' || value === 'confirm' ? value : 'confirm'
}

function normalizeIntensity(value: unknown) {
  return value === 'weak' || value === 'strong' || value === 'standard' ? value : 'standard'
}

function uniqueKeys(keys: unknown[], validKeys: Set<string>) {
  const result: string[] = []
  keys.forEach((key) => {
    if (typeof key === 'string' && validKeys.has(key) && !result.includes(key)) {
      result.push(key)
    }
  })
  return result
}

export function useCyberWheel(options: UseCyberWheelOptions) {
  const {
    items,
    config,
    activeKey,
    lightOn,
    storageKey,
    persist,
    emit,
  } = options

  const wheelWrapRef = ref<HTMLElement | null>(null)
  const outerRingRef = ref<HTMLElement | null>(null)
  const internalConfig = ref<StrictConfig>(buildDefaultConfig())
  const currentRotate = ref(0)
  const activeIndex = ref(0)
  const targetRotate = ref(0)
  const isSnapping = ref(false)
  const isDragging = ref(false)
  const isDocked = ref(false)
  const localLightOn = ref(lightOn.value ?? true)
  const isConfigOpen = ref(false)
  const configMenuPosition = ref({ x: 24, y: 24 })
  const isConfirmReady = ref(false)
  const isLoading = ref(false)
  const pendingPayload = ref<CyberWheelPayload | null>(null)
  const loadedPayload = ref<CyberWheelPayload | null>(null)

  let rafId = 0
  let selectionTimer: ReturnType<typeof setTimeout> | null = null
  let loadTimer: ReturnType<typeof setTimeout> | null = null
  let snapStartRotate = 0
  let snapStartTime = 0
  let wheelDeltaAccumulator = 0
  let lastTickIndex = 0
  let lastTouchAngle = 0
  let lastMoveTime = 0
  let angularVelocity = 0
  let audioCtx: AudioContext | null = null

  const validKeySet = computed(() => new Set(items.value.map((item) => item.key)))

  const visibleItems = computed(() => {
    const byKey = new Map(items.value.map((item) => [item.key, item]))
    const visible = new Set(internalConfig.value.visibleKeys)
    const orderedKeys = internalConfig.value.orderKeys.filter((key) => visible.has(key) && byKey.has(key))
    const keys = orderedKeys.length ? orderedKeys : items.value.slice(0, 1).map((item) => item.key)

    return keys
      .map((key) => byKey.get(key))
      .filter(Boolean)
      .map((item) => decorateItem(item as CyberWheelItem))
  })

  const count = computed(() => Math.max(visibleItems.value.length, 1))
  const perAngle = computed(() => 360 / count.value)
  const activeItem = computed(() => visibleItems.value[normalizeIndex(activeIndex.value)])
  const activePayload = computed(() => payloadForIndex(activeIndex.value))

  const wheelBackground = computed(() => {
    const colors = [
      'rgba(255, 107, 107, 0.12)',
      'rgba(254, 202, 87, 0.12)',
      'rgba(72, 219, 251, 0.12)',
      'rgba(255, 159, 243, 0.12)',
      'rgba(29, 209, 161, 0.12)',
      'rgba(255, 159, 67, 0.12)',
    ]

    const parts = visibleItems.value.map((item, index) => {
      const colorIndex = getColorIndex(item, index)
      return `${colors[colorIndex % colors.length]} ${index * perAngle.value}deg ${(index + 1) * perAngle.value}deg`
    })

    return `conic-gradient(from ${-perAngle.value / 2 + 90}deg, ${parts.join(',')})`
  })

  function buildDefaultConfig(): StrictConfig {
    const keys = items.value.map((item) => item.key)
    const firstKey = keys[0] || ''

    return {
      visibleKeys: keys,
      orderKeys: keys,
      aliasMap: Object.fromEntries(items.value.map((item) => [item.key, item.label])),
      pathMap: Object.fromEntries(items.value.map((item) => [item.key, item.path || item.routePath || ''])),
      defaultKey: activeKey.value || config.value?.defaultKey || firstKey,
      ...FALLBACK_CONFIG,
    }
  }

  function normalizeConfig(nextConfig: CyberWheelConfig): StrictConfig {
    const defaults = buildDefaultConfig()
    const validKeys = validKeySet.value
    const sourceOrderKeys = Array.isArray(nextConfig.orderKeys) ? nextConfig.orderKeys : []
    const merged = {
      ...defaults,
      ...nextConfig,
      aliasMap: { ...defaults.aliasMap, ...(nextConfig.aliasMap || {}) },
      pathMap: { ...defaults.pathMap, ...(nextConfig.pathMap || {}) },
    }

    const orderKeys = uniqueKeys(Array.isArray(merged.orderKeys) ? merged.orderKeys : [], validKeys)
    items.value.forEach((item) => {
      if (!orderKeys.includes(item.key)) orderKeys.push(item.key)
    })

    let visibleKeys = uniqueKeys(Array.isArray(merged.visibleKeys) ? merged.visibleKeys : [], validKeys)
    items.value.forEach((item) => {
      if (!sourceOrderKeys.includes(item.key) && !visibleKeys.includes(item.key)) {
        visibleKeys.push(item.key)
      }
    })
    if (!visibleKeys.length && orderKeys.length) visibleKeys = [orderKeys[0]]

    const defaultKey = validKeys.has(String(merged.defaultKey)) ? String(merged.defaultKey) : orderKeys[0] || ''

    return {
      visibleKeys,
      orderKeys,
      aliasMap: merged.aliasMap,
      pathMap: merged.pathMap,
      defaultKey,
      wakeupDelay: clampNumber(merged.wakeupDelay, 0, 1500, FALLBACK_CONFIG.wakeupDelay),
      wheelThreshold: clampNumber(merged.wheelThreshold, 10, 120, FALLBACK_CONFIG.wheelThreshold),
      snapDuration: clampNumber(merged.snapDuration, 120, 1000, FALLBACK_CONFIG.snapDuration),
      loadingMode: normalizeMode(merged.loadingMode),
      soundEnabled: Boolean(merged.soundEnabled),
      hapticEnabled: Boolean(merged.hapticEnabled),
      lightIntensity: normalizeIntensity(merged.lightIntensity),
    }
  }

  function loadSavedConfig() {
    if (!persist.value || !storageKey.value || typeof window === 'undefined') return {}

    try {
      const saved = window.localStorage.getItem(storageKey.value)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      return {}
    }
  }

  function persistConfigState() {
    if (!persist.value || !storageKey.value || typeof window === 'undefined') return

    try {
      window.localStorage.setItem(storageKey.value, JSON.stringify(internalConfig.value))
    } catch (error) {
      // localStorage may be unavailable in private browsing; the component should keep working.
    }
  }

  function hydrateConfig() {
    const saved = loadSavedConfig()
    internalConfig.value = normalizeConfig({
      ...buildDefaultConfig(),
      ...(config.value || {}),
      ...saved,
    })
  }

  function applyConfig(nextConfig: CyberWheelConfig, shouldEmit = true) {
    internalConfig.value = normalizeConfig(nextConfig)
    persistConfigState()
    refreshAfterConfig()
    if (shouldEmit) emit('configChange', clonePlain(internalConfig.value))
  }

  function resetConfig() {
    applyConfig({
      ...buildDefaultConfig(),
      ...(config.value || {}),
    })
  }

  function decorateItem(item: CyberWheelItem): CyberWheelItem {
    const label = (internalConfig.value.aliasMap[item.key] || item.label || item.key).trim() || item.key
    const path = (internalConfig.value.pathMap[item.key] || item.path || item.routePath || '').trim()
    return {
      ...item,
      label,
      path,
    }
  }

  function getColorIndex(item: CyberWheelItem, fallbackIndex: number) {
    return Number.isFinite(item.colorIndex) ? Number(item.colorIndex) : fallbackIndex
  }

  function normalizeIndex(index: number) {
    return ((index % count.value) + count.value) % count.value
  }

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
  }

  function payloadForIndex(index: number): CyberWheelPayload | null {
    const normalizedIndex = normalizeIndex(index)
    const item = visibleItems.value[normalizedIndex]
    if (!item) return null

    return {
      key: item.key,
      label: item.label,
      path: item.path,
      routePath: item.routePath,
      index: normalizedIndex,
      item,
      loadingMode: internalConfig.value.loadingMode,
    }
  }

  function playTickSound() {
    if (!internalConfig.value.soundEnabled || typeof window === 'undefined') return

    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtor) return
      if (!audioCtx) audioCtx = new AudioCtor()
      if (audioCtx.state === 'suspended') audioCtx.resume()

      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.02)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.02)
    } catch (error) {
      // Audio feedback is optional.
    }
  }

  function triggerHaptic() {
    if (!internalConfig.value.hapticEnabled || typeof navigator === 'undefined') return
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
  }

  function evaluateTick() {
    const predictedIndex = normalizeIndex(Math.round(-currentRotate.value / perAngle.value))
    if (predictedIndex === lastTickIndex) return
    lastTickIndex = predictedIndex
    playTickSound()
    triggerHaptic()
  }

  function clearWakeup() {
    if (selectionTimer) clearTimeout(selectionTimer)
    selectionTimer = null
    isConfirmReady.value = false
    isLoading.value = false
  }

  function clearLoadTimer() {
    if (loadTimer) clearTimeout(loadTimer)
    loadTimer = null
  }

  function emitSelection(payload: CyberWheelPayload | null) {
    if (!payload) return
    emit('update:activeKey', payload.key)
    emit('select', payload)
  }

  function settleSelection() {
    const payload = payloadForIndex(activeIndex.value)
    pendingPayload.value = payload
    clearWakeup()

    if (!payload || !localLightOn.value || payload.item.disabled) return

    selectionTimer = setTimeout(() => {
      const latestPayload = payloadForIndex(activeIndex.value)
      if (!localLightOn.value || !latestPayload || latestPayload.key !== payload.key) return

      if (internalConfig.value.loadingMode === 'confirm') {
        isConfirmReady.value = true
        return
      }

      if (internalConfig.value.loadingMode === 'preview') {
        emit('preview', latestPayload)
        return
      }

      requestLoadCurrent()
    }, internalConfig.value.wakeupDelay)
  }

  function snapToIndex(index: number, options: { immediate?: boolean; emitSelect?: boolean } = {}) {
    if (!visibleItems.value.length) return

    clearWakeup()
    clearLoadTimer()
    activeIndex.value = normalizeIndex(index)
    const payload = payloadForIndex(activeIndex.value)
    if (options.emitSelect !== false) emitSelection(payload)

    const nextRotate = -activeIndex.value * perAngle.value
    const delta = ((nextRotate - currentRotate.value + 540) % 360) - 180
    targetRotate.value = currentRotate.value + delta
    snapStartRotate = currentRotate.value
    snapStartTime = performance.now()

    if (options.immediate) {
      isSnapping.value = false
      currentRotate.value = nextRotate
      lastTickIndex = activeIndex.value
      settleSelection()
      return
    }

    isSnapping.value = true
  }

  function snapToKey(key: string, options: { immediate?: boolean; emitSelect?: boolean } = {}) {
    const index = visibleItems.value.findIndex((item) => item.key === key)
    if (index === -1) return
    snapToIndex(index, options)
  }

  function requestLoadCurrent() {
    const payload = payloadForIndex(activeIndex.value)
    if (!payload || !localLightOn.value || payload.item.disabled) return

    clearWakeup()
    clearLoadTimer()
    pendingPayload.value = payload
    isLoading.value = true
    emit('requestLoad', payload)

    loadTimer = setTimeout(() => {
      isLoading.value = false
      loadedPayload.value = payload
      emit('loaded', payload)
    }, 260)
  }

  function setLightEnabled(value: boolean) {
    if (localLightOn.value === value) return

    localLightOn.value = value
    emit('update:lightOn', value)
    emit('lightChange', value)

    if (value) {
      isDocked.value = false
      nextTick(() => settleSelection())
    } else {
      clearWakeup()
      clearLoadTimer()
    }
  }

  function turnOn() {
    setLightEnabled(true)
  }

  function turnOff() {
    setLightEnabled(false)
  }

  function toggleLight() {
    setLightEnabled(!localLightOn.value)
  }

  function openConfigMenu(x = configMenuPosition.value.x, y = configMenuPosition.value.y) {
    isDocked.value = false
    configMenuPosition.value = constrainMenuPosition(x, y)
    isConfigOpen.value = true
  }

  function closeConfigMenu() {
    isConfigOpen.value = false
  }

  function constrainMenuPosition(x: number, y: number) {
    if (typeof window === 'undefined') return { x, y }
    const padding = 10
    const width = 390
    const height = Math.min(window.innerHeight * 0.78, 720)

    return {
      x: Math.max(padding, Math.min(x, window.innerWidth - width - padding)),
      y: Math.max(padding, Math.min(y, window.innerHeight - height - padding)),
    }
  }

  function setDockedState(shouldDock: boolean) {
    if (localLightOn.value) {
      isDocked.value = false
      return
    }
    isDocked.value = shouldDock
  }

  function isPointerInOuterRingArea(clientX: number, clientY: number) {
    const ring = outerRingRef.value
    if (!ring) return false
    const rect = ring.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distance = Math.hypot(clientX - centerX, clientY - centerY)
    const outerRadius = rect.width / 2
    const innerRadius = Math.max(0, outerRadius - 34)
    return distance <= outerRadius && distance >= innerRadius
  }

  function handleMouseEnter() {
    if (!localLightOn.value) setDockedState(false)
  }

  function handleMouseLeave() {
    if (!localLightOn.value && !isConfigOpen.value) setDockedState(true)
  }

  function handleMouseMove(event: MouseEvent) {
    if (!localLightOn.value && isPointerInOuterRingArea(event.clientX, event.clientY)) {
      setDockedState(false)
    }
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault()
    if (isSnapping.value) return

    clearWakeup()
    wheelDeltaAccumulator += event.deltaY
    if (Math.abs(wheelDeltaAccumulator) <= internalConfig.value.wheelThreshold) return

    snapToIndex(activeIndex.value + (wheelDeltaAccumulator > 0 ? 1 : -1))
    wheelDeltaAccumulator = 0
  }

  function getTouchAngle(event: TouchEvent) {
    const wrap = wheelWrapRef.value
    const touch = event.touches[0]
    if (!wrap || !touch) return 0

    const rect = wrap.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    return Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI)
  }

  function handleTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement | null
    if (target?.closest('.flashlight-btn')) return

    clearWakeup()
    isSnapping.value = false
    isDragging.value = true
    lastTouchAngle = getTouchAngle(event)
    lastMoveTime = performance.now()
    angularVelocity = 0
  }

  function handleTouchMove(event: TouchEvent) {
    if (!isDragging.value) return
    event.preventDefault()

    const currentTouchAngle = getTouchAngle(event)
    let deltaAngle = currentTouchAngle - lastTouchAngle
    if (deltaAngle > 180) deltaAngle -= 360
    if (deltaAngle < -180) deltaAngle += 360

    currentRotate.value += deltaAngle
    const now = performance.now()
    const deltaTime = now - lastMoveTime
    if (deltaTime > 0) angularVelocity = deltaAngle / deltaTime

    lastTouchAngle = currentTouchAngle
    lastMoveTime = now
    evaluateTick()
  }

  function handleTouchEnd() {
    if (!isDragging.value) return

    isDragging.value = false
    const inertiaAngle = angularVelocity * 130
    const predictedRotate = currentRotate.value + inertiaAngle
    const closestIndex = Math.round(-predictedRotate / perAngle.value)
    snapToIndex(closestIndex)
  }

  function handleMenuClick(index: number) {
    const item = visibleItems.value[index]
    if (!localLightOn.value || isDragging.value || item?.disabled) return
    snapToIndex(index)
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    openConfigMenu(event.clientX, event.clientY)
  }

  function updateConfig(nextConfig: CyberWheelConfig) {
    applyConfig({
      ...internalConfig.value,
      ...nextConfig,
      aliasMap: { ...internalConfig.value.aliasMap, ...(nextConfig.aliasMap || {}) },
      pathMap: { ...internalConfig.value.pathMap, ...(nextConfig.pathMap || {}) },
    })
  }

  function refreshAfterConfig() {
    const preferredKey = activeKey.value || activeItem.value?.key || internalConfig.value.defaultKey
    const nextIndex = visibleItems.value.findIndex((item) => item.key === preferredKey)
    const fallbackIndex = visibleItems.value.findIndex((item) => item.key === internalConfig.value.defaultKey)
    snapToIndex(nextIndex !== -1 ? nextIndex : Math.max(fallbackIndex, 0), {
      immediate: true,
      emitSelect: false,
    })
  }

  function jumpToDefault() {
    snapToKey(internalConfig.value.defaultKey)
  }

  function getState(): CyberWheelState {
    return {
      activeIndex: activeIndex.value,
      activeKey: activeItem.value?.key,
      lightOn: localLightOn.value,
      docked: isDocked.value,
      loading: isLoading.value,
      config: clonePlain(internalConfig.value),
    }
  }

  function animate() {
    if (isSnapping.value) {
      const progress = Math.min((performance.now() - snapStartTime) / internalConfig.value.snapDuration, 1)
      currentRotate.value = snapStartRotate + (targetRotate.value - snapStartRotate) * easeOutCubic(progress)

      if (progress >= 1) {
        isSnapping.value = false
        currentRotate.value = currentRotate.value % 360
        settleSelection()
      }
    }

    evaluateTick()
    rafId = requestAnimationFrame(animate)
  }

  function handleDocumentClick() {
    closeConfigMenu()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') closeConfigMenu()
  }

  function handleResize() {
    closeConfigMenu()
  }

  hydrateConfig()

  watch(
    () => [items.value, config.value, storageKey.value, persist.value],
    () => {
      applyConfig({
        ...buildDefaultConfig(),
        ...internalConfig.value,
        ...(config.value || {}),
      }, false)
    },
    { deep: true },
  )

  watch(
    activeKey,
    (nextKey) => {
      const targetKey = nextKey || internalConfig.value.defaultKey
      if (!targetKey) return
      const index = visibleItems.value.findIndex((item) => item.key === targetKey)
      if (index === -1 || activeItem.value?.key === targetKey) return
      snapToIndex(index, { immediate: true, emitSelect: false })
    },
    { immediate: true },
  )

  watch(
    lightOn,
    (nextValue) => {
      if (typeof nextValue === 'boolean' && nextValue !== localLightOn.value) {
        localLightOn.value = nextValue
        if (nextValue) settleSelection()
        else clearWakeup()
      }
    },
  )

  onMounted(() => {
    rafId = requestAnimationFrame(animate)
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', handleResize)
    nextTick(() => settleSelection())
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    clearWakeup()
    clearLoadTimer()
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close()
  })

  return {
    wheelWrapRef,
    outerRingRef,
    internalConfig,
    visibleItems,
    currentRotate,
    activeIndex,
    activePayload,
    pendingPayload,
    loadedPayload,
    wheelBackground,
    perAngle,
    localLightOn,
    isDocked,
    isDragging,
    isConfigOpen,
    configMenuPosition,
    isConfirmReady,
    isLoading,
    snapToIndex,
    snapToKey,
    turnOn,
    turnOff,
    toggleLight,
    openConfigMenu,
    closeConfigMenu,
    resetConfig,
    jumpToDefault,
    updateConfig,
    requestLoadCurrent,
    getState,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMenuClick,
    handleContextMenu,
    getColorIndex,
  }
}
