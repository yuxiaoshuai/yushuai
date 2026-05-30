import * as THREE from 'three'
import { COLOR_TEXTURE_KEYS } from '../constants'

function normalizeMaterial(material, options = {}) {
  if (!material) return

  COLOR_TEXTURE_KEYS.forEach((key) => {
    const texture = material[key]
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  })

  if (options.enableShadow === false) {
    material.needsUpdate = true
  }
}

export function optimizeModel(root, options = {}) {
  if (!root) return root

  const {
    enableShadow = false,
    skinnedMeshFrustumCulled = false,
    meshFrustumCulled = true,
  } = options

  root.traverse((object) => {
    if (!object.isMesh && !object.isSkinnedMesh) return

    object.frustumCulled = object.isSkinnedMesh ? skinnedMeshFrustumCulled : meshFrustumCulled
    object.castShadow = Boolean(enableShadow)
    object.receiveShadow = Boolean(enableShadow)

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => normalizeMaterial(material, { enableShadow }))
    } else {
      normalizeMaterial(object.material, { enableShadow })
    }
  })

  return root
}
