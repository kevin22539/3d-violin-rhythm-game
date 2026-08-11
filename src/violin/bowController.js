import * as THREE from 'three';

export function createBowController({
  bow,
  dragHandle,
  camera,
  domElement,
  controls,
  fixedX = 6.0,
  minZ = -3,
  maxZ = 3,
  minY = 3,
  maxY = 3,
  moveScaleZ = 0.01,
  moveScaleY = 0.01,
  onModeChange = null,
}) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let isPlayMode = false;
  let lastClientX = 0;
  let lastClientY = 0;
  let hasLastPointer = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateMouse(event) {
    const rect = domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function isPointerOnHandle(event) {
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    const target = dragHandle ?? bow;
    const hits = raycaster.intersectObject(target, true);
    return hits.length > 0;
  }

  function enterPlayMode(event) {
    if (isPlayMode) return;
    isPlayMode = true;
    controls.enabled = false;
    lastClientX = event.clientX;
    lastClientY = event.clientY;
    hasLastPointer = true;
    domElement.style.cursor = 'crosshair';
    if (onModeChange) onModeChange('play');
  }

  function exitPlayMode() {
    if (!isPlayMode) return;
    isPlayMode = false;
    controls.enabled = true;
    hasLastPointer = false;
    domElement.style.cursor = '';
    if (onModeChange) onModeChange('idle');
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;

    if (isPlayMode) {
      // 演奏模式下,再點到 handle 就離開
      if (isPointerOnHandle(event)) {
        exitPlayMode();
        event.preventDefault();
      }
      return;
    }

    // 不在演奏模式,點到 handle 就進入
    if (isPointerOnHandle(event)) {
      enterPlayMode(event);
      event.preventDefault();
    }
  }

  function onPointerMove(event) {
    if (!isPlayMode) return;

    if (!hasLastPointer) {
      lastClientX = event.clientX;
      lastClientY = event.clientY;
      hasLastPointer = true;
      return;
    }

    const dx = event.clientX - lastClientX;
    const dy = event.clientY - lastClientY;

    lastClientX = event.clientX;
    lastClientY = event.clientY;

    // 左右滑鼠 -> Z
    bow.position.z = clamp(
      bow.position.z - dx * moveScaleZ,
      minZ,
      maxZ
    );

    // 上下滑鼠 -> Y
    bow.position.y = clamp(
      bow.position.y - dy * moveScaleY,
      minY,
      maxY
    );

    // 前後固定 -> X
    bow.position.x = fixedX;
  }

  function onKeyDown(event) {
    if (event.key === 'Escape' && isPlayMode) {
      exitPlayMode();
    }
  }

  // 滑鼠離開視窗時,下次再回來不要算 delta
  function onPointerLeave() {
    hasLastPointer = false;
  }

  domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('blur', onPointerLeave);
  domElement.addEventListener('pointerleave', onPointerLeave);

  function update() {
    bow.position.x = fixedX;
  }

  function dispose() {
    domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('blur', onPointerLeave);
    domElement.removeEventListener('pointerleave', onPointerLeave);
  }

  return {
    update,
    dispose,
    isPlayMode: () => isPlayMode,
    exitPlayMode,
  };
}