import * as THREE from 'three'

export function createLights(options = {}) {
  const {
    lightIntensity = 1,
    enableShadow = false,
  } = options

  const group = new THREE.Group()
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x202030, 0.8 * lightIntensity)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.15 * lightIntensity)

  directionalLight.position.set(3, 5, 4)
  directionalLight.castShadow = Boolean(enableShadow)

  group.add(hemisphereLight)
  group.add(directionalLight)

  return group
}
