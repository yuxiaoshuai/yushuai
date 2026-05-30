import * as THREE from 'three'
import { DEFAULT_PIXEL_RATIO_LIMIT, DEFAULT_RENDERER_OPTIONS } from '../constants'

export function createRenderer(options = {}) {
  const {
    container,
    antialias = DEFAULT_RENDERER_OPTIONS.antialias,
    alpha = DEFAULT_RENDERER_OPTIONS.alpha,
    powerPreference = DEFAULT_RENDERER_OPTIONS.powerPreference,
    canvas,
  } = options

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha,
    powerPreference,
  })

  renderer.outputColorSpace = DEFAULT_RENDERER_OPTIONS.outputColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DEFAULT_PIXEL_RATIO_LIMIT))
  renderer.setSize(
    Math.max(container?.clientWidth || 1, 1),
    Math.max(container?.clientHeight || 1, 1),
    false,
  )
  renderer.shadowMap.enabled = false

  return {
    renderer,
    resize: () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DEFAULT_PIXEL_RATIO_LIMIT))
      renderer.setSize(
        Math.max(container?.clientWidth || 1, 1),
        Math.max(container?.clientHeight || 1, 1),
        false,
      )
    },
    dispose: () => {
      renderer.dispose()
      renderer.forceContextLoss?.()
      renderer.domElement?.remove()
    },
  }
}
