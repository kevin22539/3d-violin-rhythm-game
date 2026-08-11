import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createScene }    from './scene.js';
import { createCamera }   from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights }   from './lights.js';

export function setupScene(container) {
  const scene = createScene();
  scene.background = new THREE.Color(0x1f1712);
  scene.fog = new THREE.Fog(0x1f1712, 18, 42);

  const camera   = createCamera(container);
  const renderer = createRenderer(container);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const { ambientLight, directionalLight } = createLights();
  ambientLight.intensity       = 0.8;
  directionalLight.intensity   = 1.2;
  directionalLight.position.set(6, 10, 8);
  scene.add(ambientLight);
  scene.add(directionalLight);

  const warmPointLight = new THREE.PointLight(0xffd6a3, 1.8, 30);
  warmPointLight.position.set(2, 5, 3);
  scene.add(warmPointLight);

  const warmPointLight2 = new THREE.PointLight(0xffd6a3, 1.2, 24);
  warmPointLight2.position.set(-4, 4, -3);
  scene.add(warmPointLight2);

  const axesHelper = new THREE.AxesHelper(3);
  axesHelper.visible = false;
  scene.add(axesHelper);

  const gridHelper = new THREE.GridHelper(10, 10);
  gridHelper.visible = false;
  scene.add(gridHelper);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  // Placeholder target — overwritten by main.js (cameraController.snapTo('overall'))
  // after the violin model loads and its world-space centre is known.
  controls.target.set(1.2, 1.4, 0);
  controls.update();

  camera.position.set(1.8, 2.8, 10.5);
  camera.lookAt(1.2, 1.4, 0);

  return { scene, camera, renderer, controls };
}