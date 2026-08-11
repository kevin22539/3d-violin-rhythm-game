export const STRING_ZONES = [
  { name: 'G', z:  0.12 },  // 最左 = 低音
  { name: 'D', z:  0.04 },
  { name: 'A', z: -0.04 },
  { name: 'E', z: -0.12 },  // 最右 = 高音
];

export const BOW_Y_BAND = {
  min: 1.55,
  max: 1.83,
};

export const STRING_ENTER_THRESHOLD = 0.055;
export const STRING_LEAVE_THRESHOLD = 0.080;

export function findNearestStringByZ(zValue) {
  let nearest = STRING_ZONES[0];
  let bestDist = Math.abs(zValue - nearest.z);

  for (let i = 1; i < STRING_ZONES.length; i++) {
    const candidate = STRING_ZONES[i];
    const dist = Math.abs(zValue - candidate.z);

    if (dist < bestDist) {
      nearest = candidate;
      bestDist = dist;
    }
  }

  return {
    string: nearest,
    distance: bestDist,
  };
}

export function isWithinBowYBand(yValue) {
  return yValue >= BOW_Y_BAND.min && yValue <= BOW_Y_BAND.max;
}