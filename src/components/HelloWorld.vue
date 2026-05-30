<template>
  <div id="objEditor">
    <canvas ref="canvas" width="800" height="500"></canvas>
    <div class="func">
      <button @click="loadObj">加载 .obj 文件</button>
      <button @click="addObject">新增对象</button>
      <button @click="deleteObject">删除对象</button>
      <button @click="modifyObject">修改对象</button>
      <input type="color" value="#f6b73c" id="COLORES" @input="changeColor" />
      <button @click="editorObject">编辑对象</button>
      <button @click="startPatrol">开始巡检</button>
      <button @click="stopPatrol">停止巡检</button>
    </div>
  </div>
</template>

<script>
import {
  initThreeJs,
  loadObj,
  addObject,
  deleteObject,
  modifyObject,
  changeColor,
  editorObject,
  startPatrol,
  stopPatrol
} from '@/utils/objEditor.js';

export default {
  data() {
    return {
      scene: null,
      camera: null,
      renderer: null,
      loader: null,
      objects: [],
    };
  },
  mounted() {
    this.initScene();
  },
  methods: {
    initScene() {
      const container = document.getElementById('objEditor');
      const { scene, camera, renderer, loader } = initThreeJs(container, this.$refs.canvas);
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.loader = loader;
    },

    loadObj() {
      const url = '/threeAssets/demoObj.obj';  // 替换成实际的.obj文件路径
      loadObj(this.loader, this.scene, url);
    },

    addObject() {
      addObject(this.scene, this.objects);
    },

    deleteObject() {
      deleteObject(this.scene, this.objects);
    },

    modifyObject() {
      modifyObject(this.objects);
    },

    changeColor() {
      let c_ = document.getElementById("COLORES").value;
      changeColor(this.scene, c_, '路线');
    },

    editorObject() {
      editorObject(this.scene);
    },

    startPatrol() {
      startPatrol(this.scene, this.camera);
    },

    stopPatrol() {
      stopPatrol();
    },
  },
};
</script>

<style scoped>
#objEditor {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

button {
  margin: 10px;
}
</style>
