import * as THREE from 'three';
import {
  STRING_ZONES,
  STRING_ENTER_THRESHOLD,
  STRING_LEAVE_THRESHOLD,
  isWithinBowYBand,
} from './stringZones.js';

export function createStringDetector({
  bowHairFrog,
  bowHairTip,
  stringPlaneX,
  planeTolerance = 0.18,
  sampleCount = 11,
}) {
  const frogWorld = new THREE.Vector3();
  const tipWorld = new THREE.Vector3();
  const samplePoint = new THREE.Vector3();

  let activeString = null;

  // 每幀沿弓毛取樣,對每根弦記錄所有「有效取樣點」中最近的距離
  function evaluateSamples() {
    bowHairFrog.getWorldPosition(frogWorld);
    bowHairTip.getWorldPosition(tipWorld);

    const stringMinDist = new Map();
    const steps = Math.max(2, sampleCount);

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      samplePoint.lerpVectors(frogWorld, tipWorld, t);

      const inPlane =
        Math.abs(samplePoint.x - stringPlaneX) <= planeTolerance;
      const inBand = isWithinBowYBand(samplePoint.y);

      if (!inPlane || !inBand) continue;

      for (const zone of STRING_ZONES) {
        const d = Math.abs(samplePoint.z - zone.z);
        const prev = stringMinDist.get(zone.name);
        if (prev === undefined || d < prev) {
          stringMinDist.set(zone.name, d);
        }
      }
    }

    return stringMinDist;
  }

  function update() {
    const stringMinDist = evaluateSamples();

    if (stringMinDist.size === 0) {
      activeString = null;
      return null;
    }

    // 滯後:原本就在某根弦上的話,只要還沒離開 LEAVE 範圍就維持
    if (activeString) {
      const activeDist = stringMinDist.get(activeString);
      if (activeDist !== undefined && activeDist <= STRING_LEAVE_THRESHOLD) {
        return activeString;
      }
    }

    // 否則挑「最近 + 在 ENTER 範圍內」的弦
    let bestString = null;
    let bestDist = Infinity;

    for (const [name, dist] of stringMinDist.entries()) {
      if (dist <= STRING_ENTER_THRESHOLD && dist < bestDist) {
        bestDist = dist;
        bestString = name;
      }
    }

    activeString = bestString;
    return activeString;
  }

  // debug 用:回傳這一幀的所有取樣點世界座標
  function getSamplePoints() {
    bowHairFrog.getWorldPosition(frogWorld);
    bowHairTip.getWorldPosition(tipWorld);
    const points = [];
    const steps = Math.max(2, sampleCount);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      points.push(new THREE.Vector3().lerpVectors(frogWorld, tipWorld, t));
    }
    return points;
  }

  return {
    update,
    getSamplePoints,
    getActiveString: () => activeString,
  };
}