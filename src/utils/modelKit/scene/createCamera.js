import * as THREE from 'three'
import { DEFAULT_CAMERA_POSITION } from '../constants'

export function createCamera(options = {}) {
  const {
    container,
    fov = 45,
    near = 0.1,
    far = 1000,
    cameraPosition = DEFAULT_CAMERA_POSITION,
  } = options

  const width = Math.max(container?.clientWidth || 1, 1)
  const height = Math.max(container?.clientHeight || 1, 1)
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far)

  camera.position.fromArray(cameraPosition)
  camera.lookAt(0, 0, 0)

  return camera
}
