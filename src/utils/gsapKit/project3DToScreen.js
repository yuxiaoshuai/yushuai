import * as THREE from 'three'

const worldPosition = new THREE.Vector3()
const projectedPosition = new THREE.Vector3()

export function project3DToScreen(target, camera, rendererOrCanvas, options = {}) {
  const {
    referenceElement,
    margin = 40,
  } = options

  const canvas = rendererOrCanvas?.domElement || rendererOrCanvas

  if (!target || !camera || !canvas?.getBoundingClientRect) {
    return { x: 0, y: 0, visible: false }
  }

  if (target.isObject3D) {
    target.getWorldPosition(worldPosition)
  } else if (target.isVector3) {
    worldPosition.copy(target)
  } else {
    worldPosition.set(target.x || 0, target.y || 0, target.z || 0)
  }

  projectedPosition.copy(worldPosition).project(camera)

  const canvasRect = canvas.getBoundingClientRect()
  const referenceRect = referenceElement?.getBoundingClientRect?.() || canvasRect
  const x = canvasRect.left - referenceRect.left + (projectedPosition.x * 0.5 + 0.5) * canvasRect.width
  const y = canvasRect.top - referenceRect.top + (-projectedPosition.y * 0.5 + 0.5) * canvasRect.height
  const visible =
    projectedPosition.z >= -1
    && projectedPosition.z <= 1
    && x >= -margin
    && x <= referenceRect.width + margin
    && y >= -margin
    && y <= referenceRect.height + margin

  return { x, y, visible }
}
