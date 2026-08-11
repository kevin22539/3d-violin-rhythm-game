//純視覺更新函式,不依賴任何外部模組。//

export function updateStringHighlight(activeString, stringMarkers) {
  for (const [name, marker] of stringMarkers.entries()) {
    if (name === activeString) {
      marker.material.color.setHex(0x00ffff);
      marker.material.opacity = 0.95;
      marker.scale.set(1.0, 1.0, 1.8);
    } else {
      marker.material.color.setHex(marker.userData.baseColor);
      marker.material.opacity = 0.35;
      marker.scale.set(1.0, 1.0, 1.0);
    }
  }
}

export function updateTargetGlow(targetString, nowMs, gameMode, targetMarkers) {
  for (const [name, marker] of targetMarkers.entries()) {
    if (gameMode && name === targetString) {
      const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.012);
      marker.material.opacity = 0.18 + pulse * 0.32;
      marker.scale.set(1.0, 1.0 + pulse * 0.12, 1.2 + pulse * 0.6);
    } else {
      marker.material.opacity = 0.0;
      marker.scale.set(1.0, 1.0, 1.0);
    }
  }
}

export function updateHairLine(hairLine, bowHairFrog, bowHairTip) {
  if (!hairLine || !bowHairFrog || !bowHairTip) return;
  const positions = hairLine.geometry.attributes.position.array;
  positions[0] = bowHairFrog.position.x;
  positions[1] = bowHairFrog.position.y;
  positions[2] = bowHairFrog.position.z;
  positions[3] = bowHairTip.position.x;
  positions[4] = bowHairTip.position.y;
  positions[5] = bowHairTip.position.z;
  hairLine.geometry.attributes.position.needsUpdate = true;
}