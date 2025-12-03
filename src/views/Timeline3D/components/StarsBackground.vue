<!-- src/views/Timeline3D/components/StarsBackground.vue -->
<template>
  <div id="stars-container" ref="containerRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";

const containerRef = ref(null);
let scene, camera, renderer, stars, rafId;

function initStars() {
  const container = containerRef.value;
  if (!container) return;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 1;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.8,
  });

  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    stars.rotation.x += 0.0001;
    stars.rotation.y += 0.0001;
    renderer.render(scene, camera);
  };
  animate();
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

onMounted(() => {
  initStars();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (rafId) cancelAnimationFrame(rafId);
  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
  }
  scene = camera = renderer = stars = null;
});
</script>
