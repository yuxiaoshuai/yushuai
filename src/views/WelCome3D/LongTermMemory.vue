<template>
  <div class="film-spiral-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import * as THREE from 'three';

export default {
  name: 'FilmSpiral',
  data() {
    return {
      infinite: false,
      waveLength: 1.1,
      slideCount: 8,
      precision: 25,
      raduis: 0.7,
      filmWidth: 0.3,
      filmColor: '#876',
      rotation: 1.2,
      touchStartY: 0,
      rotationAtStart: 0,
      uniforms: {
        rotation: { value: 0 }
      },
      animationFrameId: null
    };
  },
  mounted() {
    this.initScene();
    this.setupEventListeners();
    this.startAnimation();
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    // 场景初始化
    initScene() {
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        canvas: this.$refs.canvas 
      });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.localClippingEnabled = true;

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight('white', 0.7));
      scene.add(this.createDirectionalLight());

      const camera = new THREE.OrthographicCamera();
      camera.position.set(0, 0, 1.5);
      camera.lookAt(scene.position);

      this.three = { scene, renderer, camera };
      this.film = new THREE.Object3D();
      this.three.scene.add(this.film);

      // 添加幻灯片
      for (let i = 0; i < this.slideCount * 3; i++) {
        console.log(`id`, 10 + i * 2);
        // this.addSlide(i, `https://picsum.photos/id/${10 + i * 2}/200/200`);
        this.addSlide(i, `/longTermMemoryImages/${i + 1}.jpg`);
      }
    },

    createDirectionalLight() {
      const dirLight = new THREE.DirectionalLight('white', 0.7);
      dirLight.castShadow = true;
      dirLight.position.set(-0.1, 0.1, 1);
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.left = -1;
      dirLight.shadow.camera.right = 1;
      dirLight.shadow.camera.top = 2;
      dirLight.shadow.camera.bottom = -2;
      dirLight.shadow.camera.near = 0.1;
      dirLight.shadow.camera.far = 2;
      return dirLight;
    },

    addSlide(i, url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        const geom = this.createGeometry(i);

        let slide = new THREE.Mesh(geom, this.createMaterial(img, i, -1));
        slide.receiveShadow = true;
        this.film.add(slide);
        
        slide = new THREE.Mesh(geom, this.createMaterial(img, i, 1));
        slide.castShadow = true;
        slide.customDepthMaterial = this.createDepthMaterial();
        slide.customDepthMaterial.map = slide.material.map;
        this.film.add(slide);
      };
    },

    createMaterial(img, index, side) {
      const mat = new THREE.MeshStandardMaterial({
        map: this.createTexture(img),
        side: THREE.DoubleSide,
        clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 0, side), 0.0001)],
        alphaTest: 0.5
      });

      mat.onBeforeCompile = shader => {
        shader.uniforms.rotation = this.uniforms.rotation;
        shader.uniforms.slideIndex = { value: index };

        shader.fragmentShader = `
          uniform float rotation;
          uniform float slideIndex;
          ${shader.fragmentShader}
        `.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `
          gl_FragColor = vec4( outgoingLight, diffuseColor.a );
          float value = abs(slideIndex + vUv.x - rotation - 2.0);
          value = clamp(value, 0., 1.);
          if (abs(vUv.y - 0.5) < 0.38 && abs(vUv.x - 0.5) < 0.46) {
            float grayscale = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
            gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(grayscale), value);
          }
        `);
      };

      return mat;
    },

    createDepthMaterial() {
      const mat = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        alphaTest: 0.5
      });

      mat.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('}', `
          if (fragCoordZ > 0.5) { discard; }
        }`);
      };

      return mat;
    },

    createTexture(img) {
      const pad = 10;
      const width = img.width + pad * 2;
      const holesCount = 10;
      const w = width / holesCount / 2;
      const h = w;

      const canvas = document.createElement('canvas');
      canvas.height = img.height + pad * 4 + h * 2;
      canvas.width = width;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = this.filmColor;
      ctx.fillRect(0, 0, 1e5, 1e5);
      ctx.drawImage(img, pad, pad * 2 + h);

      for (let i = 0; i < holesCount; i++) {
        const x = i * 2 * w + w / 2;
        ctx.clearRect(x, pad, w, h);
        ctx.clearRect(x, canvas.height - pad - h, w, h);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      return texture;
    },

    createGeometry(i) {
      const vertices = [];
      const uvs = [];

      for (let n = 0; n < this.precision; n++) {
        this.addVertices(vertices, i, n);
        this.addUvs(uvs, n);
      }

      for (let j = 0; j < vertices.length; j += 3) {
        vertices[j] = Math.cos(vertices[j]) * this.raduis;
        vertices[j + 2] = Math.sin(vertices[j + 2]) * this.raduis;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
      geom.computeVertexNormals();
      return geom;
    },

    addVertices(vertices, i, n) {
      const index = i * this.precision + n;
      const i1 = index / (this.slideCount * this.precision);
      const i2 = (index + 1) / (this.slideCount * this.precision);
      const a1 = i1 * Math.PI * 2;
      const a2 = i2 * Math.PI * 2;
      const dy1 = i1 * this.waveLength - this.filmWidth;
      const dy2 = i2 * this.waveLength - this.filmWidth;

      vertices.push(
        a1, this.filmWidth + dy1, a1,
        a1, -this.filmWidth + dy1, a1,
        a2, -this.filmWidth + dy2, a2,
        a2, this.filmWidth + dy2, a2,
        a2, -this.filmWidth + dy2, a2,
        a1, this.filmWidth + dy1, a1
      );
    },

    addUvs(uvs, n) {
      const x0 = n / this.precision;
      const x1 = (n + 1) / this.precision;
      uvs.push(
        x0, 1,
        x0, 0,
        x1, 0,
        x1, 1,
        x1, 0,
        x0, 1
      );
    },

    moveFilm(t) {
      this.film.rotation.y += (this.rotation - this.film.rotation.y) / 20;
      this.film.rotation.y += Math.sin(t / 2000) / 500;
      this.film.position.y = -this.film.rotation.y / (Math.PI * 2 / this.waveLength);

      if (this.infinite) {
        this.film.position.y = this.film.position.y % this.waveLength - this.waveLength;
      }

      this.uniforms.rotation.value = this.slideCount * this.film.rotation.y / (Math.PI * 2);
    },

    render() {
      const { renderer, scene, camera } = this.three;

      if (renderer.domElement.width !== window.innerWidth || 
          renderer.domElement.height !== window.innerHeight) {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.left = -window.innerWidth / window.innerHeight;
        camera.right = -camera.left;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    },

    setupEventListeners() {
      window.addEventListener('touchstart', this.handleTouchStart);
      window.addEventListener('touchmove', this.handleTouchMove);
      window.addEventListener('wheel', this.handleWheel);
      window.addEventListener('resize', this.handleResize);
    },

    handleTouchStart(e) {
      this.touchStartY = e.touches[0].clientY;
      this.rotationAtStart = this.rotation;
    },

    handleTouchMove(e) {
      this.rotation = this.rotationAtStart + (e.touches[0].clientY - this.touchStartY) / 50;
    },

    handleWheel(e) {
      this.rotation -= e.deltaY / 400;
    },

    handleResize() {
      this.render();
    },

    startAnimation() {
      const animate = (t) => {
        this.moveFilm(t);
        this.render();
        this.animationFrameId = requestAnimationFrame(animate);
      };
      this.animationFrameId = requestAnimationFrame(animate);
    },

    cleanup() {
      cancelAnimationFrame(this.animationFrameId);
      window.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchmove', this.handleTouchMove);
      window.removeEventListener('wheel', this.handleWheel);
      window.removeEventListener('resize', this.handleResize);
      
      // 清理Three.js资源
      if (this.three) {
        this.three.renderer.dispose();
        this.three.scene.traverse(object => {
          if (object.isMesh) {
            object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
    }
  }
};
</script>

<style>
.film-spiral-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
