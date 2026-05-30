export function scrollSceneCleanup(handles = {}) {
  const {
    timeline,
    scrollTriggers = [],
    resizeObserver,
    resizeTarget,
    resizeHandler,
    rafId,
    stopRaf,
    renderer,
    scene,
    model,
    disposeModel,
    disposers = [],
  } = handles

  stopRaf?.()

  if (rafId && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(rafId)
  }

  timeline?.scrollTrigger?.kill?.()
  timeline?.kill?.()
  scrollTriggers.forEach((trigger) => trigger?.kill?.())
  resizeObserver?.disconnect?.()

  if (resizeTarget && resizeHandler) {
    resizeTarget.removeEventListener?.('resize', resizeHandler)
  }

  disposers.forEach((dispose) => {
    try {
      dispose?.()
    } catch (error) {
      // Cleanup must stay best-effort during route changes.
    }
  })

  if (model && disposeModel) {
    disposeModel(model)
  }

  scene?.clear?.()
  renderer?.renderLists?.dispose?.()
  renderer?.dispose?.()
}
