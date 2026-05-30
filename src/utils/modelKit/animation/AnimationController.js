import * as THREE from 'three'

export class AnimationController {
  constructor(root, animations = []) {
    this.root = root
    this.animations = Array.isArray(animations) ? animations : []
    this.mixer = root ? new THREE.AnimationMixer(root) : null
    this.actions = new Map()
    this.currentAction = null
    this.currentName = ''
    this.loop = true
    this.paused = false
    this.timeScale = 1

    this.animations.forEach((clip) => {
      if (clip?.name && this.mixer) {
        this.actions.set(clip.name, this.mixer.clipAction(clip))
      }
    })
  }

  get isPlaying() {
    return Boolean(this.currentAction && !this.paused)
  }

  getAnimationNames() {
    return this.animations.map((animation) => animation.name).filter(Boolean)
  }

  hasAnimation(name) {
    return this.actions.has(name)
  }

  play(name, options = {}) {
    if (!name) return this.playFirstAvailableAnimation()

    const action = this.actions.get(name)
    if (!action) {
      console.warn(`[modelKit] Animation not found: ${name}`)
      return this.playFirstAvailableAnimation()
    }

    const {
      fade = 0.25,
      reset = true,
      loop = this.loop,
      clampWhenFinished = !loop,
    } = options

    action.enabled = true
    action.clampWhenFinished = clampWhenFinished
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce)
    action.setEffectiveTimeScale(this.timeScale)
    action.setEffectiveWeight(1)

    if (reset) action.reset()

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.fadeOut(fade)
      action.fadeIn(fade)
    } else {
      action.fadeIn(fade)
    }

    action.play()
    this.currentAction = action
    this.currentName = name
    this.paused = false
    this.mixer.timeScale = this.timeScale

    return name
  }

  playFirstAvailableAnimation(preferredName = '') {
    if (preferredName && this.hasAnimation(preferredName)) {
      return this.play(preferredName)
    }

    const firstName = this.getAnimationNames()[0]
    if (!firstName) return null

    return this.play(firstName)
  }

  crossFadeTo(name, duration = 0.35) {
    if (!this.hasAnimation(name)) {
      console.warn(`[modelKit] Animation not found: ${name}`)
      return this.playFirstAvailableAnimation()
    }

    const nextAction = this.actions.get(name)

    if (!this.currentAction || this.currentAction === nextAction) {
      return this.play(name, { fade: duration })
    }

    nextAction.enabled = true
    nextAction.reset()
    nextAction.setLoop(this.loop ? THREE.LoopRepeat : THREE.LoopOnce)
    nextAction.setEffectiveTimeScale(this.timeScale)
    nextAction.setEffectiveWeight(1)
    nextAction.play()
    this.currentAction.crossFadeTo(nextAction, duration, false)

    this.currentAction = nextAction
    this.currentName = name
    this.paused = false
    this.mixer.timeScale = this.timeScale

    return name
  }

  pause() {
    this.paused = true
    if (this.mixer) this.mixer.timeScale = 0
  }

  resume() {
    this.paused = false
    if (this.mixer) this.mixer.timeScale = this.timeScale
  }

  stop(name) {
    const action = name ? this.actions.get(name) : this.currentAction
    if (!action) return

    action.stop()

    if (action === this.currentAction) {
      this.currentAction = null
      this.currentName = ''
    }
  }

  stopAll() {
    this.actions.forEach((action) => action.stop())
    this.currentAction = null
    this.currentName = ''
  }

  setLoop(loop) {
    this.loop = Boolean(loop)
    this.actions.forEach((action) => {
      action.setLoop(this.loop ? THREE.LoopRepeat : THREE.LoopOnce)
    })
  }

  setTimeScale(value) {
    const nextValue = Number.isFinite(Number(value)) ? Number(value) : 1
    this.timeScale = nextValue
    if (!this.paused && this.mixer) {
      this.mixer.timeScale = nextValue
    }
    this.actions.forEach((action) => action.setEffectiveTimeScale(nextValue))
  }

  update(delta) {
    if (!this.mixer || this.paused || !this.currentAction) return
    this.mixer.update(delta)
  }

  dispose() {
    this.stopAll()
    if (this.mixer && this.root) {
      this.mixer.uncacheRoot(this.root)
    }
    this.actions.clear()
    this.mixer = null
    this.root = null
  }
}
