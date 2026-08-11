import * as THREE from 'three';

export function createCamera(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const camera = new THREE.PerspectiveCamera(
    60,
    width / height,
    0.1,
    1000
  );

  camera.position.set(0, 2, 8);

  return camera;
}