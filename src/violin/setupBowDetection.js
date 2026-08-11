import * as THREE from 'three';

import { createBowController }   from './bowController.js';
import { createStringDetector }  from './stringDetector.js';
import { createBowMotionTracker } from './bowMotionTracker.js';
import { STRING_ZONES, BOW_Y_BAND } from './stringZones.js';

/**
 * 建立弓毛端點、視覺色條、bowController / stringDetector / bowMotionTracker。
 *
 * @returns {{
 *   bowHairFrog, bowHairTip, hairLine,
 *   stringMarkers, targetMarkers,
 *   STRING_DEBUG_X, STRING_CENTER_Z,
 *   bowController, stringDetector, bowMotionTracker
 * }}
 */
export function setupBowDetection({ bow, scene, camera, renderer, controls, onHint }) {

  // ===== 弓毛多點判定 =====
  scene.updateMatrixWorld(true);

  const bowWorldBox    = new THREE.Box3().setFromObject(bow);
  const bowWorldSize   = new THREE.Vector3();
  const bowWorldCenter = new THREE.Vector3();
  bowWorldBox.getSize(bowWorldSize);
  bowWorldBox.getCenter(bowWorldCenter);

  const longAxis = new THREE.Vector3(1, 0, 0);
  let longSize = bowWorldSize.x;
  if (bowWorldSize.y > longSize) { longAxis.set(0, 1, 0); longSize = bowWorldSize.y; }
  if (bowWorldSize.z > longSize) { longAxis.set(0, 0, 1); longSize = bowWorldSize.z; }

  const HAIR_RATIO          = 0.42;
  const HAIR_HALF_LEN_WORLD = longSize * HAIR_RATIO;
  const HAIR_PERP_OFFSET_WORLD = 0.0;
  const perpAxis = new THREE.Vector3(0, 1, 0);

  const frogWorldPos = bowWorldCenter.clone()
    .sub(longAxis.clone().multiplyScalar(HAIR_HALF_LEN_WORLD))
    .add(perpAxis.clone().multiplyScalar(HAIR_PERP_OFFSET_WORLD));

  const tipWorldPos = bowWorldCenter.clone()
    .add(longAxis.clone().multiplyScalar(HAIR_HALF_LEN_WORLD))
    .add(perpAxis.clone().multiplyScalar(HAIR_PERP_OFFSET_WORLD));

  const FROG_LOCAL = bow.worldToLocal(frogWorldPos.clone());
  const TIP_LOCAL  = bow.worldToLocal(tipWorldPos.clone());

  // ── frog 球(綠) ──
  const bowHairFrog = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x33ff66, depthTest: false, transparent: true, opacity: 0.95 })
  );
  bowHairFrog.position.copy(FROG_LOCAL);
  bowHairFrog.renderOrder = 999;
  bow.add(bowHairFrog);

  // ── tip 球(紅) ──
  const bowHairTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff3333, depthTest: false, transparent: true, opacity: 0.95 })
  );
  bowHairTip.position.copy(TIP_LOCAL);
  bowHairTip.renderOrder = 999;
  bow.add(bowHairTip);

  // ── 黃色輔助線 ──
  const hairLineGeom = new THREE.BufferGeometry().setFromPoints([FROG_LOCAL, TIP_LOCAL]);
  const hairLine = new THREE.Line(
    hairLineGeom,
    new THREE.LineBasicMaterial({ color: 0xffee44, transparent: true, opacity: 0.75, depthTest: false })
  );
  hairLine.renderOrder = 998;
  bow.add(hairLine);

  scene.updateMatrixWorld(true);

  // ── STRING_DEBUG_X ──
  const frogWorldCheck = new THREE.Vector3();
  const tipWorldCheck  = new THREE.Vector3();
  bowHairFrog.getWorldPosition(frogWorldCheck);
  bowHairTip.getWorldPosition(tipWorldCheck);

  const STRING_DEBUG_X  = (frogWorldCheck.x + tipWorldCheck.x) / 2;
  const STRING_CENTER_Z = 0.0;

  // ── 視覺色條 ──
  const bandCenterY = (BOW_Y_BAND.min + BOW_Y_BAND.max) / 2;
  const bandHeight  = BOW_Y_BAND.max - BOW_Y_BAND.min;

  const stringDebugGroup = new THREE.Group();

  const bowBandVisual = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, bandHeight, 0.36),
    new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0.08, depthWrite: false })
  );
  bowBandVisual.position.set(STRING_DEBUG_X, bandCenterY, STRING_CENTER_Z);
  stringDebugGroup.add(bowBandVisual);

  const baseStringColors = { G: 0x66ff66, D: 0x66aaff, A: 0xffaa44, E: 0xff6666 };

  const stringMarkers = new Map();
  const targetMarkers = new Map();

  for (const zone of STRING_ZONES) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, bandHeight, 0.01),
      new THREE.MeshBasicMaterial({
        color: baseStringColors[zone.name] ?? 0xffffff,
        transparent: true, opacity: 0.35, depthWrite: false,
      })
    );
    marker.position.set(STRING_DEBUG_X, bandCenterY, STRING_CENTER_Z + zone.z);
    marker.userData.baseColor = baseStringColors[zone.name] ?? 0xffffff;
    stringMarkers.set(zone.name, marker);
    stringDebugGroup.add(marker);

    const targetMarker = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, bandHeight + 0.10, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffee66, transparent: true, opacity: 0.0, depthWrite: false })
    );
    targetMarker.position.set(STRING_DEBUG_X, bandCenterY, STRING_CENTER_Z + zone.z);
    targetMarkers.set(zone.name, targetMarker);
    stringDebugGroup.add(targetMarker);
  }

  scene.add(stringDebugGroup);

  // ── bow handle 點擊區域 ──
  const bowHandleHitArea = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.90),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.12, depthWrite: false })
  );
  bowHandleHitArea.position.set(0, -4.5, 2.5);
  bow.add(bowHandleHitArea);

  // ── bowController ──
  const bowController = createBowController({
    bow,
    dragHandle: bowHandleHitArea,
    camera,
    domElement: renderer.domElement,
    controls,
    fixedX: 6.5,
    minZ: -1.2,
    maxZ: 3.0,
    minY: 1.50,
    maxY: 1.90,
    moveScaleZ: 0.0025,
    moveScaleY: 0.0025,
    onModeChange: (mode) => {
      if (mode === 'play') {
        onHint('🎻 Performance mode ON — move mouse to bow. Click handle again or press Esc to exit.');
      } else {
        onHint('Performance mode OFF — camera orbit re-enabled.');
      }
    },
  });

  // ── stringDetector ──
  const stringDetector = createStringDetector({
    bowHairFrog,
    bowHairTip,
    stringPlaneX: STRING_DEBUG_X,
    planeTolerance: 0.18,
    sampleCount: 11,
  });

  // ── bowMotionTracker ──
  const bowMotionTracker = createBowMotionTracker({
    bow,
    moveThreshold: 0.0008,
  });

  return {
    bowHairFrog,
    bowHairTip,
    hairLine,
    stringMarkers,
    targetMarkers,
    STRING_DEBUG_X,
    STRING_CENTER_Z,
    bowController,
    stringDetector,
    bowMotionTracker,
  };
}