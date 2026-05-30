export function createVisibilityController(container, options = {}) {
  const {
    onVisible,
    onHidden,
    onChange,
    root = null,
    rootMargin = '120px',
    threshold = 0.01,
  } = options

  let pageVisible = typeof document === 'undefined' ? true : !document.hidden
  let elementVisible = true
  let disposed = false

  function emit() {
    if (disposed) return

    const visible = pageVisible && elementVisible
    onChange?.(visible)

    if (visible) {
      onVisible?.()
    } else {
      onHidden?.()
    }
  }

  function handleVisibilityChange() {
    pageVisible = !document.hidden
    emit()
  }

  let observer = null

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  if (typeof IntersectionObserver !== 'undefined' && container) {
    elementVisible = false
    observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      elementVisible = Boolean(entry?.isIntersecting)
      emit()
    }, { root, rootMargin, threshold })
    observer.observe(container)
  } else {
    queueMicrotask(emit)
  }

  return {
    isVisible: () => pageVisible && elementVisible,
    dispose: () => {
      disposed = true
      observer?.disconnect()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    },
  }
}
