import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadEnvironment(options = {}) {
  const {
    url = './assets/models/the_great_drawing_room.glb',
    targetSize = 24,
    scaleMultiplier = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  } = options;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);

  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });

  const originalBox = new THREE.Box3().setFromObject(model);
  const originalCenter = originalBox.getCenter(new THREE.Vector3());
  const originalSize = originalBox.getSize(new THREE.Vector3());

  const root = new THREE.Group();
  root.add(model);

  // 先把整個環境中心移到 root 原點
  model.position.sub(originalCenter);

  // 按最大邊長自動縮放
  const maxDim = Math.max(originalSize.x, originalSize.y, originalSize.z);
  if (maxDim > 0) {
    const fitScale = (targetSize / maxDim) * scaleMultiplier;
    model.scale.setScalar(fitScale);
  }

  // 縮放後重新計算，讓地板落在 y = 0
  const groundedBox = new THREE.Box3().setFromObject(root);
  const minY = groundedBox.min.y;
  model.position.y -= minY;

  root.position.set(position[0], position[1], position[2]);
  root.rotation.set(rotation[0], rotation[1], rotation[2]);

  return root;
}