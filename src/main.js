import { setupScene } from './core/setupScene.js';
import { loadAllAssets } from './loaders/loadAllAssets.js';
import { setupBowDetection } from './violin/setupBowDetection.js';
import { setupFingerboard } from './gameplay/setupFingerboard.js';
import { createDemoFlow } from './gameplay/demoFlow.js';
import { updateStringHighlight } from './ui/visualUpdaters.js';
import { startAnimationLoop } from './core/animationLoop.js';
import { createKeyboardInput } from './input/keyboardInput.js';
import { createViolinAudio } from './audio/violinAudio.js';
import { createMetronome } from './audio/metronome.js';
import { createFingerInput } from './input/fingerInput.js';
import { createNoteChart } from './gameplay/noteChart.js';
import { createJudge } from './gameplay/judge.js';
import { createScoreSystem } from './gameplay/score.js';
import { createMelodyPlayer } from './gameplay/melodyPlayer.js';
import { createHUD } from './ui/hud.js';
import { createDemoMenu } from './ui/demoMenu.js';
import { createCountdown } from './ui/countDown.js';
import { createYourTurnPrompt } from './ui/yourTurnPrompt.js';
import { createCameraController } from './core/cameraController.js';
import { createCameraPanel } from './ui/cameraPanel.js';
import { createKeyDisplay } from './ui/keyDisplay.js';
import {
  createFingerboardPositions,
  POSITIONS as FINGERBOARD_POSITIONS,
  FINGER_SPREAD_SCALE,
} from './gameplay/fingerboardPositions.js';
import { STRING_ZONES } from './violin/stringZones.js';
import * as THREE from 'three';
import { createNowPlayingKeys } from './ui/nowPlayingKeys.js';

const container = document.getElementById('scene-container');
const statusText = document.getElementById('status');

const { scene, camera, renderer, controls } = setupScene(container);

const keyboardInput = createKeyboardInput();
const fingerInput = createFingerInput();
const violinAudio = createViolinAudio();
const hud = createHUD(statusText);
const keyDisplay = createKeyDisplay();
const nowPlayingKeys = createNowPlayingKeys();

let noteChart = createNoteChart();
let judge = createJudge();
let scoreSystem = createScoreSystem();

let hintMessage = '';
let hintExpireAt = 0;
function showHint(text, durationMs = 2500) {
  hintMessage = text;
  hintExpireAt = performance.now() + durationMs;
}

window.addEventListener('pointerdown', async () => {
  try { await violinAudio.unlock(); console.log('Audio unlocked by pointerdown', violinAudio.getState()); }
  catch (err) { console.error('Audio unlock failed:', err); }
}, { once: true });

window.addEventListener('keydown', async () => {
  try { await violinAudio.unlock(); console.log('Audio unlocked by keydown', violinAudio.getState()); }
  catch (err) { console.error('Audio unlock failed:', err); }
}, { once: true });

let bowController = null;
let stringDetector = null;
let bowMotionTracker = null;
let bowHairFrog = null;
let bowHairTip = null;
let hairLine = null;
let stringMarkers = new Map();
let targetMarkers = new Map();
let STRING_DEBUG_X = 0;
let STRING_CENTER_Z = 0;
let fingerboard = null;
let recentMoveExpireAt = 0;
let gameMode = false;

let demoStatusMessage = '';
let isDemoActive      = () => false;
let isAnyDemoFlowRunning = () => false;
let startDemoFlow     = () => {};
let melodyPlayer = null;
let demoMenu = null;
let countdown = null;
let metronome = null;
let yourTurnPrompt = null;

function resetGameSystems() {
  noteChart = createNoteChart();
  judge = createJudge();
  scoreSystem = createScoreSystem();
  noteChart.start(performance.now(), 1000);
}

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Tab') return;
  event.preventDefault();
  gameMode = !gameMode;
  if (gameMode) resetGameSystems();
});

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space') return;
  if (event.repeat) return;
  event.preventDefault();
  if (!melodyPlayer || !demoMenu || !countdown || !metronome || !yourTurnPrompt) return;

  if (yourTurnPrompt.isOpen())  { yourTurnPrompt.cancel(); return; }
  if (countdown.isActive())     { countdown.cancel();      return; }
  if (melodyPlayer.isPlaying()) { melodyPlayer.stop();     return; }
  if (metronome.isActive()) {
    metronome.stop();
    demoStatusMessage = '';
    showHint('Challenge stopped.', 1500);
    return;
  }
  demoMenu.open();
});

