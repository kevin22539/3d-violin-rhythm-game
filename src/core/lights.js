import * as THREE from 'three';

export function createLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  directionalLight.position.set(5, 10, 7);

  return {
    ambientLight,
    directionalLight
  };
}