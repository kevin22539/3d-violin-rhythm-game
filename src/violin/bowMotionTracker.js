import * as THREE from 'three';

 
export function createBowMotionTracker({
  bow,
  moveThreshold = 0.0015,
  // 換弓判定:Z 軸每幀位移絕對值要大於這個才算「有方向」,過小就視為「弓停著或微抖」
  directionDeadzone = 0.0008,
  // 額外條件:整體速度也要夠快,才認可這次方向反轉(避免抖動誤判)
  flipSpeedThreshold = 0.003,
}) {
  const prev = new THREE.Vector3();
  const current = new THREE.Vector3();
 
  bow.getWorldPosition(prev);
 
  let isMoving = false;
  let speed = 0;

  let velocityZ = 0;
  let lastDirection = 0;
  let directionFlipped = false;
  let flipSpeed = 0;          // ← 新增這行
 
  function update() {
    bow.getWorldPosition(current);
 
    const dz = current.z - prev.z;
    velocityZ = dz;
    speed = current.distanceTo(prev);
    isMoving = speed > moveThreshold;
 
    directionFlipped = false;
 
    // 只有當這一幀 Z 位移夠大、整體速度也夠快,才更新方向 / 判定反轉
    if (Math.abs(dz) > directionDeadzone) {
      const dir = dz > 0 ? 1 : -1;
 
      // 從一個明確方向 -> 反方向 = 換弓
      if (
        lastDirection !== 0 &&
        dir !== lastDirection &&
        speed > flipSpeedThreshold
      ) {
        directionFlipped = true;
        flipSpeed = speed;     // ← 新增這行
      }
 
      lastDirection = dir;
    }
    // 注意:速度過小時保留 lastDirection 不重置 ——
    // 這讓「停一下 → 反向」也會被判定成換弓,符合真實演奏感覺。
 
    prev.copy(current);
    return isMoving;
  }
 
  return {
    update,
    getIsMoving: () => isMoving,
    getSpeed: () => speed,
    getVelocityZ: () => velocityZ,
    getDirection: () => lastDirection,
    didFlipDirection: () => directionFlipped,
    getFlipSpeed: () => flipSpeed,    // ← 新增這行
  };
}