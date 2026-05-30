import * as THREE from 'three'

export const MODEL_BASE_PATH = '/models/gltf/'

export const DEFAULT_CAMERA_POSITION = [0, 1.2, 3]

export const DEFAULT_PIXEL_RATIO_LIMIT = 1.5

export const COLOR_TEXTURE_KEYS = ['map', 'emissiveMap']

export const DISPOSABLE_TEXTURE_KEYS = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'aoMap',
  'alphaMap',
  'specularMap',
  'lightMap',
  'bumpMap',
  'displacementMap',
]

export const DEFAULT_RENDERER_OPTIONS = {
  antialias: false,
  alpha: true,
  powerPreference: 'high-performance',
  outputColorSpace: THREE.SRGBColorSpace,
}
