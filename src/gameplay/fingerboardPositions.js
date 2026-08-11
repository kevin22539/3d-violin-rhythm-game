import * as THREE from 'three';

export const POSITIONS = [
  {
    id: 'first',
    label: '1st Position',
    // open string (nut) through a little past 4th finger (raw 0.33).
    fractionStart: 0.00,
    fractionEnd:   0.40,
  },
  {
    id: 'third',
    label: '3rd Position',
    // 3rd position's 1st finger lands ~where 1st-position's 3rd finger does;
    // these numbers are initial guesses, tune to taste.
    fractionStart: 0.25,
    fractionEnd:   0.55,
  },
];

// Must match fingerboardDots.js. If you change those constants there,
// change them here too.
export const FINGER_SPREAD_SCALE = 0.6;
export const STRING_SPREAD_SCALE = 0.4;

/**
 * Builds a translucent grey slab for each position and adds them all to the
 * scene, hidden by default.
 *
 *   show(positionId) — make only that position visible.
 *   hide()           — hide all.
 *
 * Slabs render BEHIND the finger dots (because dots get bumped to
 * renderOrder 950 in fingerboardDots.js) but visually in FRONT of the
 * fingerboard wood (depthTest is disabled so wood never occludes them).
 */
export function createFingerboardPositions({
  parent,
  nut,                // THREE.Vector3 — world position of the nut anchor
  bridge,             // THREE.Vector3 — world position of the bridge anchor
  stringZones,        // STRING_ZONES array — used to size the slab in z
  color = 0xbbbbbb,
  opacity = 0.30,
  thickness = 0.05,   // slab extent along the fingerboard's local normal
  zMargin = 0.05,     // extra width past the outermost string
  renderOrder = 900,
}) {
  const group = new THREE.Group();
  group.name = 'FingerboardPositions';

  // ── slab width (along world z = string-spread direction) ──
  const zValues = stringZones.map((s) => s.z * STRING_SPREAD_SCALE);
  const zMin = Math.min(...zValues) - zMargin;
  const zMax = Math.max(...zValues) + zMargin;
  const zWidth  = zMax - zMin;
  const zCenter = (zMin + zMax) / 2;

  // ── orient the slab so its local +x lies along nut → bridge in xy,
  //    its local +z lies along world +z (string spread),
  //    and local +y is the perpendicular (the fingerboard's normal). ──
  const nutToBridge = new THREE.Vector3().subVectors(bridge, nut);
  const fullLength  = nutToBridge.length();
  const localX = nutToBridge.clone().normalize();
  const localZ = new THREE.Vector3(0, 0, 1);
  const localY = new THREE.Vector3().crossVectors(localZ, localX).normalize();
  const quat = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(localX, localY, localZ)
  );

  const meshes = new Map();

  for (const pos of POSITIONS) {
    const a = pos.fractionStart * FINGER_SPREAD_SCALE;
    const b = pos.fractionEnd   * FINGER_SPREAD_SCALE;
    const segLength = Math.max(0.001, (b - a) * fullLength);
    const midT = (a + b) / 2;
    const midPos = new THREE.Vector3().lerpVectors(nut, bridge, midT);

    const geom = new THREE.BoxGeometry(segLength, thickness, zWidth);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(midPos.x, midPos.y, zCenter);
    mesh.quaternion.copy(quat);
    mesh.renderOrder = renderOrder;
    mesh.visible = false;
    mesh.userData = { positionId: pos.id };

    meshes.set(pos.id, mesh);
    group.add(mesh);
  }

  if (parent) parent.add(group);

  function show(positionId) {
    for (const [id, mesh] of meshes) {
      mesh.visible = id === positionId;
    }
  }

  function hide() {
    for (const mesh of meshes.values()) {
      mesh.visible = false;
    }
  }

  function dispose() {
    for (const mesh of meshes.values()) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    if (group.parent) group.parent.remove(group);
  }

  return { group, show, hide, dispose };
}