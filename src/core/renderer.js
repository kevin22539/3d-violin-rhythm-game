import * as THREE from 'three';

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);

  container.appendChild(renderer.domElement);

  return renderer;
}