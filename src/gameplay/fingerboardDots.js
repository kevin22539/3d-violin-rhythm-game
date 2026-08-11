import * as THREE from 'three';
import { STRING_ZONES } from '../violin/stringZones.js';

// 第一把位的指位比例(從 nut 算到 bridge)
// 對應到 +2 / +4 / +5 / +7 個半音(等律)
const FINGER_FRACTIONS = {
  1: 0.11,
  2: 0.20,
  3: 0.25,
  4: 0.33,
};

const STRING_NAMES = ['G', 'D', 'A', 'E'];
const FINGERS = [1, 2, 3, 4];

/**
 * 建立指板上 4 弦 × 4 指 = 16 顆指位圓點。
 *
 * 預設透明且暗淡(看得到但不顯眼),呼叫 light(stringName, finger) 會把
 * 對應那顆切換成發光狀態(emissive),呼叫 clear() 全部復原。
 *
 * 空弦(finger = 0)不在指板上,故 light(..., 0) 為 no-op。空弦發光請由
 * 弦本身的模組處理。
 *
 * 圓點位置 = lerp(nut, bridge, fingerFraction),但 Z 直接取 STRING_ZONES
 * 對應弦的 z(假設弦從 nut 到 bridge 平行,這是簡化,真實小提琴弦會略收斂)。
 *
 * @param {Object}            options
 * @param {THREE.Object3D}    [options.parent]            要附加的場景/群組
 * @param {THREE.Vector3}     options.nut                 琴枕世界座標
 * @param {THREE.Vector3}     options.bridge              琴橋世界座標
 * @param {number}            [options.radius=0.04]
 * @param {number}            [options.baseColor=0x222222]
 * @param {number}            [options.litColor=0xffaa33]
 * @param {number}            [options.baseOpacity=0.35]
 * @param {number}            [options.emissiveIntensity=2.5]
 *
 * @returns {{
 *   group: THREE.Group,
 *   dots: Object,
 *   light: (s: string, f: number) => void,
 *   clear: () => void,
 *   setAnchors: (nut: THREE.Vector3, bridge: THREE.Vector3) => void,
 *   dispose: () => void,
 * }}
 */
export function createFingerboardDots(options = {}) {
  const {
    parent,
    nut = new THREE.Vector3(),
    bridge = new THREE.Vector3(),
    radius = 0.012,
    baseColor = 0x222222,
    litColor = 0xffaa33,
    baseOpacity = 0.35,
    emissiveIntensity = 2.5,
    stringSpreadScale = 0.4,    // ← 新增:橫向(弦距)縮放,1.0 = 原本寬度
    fingerSpreadScale = 0.6,    // ← 新增:縱向(指距)縮放
  } = options;

  const group = new THREE.Group();
  group.name = 'FingerboardDots';

  // dots[stringName][finger] = Mesh
  const dots = Object.create(null);

  // 16 顆球共用 geometry,但每顆獨立 material(才能個別點亮)
  const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);

  // nut / bridge 用 clone 存,呼叫 setAnchors 才會更新
  const nutPos = nut.clone();
  const bridgePos = bridge.clone();

function computePosition(stringZ, fraction) {
    const f = fraction * fingerSpreadScale;
    const x = THREE.MathUtils.lerp(nutPos.x, bridgePos.x, f);
    const y = THREE.MathUtils.lerp(nutPos.y, bridgePos.y, f);
    const z = stringZ * stringSpreadScale;
    return new THREE.Vector3(x, y, z);
  }

  function makeDotMaterial() {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: 0x000000,
      emissiveIntensity: 0,
      transparent: true,
      opacity: baseOpacity,
      roughness: 0.4,
      metalness: 0.0,
    });
  }

  // 建 16 顆
  for (const stringName of STRING_NAMES) {
    const zone = STRING_ZONES.find((s) => s.name === stringName);
    if (!zone) continue;
    dots[stringName] = Object.create(null);

    for (const finger of FINGERS) {
      const fraction = FINGER_FRACTIONS[finger];
      const mesh = new THREE.Mesh(sphereGeo, makeDotMaterial());
      mesh.position.copy(computePosition(zone.z, fraction));
      mesh.renderOrder = 950;
      mesh.userData = { string: stringName, finger, fraction };
      mesh.name = `dot_${stringName}_${finger}`;
      group.add(mesh);
      dots[stringName][finger] = mesh;
    }
  }

  if (parent) parent.add(group);

  // ===== API =====

  function light(stringName, finger) {
    // 空弦不在指板上
    if (!finger || finger === 0) return;
    const mesh = dots[stringName]?.[finger];
    if (!mesh) return;
    const mat = mesh.material;
    mat.color.setHex(litColor);
    mat.emissive.setHex(litColor);
    mat.emissiveIntensity = emissiveIntensity;
    mat.opacity = 1.0;
  }

  function clear() {
    for (const stringName of STRING_NAMES) {
      const row = dots[stringName];
      if (!row) continue;
      for (const finger of FINGERS) {
        const mesh = row[finger];
        if (!mesh) continue;
        const mat = mesh.material;
        mat.color.setHex(baseColor);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mat.opacity = baseOpacity;
      }
    }
  }

  function setAnchors(newNut, newBridge) {
    if (newNut) nutPos.copy(newNut);
    if (newBridge) bridgePos.copy(newBridge);
    for (const stringName of STRING_NAMES) {
      const zone = STRING_ZONES.find((s) => s.name === stringName);
      if (!zone) continue;
      const row = dots[stringName];
      if (!row) continue;
      for (const finger of FINGERS) {
        const fraction = FINGER_FRACTIONS[finger];
        const mesh = row[finger];
        if (!mesh) continue;
        mesh.position.copy(computePosition(zone.z, fraction));
      }
    }
  }

  function dispose() {
    for (const stringName of STRING_NAMES) {
      const row = dots[stringName];
      if (!row) continue;
      for (const finger of FINGERS) {
        row[finger]?.material.dispose();
      }
    }
    sphereGeo.dispose();
    if (group.parent) group.parent.remove(group);
  }

  return { group, dots, light, clear, setAnchors, dispose };
}