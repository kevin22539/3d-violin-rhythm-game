import * as THREE from 'three';

import { loadEnvironment } from './loadEnvironment.js';
import { loadViolin }      from './loadViolin.js';
import { loadBow }         from './loadBow.js';

export async function loadAllAssets(scene, { onProgress } = {}) {
  onProgress?.('Loading environment...');
  const environment = await loadEnvironment({
    url: './assets/models/the_great_drawing_room.glb',
    targetSize: 24,
    scaleMultiplier: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  });
  scene.add(environment);

  onProgress?.('Loading violin model...');
  const violin = await loadViolin({
    url: './assets/models/violin.glb',
    targetSize: 3,
    scaleMultiplier: 1,
    position: [0.8, 0.5, 0],
    rotation: [0, Math.PI / 2, 0],
  });
  scene.add(violin);

  onProgress?.('Loading bow model...');
  const bow = await loadBow({
    url: './assets/models/bow.glb',
    targetSize: 3.2,
    scaleMultiplier: 1,
    position: [6.5, 1.69, 0.35],
    rotation: [0, 0, Math.PI / 2],
  });
  bow.rotateX(Math.PI);
  scene.add(bow);

  return { environment, violin, bow };
}