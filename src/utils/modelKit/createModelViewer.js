import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AnimationController } from './animation/AnimationController'
import { modelRegistry } from './modelRegistry'
import { loadGLTFModel } from './loaders/loadGLTFModel'
import { createCamera } from './scene/createCamera'
import { createLights } from './scene/createLights'
import { createRenderer } from './scene/createRenderer'
import { createScene } from './scene/createScene'
import { fitModelToView } from './scene/fitModelToView'
import { optimizeModel } from './performance/optimizeModel'
import { resizeRenderer } from './performance/resizeRenderer'
import { createVisibilityController } from './performance/visibilityController'

function mergeViewerOptions(options) {
  const registryConfig = options.modelId ? modelRegistry[options.modelId] || {} : {}

  return {
    ...registryConfig,
    ...options,
    src: options.src || registryConfig.src || '',
    defaultAnimation: options.defaultAnimation || registryConfig.defaultAnimation || registryConfig.fallbackAnimation || '',
    autoPlay: options.autoPlay ?? registryConfig.autoPlay ?? true,
    loop: options.loop ?? registryConfig.loop ?? true,
    lazy: options.lazy ?? true,
    cameraPosition: options.camera?.cameraPosition
      || options.cameraPosition
      || registryConfig.cameraPosition,
    transform: {
      scale: options.transform?.scale ?? options.modelScale ?? registryConfig.scale ?? 1,
      position: options.transform?.position || options.modelPosition || registryConfig.position || [0, 0, 0],
      rotation: options.transform?.rotation || options.modelRotation || registryConfig.rotation || [0, 0, 0],
    },
  }
}

