import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

let sharedLoader = null

function configureLoader(loader, options = {}) {
  const {
    dracoDecoderPath,
    ktx2TranscoderPath,
    renderer,
    meshoptDecoder = MeshoptDecoder,
  } = options

  if (dracoDecoderPath) {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(dracoDecoderPath)
    loader.setDRACOLoader(dracoLoader)
  }

  if (ktx2TranscoderPath && renderer) {
    const ktx2Loader = new KTX2Loader()
    ktx2Loader.setTranscoderPath(ktx2TranscoderPath)
    ktx2Loader.detectSupport(renderer)
    loader.setKTX2Loader(ktx2Loader)
  }

  if (meshoptDecoder) {
    loader.setMeshoptDecoder(meshoptDecoder)
  }

  return loader
}

export function createGLTFLoader(options = {}) {
  const { manager } = options

  if (!manager && !sharedLoader) {
    sharedLoader = configureLoader(new GLTFLoader(), options)
  }

  if (!manager) return sharedLoader

  return configureLoader(new GLTFLoader(manager), options)
}
