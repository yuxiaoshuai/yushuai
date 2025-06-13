import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import { showVertices, showEdges } from './components/editorLine.js';

// 基础
let raycaster, mouse;
let selectedVertex = null;
let vertexObjects = []; // 存储所有顶点对象（用于高亮）
let transformControls; // 坐标轴控件
let lineObjects = []; // 存储所有线段对象

// 巡检
let patrolAnimationId = null;
let patrolPoints = [];
let currentPatrolIndex = 0;
let patrolSpeed = 0.01;
let isPatrolling = false;

// 初始化场景
export function initThreeJs(container, canvasRef) {
  // 创建OBJ加载器
  const loader = new OBJLoader();

  // 创建场景
  const scene = new THREE.Scene();

  // 创建相机
  const width = container.clientWidth;
  const height = container.clientHeight;
  const camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
  camera.position.z = 5;

  // 创建渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef,
    antialias: true,
    alpha: true, // 启用透明度
    preserveDrawingBuffer: true // 保持绘制缓冲区
  });
  renderer.setSize(width, height);

  // 添加环境光源
  const ambientLight = new THREE.AmbientLight(0x404040);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(ambientLight, directionalLight);

  // 添加坐标轴辅助线
  const axesHelper = new THREE.AxesHelper(5); // 参数 5 是坐标轴的长度
  scene.add(axesHelper);

  // 添加轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.5;
  controls.panSpeed = 0.5;

  // 初始化射线检测
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // 动画渲染循环
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return { scene, camera, renderer, loader };
}

// 加载OBJ
export function loadObj(loader, scene, url) {
  loader.load(url, (obj) => {
    obj.traverse((child) => {
      if (child.isLine) {
        child.material = new THREE.MeshBasicMaterial({ color: '#f0952f' });
      }
    });
    
    scene.add(obj);
  });
}

// 添加对象
export function addObject(scene, objects) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
  scene.add(cube);
  objects.push(cube);
}

// 删除对象
export function deleteObject(scene, objects) {
  const objectToDelete = objects.pop();  // 删除最后一个对象
  if (objectToDelete) {
    scene.remove(objectToDelete);
  }
}

// 修改对象
export function modifyObject(objects) {
  const objectToModify = objects[objects.length - 1];
  if (objectToModify) {
    objectToModify.rotation.x += 0.1;
    objectToModify.rotation.y += 0.1;
  }
}

// 修改颜色
export function changeColor(scene, idealColor='', targetName) {
  scene.traverse((child) => {
    if (child.isLine && child.name === targetName) {
      child.material = new THREE.MeshBasicMaterial({ color: `${idealColor}` });
    }
  });
}

// 编辑线条
export function editorObject(scene) {
  showVertices(scene);
  // showEdges(scene);
}

// 开始巡检
export function startPatrol(scene, camera) {
  if (isPatrolling) return;
  
  patrolPoints = extractPathPoints(scene);
  if (patrolPoints.length === 0) {
    console.warn('No path found for patrolling!');
    return;
  }
  
  isPatrolling = true;
  currentPatrolIndex = 0;
  
  function patrol() {
    if (!isPatrolling) return;
    
    const nextIndex = (currentPatrolIndex + 1) % patrolPoints.length;
    const currentPoint = patrolPoints[currentPatrolIndex];
    const nextPoint = patrolPoints[nextIndex];
    
    // 计算方向向量
    const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint).normalize();
    
    // 移动相机
    camera.position.add(direction.multiplyScalar(patrolSpeed));
    
    // 看向下一个点
    camera.lookAt(nextPoint);
    
    // 检查是否到达下一个点
    if (camera.position.distanceTo(nextPoint) < patrolSpeed * 2) {
      currentPatrolIndex = nextIndex;
    }
    
    patrolAnimationId = requestAnimationFrame(patrol);
  }
  
  // 初始化相机位置
  camera.position.copy(patrolPoints[0]);
  if (patrolPoints.length > 1) {
    camera.lookAt(patrolPoints[1]);
  }
  
  patrol();
}
// 提取路径点
function extractPathPoints(scene) {
  const points = [];
  scene.traverse((child) => {
    if (child.isLine && child.name === '路线') {
      const geometry = child.geometry;
      const positionAttribute = geometry.attributes.position;
      
      for (let i = 0; i < positionAttribute.count; i++) {
        points.push(new THREE.Vector3(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        ));
      }
    }
  });
  return points;
}

// 停止巡检
export function stopPatrol() {
  isPatrolling = false;
  if (patrolAnimationId) {
    cancelAnimationFrame(patrolAnimationId);
    patrolAnimationId = null;
  }
}