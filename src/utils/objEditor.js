import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { showVertices } from './components/editorLine.js'

let patrolAnimationId = null
let patrolPoints = []
let currentPatrolIndex = 0
let isPatrolling = false
const patrolSpeed = 0.01

export function initThreeJs(container, canvasRef) {
  const loader = new OBJLoader()
  const scene = new THREE.Scene()
  const width = container.clientWidth
  const height = container.clientHeight
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  renderer.setSize(width, height)

  const ambientLight = new THREE.AmbientLight(0x404040)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(1, 1, 1)
  scene.add(ambientLight, directionalLight)
  scene.add(new THREE.AxesHelper(5))

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.rotateSpeed = 0.5
  controls.zoomSpeed = 0.5
  controls.panSpeed = 0.5

  function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  return { scene, camera, renderer, loader }
}

export function loadObj(loader, scene, url) {
  loader.load(url, (obj) => {
    obj.traverse((child) => {
      if (child.isLine) {
        child.material = new THREE.MeshBasicMaterial({ color: '#f0952f' })
      }
    })

    scene.add(obj)
  })
}

export function addObject(scene, objects) {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const cube = new THREE.Mesh(geometry, material)
  cube.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5)
  scene.add(cube)
  objects.push(cube)
}

export function deleteObject(scene, objects) {
  const objectToDelete = objects.pop()
  if (objectToDelete) {
    scene.remove(objectToDelete)
  }
}

export function modifyObject(objects) {
  const objectToModify = objects[objects.length - 1]
  if (objectToModify) {
    objectToModify.rotation.x += 0.1
    objectToModify.rotation.y += 0.1
  }
}

export function changeColor(scene, idealColor = '', targetName) {
  scene.traverse((child) => {
    if (child.isLine && child.name === targetName) {
      child.material = new THREE.MeshBasicMaterial({ color: idealColor })
    }
  })
}

export function editorObject(scene) {
  showVertices(scene)
}

export function startPatrol(scene, camera) {
  if (isPatrolling) return

  patrolPoints = extractPathPoints(scene)
  if (patrolPoints.length === 0) {
    console.warn('No path found for patrolling!')
    return
  }

  isPatrolling = true
  currentPatrolIndex = 0

  camera.position.copy(patrolPoints[0])
  if (patrolPoints.length > 1) {
    camera.lookAt(patrolPoints[1])
  }

  function patrol() {
    if (!isPatrolling) return

    const nextIndex = (currentPatrolIndex + 1) % patrolPoints.length
    const currentPoint = patrolPoints[currentPatrolIndex]
    const nextPoint = patrolPoints[nextIndex]
    const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize()

    camera.position.add(direction.multiplyScalar(patrolSpeed))
    camera.lookAt(nextPoint)

    if (camera.position.distanceTo(nextPoint) < patrolSpeed * 2) {
      currentPatrolIndex = nextIndex
    }

    patrolAnimationId = requestAnimationFrame(patrol)
  }

  patrol()
}

export function stopPatrol() {
  isPatrolling = false
  if (patrolAnimationId) {
    cancelAnimationFrame(patrolAnimationId)
    patrolAnimationId = null
  }
}

function extractPathPoints(scene) {
  const points = []
  scene.traverse((child) => {
    if (child.isLine && child.name === '路线') {
      const positionAttribute = child.geometry.attributes.position

      for (let i = 0; i < positionAttribute.count; i += 1) {
        points.push(new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i),
        ))
      }
    }
  })
  return points
}