export function createModelViewer(options = {}) {
  const config = mergeViewerOptions(options)
  const container = config.container
  const viewer = {
    scene: null,
    camera: null,
    renderer: null,
    model: null,
    animations: [],
    animationNames: [],
    animationController: null,
    playAnimation,
    pauseAnimation,
    resumeAnimation,
    stopAnimation,
    dispose,
    ready: null,
  }

  if (!container) {
    const error = new Error('ModelViewer container is required.')
    config.onError?.(error)
    viewer.ready = Promise.reject(error)
    return viewer
  }

  if (!config.src) {
    const error = new Error('Model src is required.')
    config.onError?.(error)
    viewer.ready = Promise.reject(error)
    return viewer
  }

  let rendererApi = null
  let loadedModel = null
  let visibility = null
  let resizeObserver = null
  let resizeHandler = null
  let controls = null
  let rafId = 0
  let disposed = false
  let loadingStarted = false
  const clock = new THREE.Clock()

  try {
    viewer.scene = createScene(config)
    viewer.camera = createCamera({
      ...(config.camera || {}),
      container,
      cameraPosition: config.cameraPosition,
    })
    rendererApi = createRenderer({
      ...(config.performance || {}),
      container,
    })
    viewer.renderer = rendererApi.renderer
    container.appendChild(viewer.renderer.domElement)
    viewer.scene.add(createLights(config.lights || {}))
    controls = new OrbitControls(viewer.camera, viewer.renderer.domElement)
    controls.enableDamping = false
    controls.enablePan = false
    controls.enableZoom = true
    controls.rotateSpeed = 0.65
    controls.zoomSpeed = 0.65
    controls.addEventListener('change', renderOnce)
  } catch (error) {
    const webglError = new Error(`WebGL init failed. ${error?.message || error}`)
    config.onError?.(webglError)
    viewer.ready = Promise.reject(webglError)
    return viewer
  }

  function renderOnce() {
    if (!disposed && viewer.renderer && viewer.scene && viewer.camera) {
      viewer.renderer.render(viewer.scene, viewer.camera)
    }
  }

  function stopRendering() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
  }

  function renderLoop() {
    if (disposed || !visibility?.isVisible()) {
      stopRendering()
      return
    }

    const shouldUpdateMixer = viewer.animationController?.isPlaying
    const delta = clock.getDelta()

    if (shouldUpdateMixer) {
      viewer.animationController.update(delta)
    }
    controls?.update()

    renderOnce()
    rafId = shouldUpdateMixer ? requestAnimationFrame(renderLoop) : 0
  }

  function startRendering() {
    if (disposed || rafId || !visibility?.isVisible()) return
    clock.getDelta()
    rafId = requestAnimationFrame(renderLoop)
  }

  function handleResize() {
    if (resizeRenderer(viewer.renderer, viewer.camera, container)) {
      renderOnce()
    }
  }

  function bindResize() {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)
      return
    }

    resizeHandler = handleResize
    window.addEventListener('resize', resizeHandler)
  }

  function unbindResize() {
    resizeObserver?.disconnect()
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
  }

  async function loadModel() {
    if (loadingStarted || disposed) return viewer
    loadingStarted = true

    try {
      loadedModel = await loadGLTFModel(config.src, {
        ...(config.performance || {}),
        cache: config.performance?.cache ?? false,
        onStart: config.onStart,
        onProgress: config.onProgress,
        onLoad: config.onLoad,
        onError: config.onResourceError,
      })

      if (disposed) {
        loadedModel.dispose?.()
        return viewer
      }

      viewer.model = loadedModel.scene
      viewer.animations = loadedModel.animations
      viewer.animationNames = loadedModel.animationNames

      optimizeModel(viewer.model, {
        enableShadow: Boolean(config.lights?.enableShadow),
        ...(config.performance || {}),
      })
      fitModelToView(viewer.model, viewer.camera, {
        ...config.transform,
        cameraPosition: config.cameraPosition,
      })
      controls?.target.fromArray(config.transform.position)
      controls?.update()
      viewer.scene.add(viewer.model)

      viewer.animationController = new AnimationController(viewer.model, viewer.animations)
      viewer.animationController.setLoop(config.loop)

      let currentAnimation = ''
      if (config.autoPlay) {
        currentAnimation = viewer.animationController.playFirstAvailableAnimation(config.defaultAnimation) || ''
      }

      config.onLoaded?.({
        model: viewer.model,
        animations: viewer.animations,
        animationNames: viewer.animationNames,
        currentAnimation,
      })

      renderOnce()
      if (currentAnimation) startRendering()
    } catch (error) {
      const modelError = error instanceof Error ? error : new Error(String(error))
      config.onError?.(modelError)
    }

    return viewer
  }

  function playAnimation(name) {
    if (!viewer.animationController) return null

    const currentAnimation = viewer.animationController.crossFadeTo(name)
    if (currentAnimation) {
      config.onAnimationChange?.(currentAnimation)
      startRendering()
    }

    return currentAnimation
  }

  function pauseAnimation() {
    viewer.animationController?.pause()
    stopRendering()
    renderOnce()
  }

  function resumeAnimation() {
    viewer.animationController?.resume()
    startRendering()
  }

  function stopAnimation(name) {
    viewer.animationController?.stop(name)
    stopRendering()
    renderOnce()
  }

  function dispose() {
    disposed = true
    stopRendering()
    unbindResize()
    visibility?.dispose()
    viewer.animationController?.dispose()
    controls?.removeEventListener('change', renderOnce)
    controls?.dispose()
    loadedModel?.dispose?.()
    rendererApi?.dispose()
    viewer.scene?.clear()
    viewer.model = null
    viewer.animations = []
    viewer.animationNames = []
    viewer.animationController = null
  }

  bindResize()
  visibility = createVisibilityController(container, {
    onVisible: () => {
      if (!loadingStarted) {
        viewer.ready = loadModel()
        return
      }

      if (viewer.animationController?.isPlaying) {
        startRendering()
      } else {
        renderOnce()
      }
    },
    onHidden: stopRendering,
  })

  if (!config.lazy) {
    viewer.ready = loadModel()
  } else {
    viewer.ready = Promise.resolve(viewer)
  }

  return viewer
}
