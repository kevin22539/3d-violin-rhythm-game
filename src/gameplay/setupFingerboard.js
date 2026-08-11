import * as THREE from 'three';
import { createFingerboardDots } from './fingerboardDots.js';

/**
 * 建立 bridge/nut 錨點 helper 並初始化指板圓點。
 *
 * @param {{ scene, STRING_DEBUG_X, STRING_CENTER_Z }} params
 * @returns {{ fingerboard }}
 */
export function setupFingerboard({ scene, STRING_DEBUG_X, STRING_CENTER_Z }) {

  // Bridge anchor
  const bridgeHelper = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x33ccff,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    })
  );
  bridgeHelper.name = 'BridgeHelper';
  bridgeHelper.position.set(STRING_DEBUG_X, 1.69, STRING_CENTER_Z);
  bridgeHelper.renderOrder = 999;
  scene.add(bridgeHelper);

  // Nut anchor
  const nutHelper = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xff3366,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    })
  );
  nutHelper.name = 'NutHelper';
  nutHelper.position.set(STRING_DEBUG_X - 1.2, 3.0, STRING_CENTER_Z);
  nutHelper.renderOrder = 999;
  scene.add(nutHelper);

  // 指板圓點
  const fingerboard = createFingerboardDots({
    parent: scene,
    nut: nutHelper.position,
    bridge: bridgeHelper.position,
    radius: 0.012,
  });

  return { fingerboard };
}