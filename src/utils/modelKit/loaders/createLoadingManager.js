import * as THREE from 'three'

export function createLoadingManager(callbacks = {}) {
  const manager = new THREE.LoadingManager()
  const { onStart, onProgress, onLoad, onError } = callbacks

  manager.onStart = (url, itemsLoaded, itemsTotal) => {
    onStart?.({ url, itemsLoaded, itemsTotal, percent: 0 })
  }

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const percent = itemsTotal > 0 ? Math.round((itemsLoaded / itemsTotal) * 100) : 0
    onProgress?.({ url, itemsLoaded, itemsTotal, percent })
  }

  manager.onLoad = () => {
    onLoad?.({ percent: 100 })
  }

  manager.onError = (url) => {
    onError?.(new Error(`Failed to load model resource: ${url}`))
  }

  return manager
}
