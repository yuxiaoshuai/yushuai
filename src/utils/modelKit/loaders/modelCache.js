import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { disposeModel } from '../performance/disposeModel'

const modelCache = new Map()

export function getModelFromCache(src) {
  return modelCache.get(src)
}

export function setModelCache(src, gltf) {
  if (!src || !gltf) return
  modelCache.set(src, gltf)
}

export function removeModelCache(src) {
  const cached = modelCache.get(src)
  if (cached?.scene) {
    disposeModel(cached.scene)
  }
  modelCache.delete(src)
}

export function clearModelCache() {
  modelCache.forEach((cached) => {
    if (cached?.scene) {
      disposeModel(cached.scene)
    }
  })
  modelCache.clear()
}

export function cloneCachedModel(gltf) {
  if (!gltf?.scene) return null

  return {
    scene: cloneSkeleton(gltf.scene),
    animations: Array.isArray(gltf.animations) ? gltf.animations.slice() : [],
    rawGltf: gltf,
  }
}
