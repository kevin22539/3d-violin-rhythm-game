import * as THREE from 'three';

//Camera preset controller//
export function createCameraController({
  camera,
  controls,
  presets = {},
  durationMs = 500,
  onActiveChange = null,
}) {
  // Each preset value: { position: [x,y,z], target: [x,y,z], free?: boolean }
  // `free: true` means "do nothing on goTo — just let OrbitControls take over".
  let _presets = { ...presets };

  let activeName = null;
  let tween = null; // { startTime, durationMs, fromPos, toPos, fromTarget, toTarget }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function setPresets(next) {
    _presets = { ..._presets, ...next };
  }

  function getPresetNames() {
    return Object.keys(_presets);
  }

  function getActive() {
    return activeName;
  }

  /**
   * Jump to a preset (no tween). Useful for initial setup.
   */
  function snapTo(name) {
    const p = _presets[name];
    if (!p || p.free) {
      activeName = name;
      if (onActiveChange) onActiveChange(name);
      return;
    }
    camera.position.fromArray(p.position);
    controls.target.fromArray(p.target);
    camera.lookAt(controls.target);
    controls.update();
    tween = null;
    activeName = name;
    if (onActiveChange) onActiveChange(name);
  }

  /**
   * Smoothly transition to a preset over `durationMs`.
   *
   * For a `free` preset we just mark it active without moving the camera —
   * OrbitControls continues from wherever the camera currently is.
   */
  function goTo(name) {
    const p = _presets[name];
    if (!p) return;

    activeName = name;
    if (onActiveChange) onActiveChange(name);

    if (p.free) {
      tween = null;
      return;
    }

    tween = {
      startTime: performance.now(),
      durationMs,
      fromPos:    camera.position.clone(),
      toPos:      new THREE.Vector3().fromArray(p.position),
      fromTarget: controls.target.clone(),
      toTarget:   new THREE.Vector3().fromArray(p.target),
    };
  }

  /**
   * Called every frame from animation loop. No-op when no tween is active.
   */
  function update() {
    if (!tween) return;

    const now = performance.now();
    const raw = (now - tween.startTime) / tween.durationMs;
    const t = Math.min(1, Math.max(0, raw));
    const k = easeInOutCubic(t);

    camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
    controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);

    if (t >= 1) {
      tween = null;
    }
  }

  function isTweening() {
    return tween !== null;
  }

  return {
    goTo,
    snapTo,
    update,
    setPresets,
    getPresetNames,
    getActive,
    isTweening,
  };
}