async function init() {
  try {
    const { violin, bow } = await loadAllAssets(scene, {
      onProgress: (msg) => { statusText.textContent = msg; },
    });

    // A1 — anchor controls on violin centre
    scene.updateMatrixWorld(true);
    const violinBox = new THREE.Box3().setFromObject(violin);
    const violinCenter = violinBox.getCenter(new THREE.Vector3());
    controls.target.copy(violinCenter);
    camera.lookAt(controls.target);
    controls.update();

    ({
      bowHairFrog, bowHairTip, hairLine,
      stringMarkers, targetMarkers,
      STRING_DEBUG_X, STRING_CENTER_Z,
      bowController, stringDetector, bowMotionTracker,
    } = setupBowDetection({
      bow, scene, camera, renderer, controls,
      onHint: showHint,
    }));

    ({ fingerboard } = setupFingerboard({ scene, STRING_DEBUG_X, STRING_CENTER_Z }));

    // ────────────────────────────────────────────────────────────
    //  Fingerboard nut & bridge — kept in sync with setupFingerboard.js.
    //  These y values (1.69, 3.0) match the helper positions over there.
    // ────────────────────────────────────────────────────────────
    const nutPos    = new THREE.Vector3(STRING_DEBUG_X - 1.2, 3.0,  STRING_CENTER_Z);
    const bridgePos = new THREE.Vector3(STRING_DEBUG_X,        1.69, STRING_CENTER_Z);

    // Position-range slabs on the fingerboard (hidden by default).
    const fingerboardPositions = createFingerboardPositions({
      parent: scene,
      nut: nutPos,
      bridge: bridgePos,
      stringZones: STRING_ZONES,
    });

    // ────────────────────────────────────────────────────────────
    //  Camera presets — derived from FINGERBOARD_POSITIONS so new
    //  positions added in fingerboardPositions.js auto-get their own
    //  camera target without touching this file.
    // ────────────────────────────────────────────────────────────
    const cameraPresets = {
      bow: {
        position: [bridgePos.x + 2.6, bridgePos.y + 1.1, bridgePos.z + 2.8],
        target:   [bridgePos.x,       bridgePos.y,       bridgePos.z],
      },
      free: { 
        position: [violinCenter.x + 0.6, violinCenter.y + 1.0, violinCenter.z + 9.5],
        target:   [violinCenter.x,       violinCenter.y,       violinCenter.z],
      },
    };

    // Per-position camera presets aimed at the midpoint of each range.
    for (const pos of FINGERBOARD_POSITIONS) {
      const midT = (pos.fractionStart + pos.fractionEnd) / 2 * FINGER_SPREAD_SCALE;
      const midX = THREE.MathUtils.lerp(nutPos.x, bridgePos.x, midT);
      const midY = THREE.MathUtils.lerp(nutPos.y, bridgePos.y, midT);
      cameraPresets[`fingerboard_${pos.id}`] = {
        position: [midX + 0.8, midY + 1.6, STRING_CENTER_Z + 3.6],
        target:   [midX,       midY,       STRING_CENTER_Z],
      };
    }

    const cameraController = createCameraController({
      camera,
      controls,
      presets: cameraPresets,
      durationMs: 500,
    });

    // Default starting camera: 1st-position close-up + its highlight.
    const defaultPresetId = `fingerboard_${FINGERBOARD_POSITIONS[0].id}`;
    cameraController.snapTo(defaultPresetId);
    fingerboardPositions.show(FINGERBOARD_POSITIONS[0].id);

    // Camera panel entries (nested): Fingerboard parent → position children.
    const panelEntries = [
      {
        id: 'fingerboard',
        label: 'Fingerboard',
        children: FINGERBOARD_POSITIONS.map((p) => ({
          id: `fingerboard_${p.id}`,
          label: p.label,
        })),
      },
      { id: 'bow',  label: 'Bow & strings' },
      { id: 'free', label: 'Free orbit' },
    ];

    createCameraPanel({
      entries: panelEntries,
      initialActive: defaultPresetId,
      onSelect: (id) => {
        cameraController.goTo(id);
        // Show the matching slab when a fingerboard-position child is picked;
        // hide all slabs when navigating to Bow/Free.
        if (id.startsWith('fingerboard_')) {
          fingerboardPositions.show(id.slice('fingerboard_'.length));
        } else {
          fingerboardPositions.hide();
        }
      },
    });

    melodyPlayer = createMelodyPlayer({
      violinAudio,
      fingerboard,
      updateStringHighlight: (s) => updateStringHighlight(s, stringMarkers),
      volume: 0.10,
    });

    countdown = createCountdown();
    metronome = createMetronome({ audioContext: violinAudio.getAudioContext() });
    yourTurnPrompt = createYourTurnPrompt();

    demoMenu = createDemoMenu({
      firstPositionSongs: [
        { hotkey: '1', name: 'Twinkle Twinkle Little Star', id: 'twinkle'  },
        { hotkey: '2', name: 'Ode to Joy',                  id: 'odeToJoy' },
      ],
      onSelect: (songId) => { startDemoFlow(songId); },
    });

    ({ startDemoFlow, isDemoActive, isAnyDemoFlowRunning } = createDemoFlow({
      getMelodyPlayer:   () => melodyPlayer,
      getCountdown:      () => countdown,
      getMetronome:      () => metronome,
      getYourTurnPrompt: () => yourTurnPrompt,
      getDemoMenu:       () => demoMenu,
      showHint,
      setDemoStatusMessage: (msg) => { demoStatusMessage = msg; },
      setGameMode:          (val) => { gameMode = val; },
    }));

    statusText.textContent =
      'Ready. Hold A/S/D/F for strings. Tab=Game Mode. Press Space to open the Demo menu.';

    startAnimationLoop({
      renderer, scene, camera, controls,
      bowController, stringDetector, bowMotionTracker,
      hairLine, bowHairFrog, bowHairTip,
      keyboardInput, fingerInput,
      violinAudio, fingerboard,
      noteChart, judge, scoreSystem,
      hud, statusText,
      stringMarkers, targetMarkers,
      cameraController,
      keyDisplay,
      nowPlayingKeys,
      getCurrentDemoNote: () => melodyPlayer?.getProgress()?.note ?? null,
      getGameMode:           () => gameMode,
      getRecentMoveExpireAt: () => recentMoveExpireAt,
      setRecentMoveExpireAt: (v) => { recentMoveExpireAt = v; },
      getDemoStatusMessage:  () => demoStatusMessage,
      getHintMessage:        () => hintMessage,
      getHintExpireAt:       () => hintExpireAt,
      isDemoActive,
      isAnyDemoFlowRunning,
    });
  } catch (error) {
    console.error(error);
    statusText.textContent = 'Failed to load model.';
  }
}

function onWindowResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', onWindowResize);

init();