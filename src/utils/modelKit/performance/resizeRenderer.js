import { DEFAULT_PIXEL_RATIO_LIMIT } from '../constants'

export function resizeRenderer(renderer, camera, container) {
  if (!renderer || !camera || !container) return false

  const width = Math.max(container.clientWidth || 1, 1)
  const height = Math.max(container.clientHeight || 1, 1)
  const canvas = renderer.domElement
  const needsResize = canvas.width !== Math.floor(width * renderer.getPixelRatio())
    || canvas.height !== Math.floor(height * renderer.getPixelRatio())

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DEFAULT_PIXEL_RATIO_LIMIT))

  if (needsResize) {
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  return needsResize
}
