import { createLoadingManager } from './createLoadingManager'
import { createGLTFLoader } from './createGLTFLoader'
import { cloneCachedModel, getModelFromCache, setModelCache } from './modelCache'
import { disposeModel } from '../performance/disposeModel'

function normalizeModelError(error, src) {
  const message = error?.message || 'Unknown loading error'
  return new Error(`Model load failed: ${src}. ${message}`)
}

function createModelResult(model, fromCache = false) {
  const animations = Array.isArray(model.animations) ? model.animations : []
  const animationNames = animations.map((animation) => animation.name).filter(Boolean)

  return {
    scene: model.scene,
    animations,
    animationNames,
    rawGltf: model.rawGltf,
    dispose: () => disposeModel(model.scene, { disposeResources: !fromCache }),
  }
}

export async function loadGLTFModel(src, options = {}) {
  if (!src) {
    throw new Error('Model src is required.')
  }

  const useCache = options.cache !== false
  const cached = useCache ? getModelFromCache(src) : null

  if (cached) {
    const cloned = cloneCachedModel(cached)
    return createModelResult(cloned, true)
  }

  try {
    const manager = createLoadingManager({
      onStart: options.onStart,
      onProgress: options.onProgress,
      onLoad: options.onLoad,
      onError: options.onError,
    })
    const loader = createGLTFLoader({ ...options, manager })
    const rawGltf = await loader.loadAsync(src)

    if (useCache) {
      setModelCache(src, rawGltf)
      const cloned = cloneCachedModel(rawGltf)
      return createModelResult(cloned, true)
    }

    return createModelResult({
      scene: rawGltf.scene,
      animations: rawGltf.animations,
      rawGltf,
    })
  } catch (error) {
    throw normalizeModelError(error, src)
  }
}
