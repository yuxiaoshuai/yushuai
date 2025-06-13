import * as THREE from 'three';

// 显示顶点
export function showVertices(scene) {
  // 提取所有顶点
  const vertices = [];
  scene.traverse((child) => {
    if (child.isLine && child.name === '路线') {
      const geometry = child.geometry;
      const positionAttribute = geometry.attributes.position;

      for (let i = 0; i < positionAttribute.count; i++) {
        vertices.push(
          positionAttribute.getX(i),
          positionAttribute.getY(i),
          positionAttribute.getZ(i)
        );
      }
    }
  });

  // 如果没有找到顶点，跳过显示
  if (vertices.length === 0) {
    console.warn('No vertices found in the scene!');
    return;
  }

  // 创建点集
  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x000000, // 黑色点
    size: 4,       // 点大小
    sizeAttenuation: false
  });

  const points = new THREE.Points(pointsGeometry, pointsMaterial);

  // 将点添加到场景
  scene.add(points);
}

// 显示边
export function showEdges(scene) {
  scene.traverse((child) => {
    if (child.isMesh) {
      const wireframe = new THREE.WireframeGeometry(child.geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000, // 红色边线
        linewidth: 1
      });
      const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
      child.add(wireframeMesh);
    }
  });
}
