import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadBow(options = {}) {
  const {
    url = './assets/models/bow.glb',
    targetSize = 4,
    scaleMultiplier = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  } = options;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);

  const model = gltf.scene;

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const originalBox = new THREE.Box3().setFromObject(model);
  const originalCenter = originalBox.getCenter(new THREE.Vector3());
  const originalSize = originalBox.getSize(new THREE.Vector3());

  const root = new THREE.Group();
  root.add(model);

  // 先把 bow 置中
  model.position.sub(originalCenter);

  // 自動縮放
  const maxDim = Math.max(originalSize.x, originalSize.y, originalSize.z);
  if (maxDim > 0) {
    const fitScale = (targetSize / maxDim) * scaleMultiplier;
    model.scale.setScalar(fitScale);
  }

  root.position.set(position[0], position[1], position[2]);
  root.rotation.set(rotation[0], rotation[1], rotation[2]);

  return root;
}