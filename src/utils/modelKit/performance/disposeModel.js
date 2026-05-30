import { DISPOSABLE_TEXTURE_KEYS } from '../constants'

function disposeMaterial(material) {
  if (!material) return

  DISPOSABLE_TEXTURE_KEYS.forEach((key) => {
    const texture = material[key]
    if (texture?.dispose) {
      texture.dispose()
    }
  })

  material.dispose?.()
}

export function disposeModel(target, options = {}) {
  const { disposeResources = true } = options

  if (!target) return

  if (!disposeResources) {
    target.parent?.remove(target)
    return
  }

  target.traverse?.((object) => {
    if (object.geometry?.dispose) {
      object.geometry.dispose()
    }

    if (Array.isArray(object.material)) {
      object.material.forEach(disposeMaterial)
    } else {
      disposeMaterial(object.material)
    }
  })

  target.parent?.remove(target)
}
