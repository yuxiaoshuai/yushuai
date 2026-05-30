import * as THREE from 'three'

export function createScene(options = {}) {
  const scene = new THREE.Scene()

  if (options.background !== undefined && options.background !== null) {
    scene.background = options.background instanceof THREE.Color
      ? options.background
      : new THREE.Color(options.background)
  }

  return scene
}
