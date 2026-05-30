import * as THREE from 'three'

const box = new THREE.Box3()
const size = new THREE.Vector3()
const center = new THREE.Vector3()
const target = new THREE.Vector3()

export function fitModelToView(model, camera, options = {}) {
  if (!model || !camera) return null

  const {
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    cameraPosition,
    fitOffset = 1.35,
  } = options

  model.scale.setScalar(scale)
  model.rotation.set(...rotation)
  model.updateMatrixWorld(true)

  box.setFromObject(model)

  if (box.isEmpty()) {
    model.position.set(...position)
    return null
  }

  box.getCenter(center)
  box.getSize(size)
  model.position.sub(center)
  model.position.add(target.fromArray(position))
  model.updateMatrixWorld(true)

  const maxSize = Math.max(size.x, size.y, size.z, 0.01)
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360))
  const fitWidthDistance = fitHeightDistance / camera.aspect
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)
  const lookTarget = target.fromArray(position)

  if (Array.isArray(cameraPosition)) {
    camera.position.fromArray(cameraPosition)
  } else {
    camera.position.set(lookTarget.x, lookTarget.y + maxSize * 0.18, lookTarget.z + distance)
  }

  camera.near = Math.max(distance / 100, 0.01)
  camera.far = Math.max(distance * 100, 1000)
  camera.lookAt(lookTarget)
  camera.updateProjectionMatrix()

  return {
    box: box.clone(),
    size: size.clone(),
    center: center.clone(),
    distance,
  }
}
