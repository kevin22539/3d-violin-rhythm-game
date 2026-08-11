import { updateStringHighlight, updateTargetGlow, updateHairLine } from '../ui/visualUpdaters.js';
import { getPitchInfo, getFinger } from '../gameplay/pitchMap.js';

export function startAnimationLoop({
  renderer, scene, camera, controls,
  bowController, stringDetector, bowMotionTracker,
  hairLine, bowHairFrog, bowHairTip,
  keyboardInput, fingerInput,
  violinAudio, fingerboard,
  noteChart, judge, scoreSystem,
  hud, statusText,
  stringMarkers, targetMarkers,
  cameraController = null,
  keyDisplay = null,
  nowPlayingKeys = null,
  getCurrentDemoNote = null,
  getGameMode,
  getRecentMoveExpireAt, setRecentMoveExpireAt,
  getDemoStatusMessage,
  getHintMessage, getHintExpireAt,
  isDemoActive, isAnyDemoFlowRunning,
}) {
  const MOVE_GRACE_MS = 120;

  function animate() {
    requestAnimationFrame(animate);

    if (bowController) bowController.update();
    updateHairLine(hairLine, bowHairFrog, bowHairTip);

    let activeString = null;
    let isMoving = false;
    if (stringDetector)   activeString = stringDetector.update();
    if (bowMotionTracker) isMoving = bowMotionTracker.update();

    const nowMs = performance.now();
    if (isMoving) setRecentMoveExpireAt(nowMs + MOVE_GRACE_MS);

    const movingRecently  = nowMs <= getRecentMoveExpireAt();
    const activeStringKey = keyboardInput.getActiveStringKey();
    const activeFinger    = fingerInput.getActiveFinger();
    const gameMode        = getGameMode();

    let currentTarget = null;
    let targetString  = null;
    if (gameMode) {
      currentTarget = noteChart.getCurrentTarget(nowMs);
      if (currentTarget && !currentTarget.preRoll) {
        targetString = currentTarget.string;
      }
    }

    const bowTouchingAnyString = activeString !== null;
    const keyPitch = activeStringKey ? getPitchInfo(activeStringKey, activeFinger) : null;
    const isSounding = bowTouchingAnyString && keyPitch !== null && movingRecently;

    if (isDemoActive()) {
      // Demo flow 中:聲音由 melodyPlayer 控制
    } else if (isSounding) {
      violinAudio.startContinuousNote(keyPitch.frequency, { volume: 0.10 });

      if (bowMotionTracker && bowMotionTracker.didFlipDirection()) {
        const v = bowMotionTracker.getFlipSpeed();
        const intensity = Math.min(1, Math.max(0, (v - 0.003) / 0.017));
        console.log('bow flip! v =', v.toFixed(4), 'intensity =', intensity.toFixed(2));
        violinAudio.triggerBowChange({
          noiseLevel:    0.35 + intensity * 0.85,
          noiseDuration: 0.04 + intensity * 0.08,
          bandpassFreq:  3200 - intensity * 1000,
          bandpassQ:     1.0  + intensity * 1.5,
          dipRatio:      0.55 - intensity * 0.4,
          dipDownMs:     18   - intensity * 12,
          dipUpMs:       90   - intensity * 40,
        });
      }
    } else {
      violinAudio.stopContinuousNote();
    }

    if (gameMode) {
      const judgeEvents = judge.update({
        target: currentTarget && !currentTarget.preRoll ? currentTarget : null,
        activeString,
        keyString: activeStringKey,
        movingRecently,
      });
      for (const event of judgeEvents) {
        if (event.type === 'hit')  scoreSystem.registerHit();
        if (event.type === 'miss') scoreSystem.registerMiss();
      }
    }

    if (!isDemoActive()) {
      updateStringHighlight(activeStringKey, stringMarkers);
      if (fingerboard) {
        fingerboard.clear();
        if (activeStringKey && activeFinger > 0) {
          fingerboard.light(activeStringKey, activeFinger);
        }
      }
    }

    updateTargetGlow(targetString, nowMs, gameMode, targetMarkers);

    const scoreState = scoreSystem.getState();
    hud.update({
      mode:    gameMode ? 'game' : 'free',
      bowString:  activeString,
      keyString:  activeStringKey,
      noteName:   keyPitch ? keyPitch.name : '-',
      moving:     movingRecently,
      targetString,
      score:   scoreState.score,
      combo:   scoreState.combo,
      hits:    scoreState.hits,
      misses:  scoreState.misses,
      preRollRemainingMs:
        gameMode && currentTarget?.preRoll ? currentTarget.remainingMs : 0,
      finished: gameMode ? noteChart.isFinished(nowMs) : false,
    });

    const demoStatusMessage = getDemoStatusMessage();
    if (isAnyDemoFlowRunning() && demoStatusMessage) {
      statusText.textContent = demoStatusMessage;
    } else if (nowMs < getHintExpireAt()) {
      statusText.textContent = getHintMessage();
    }

    if (keyDisplay) {
      keyDisplay.update(activeStringKey, keyPitch ? keyPitch.name : null);
    }

    // ────────────────────────────────────────────────────────────
    //  Left-side "now playing" indicator.
    //  Demo takes priority — when a demo note is sounding, show the
    //  keys the player *should* press. Otherwise mirror what they're
    //  actually pressing.
    // ────────────────────────────────────────────────────────────
    if (nowPlayingKeys) {
      let displayString = null;
      let displayFinger = 0;
      let displayNote   = null;

      const demoNote = getCurrentDemoNote ? getCurrentDemoNote() : null;
      if (isDemoActive() && demoNote) {
        displayString = demoNote.string;
        displayFinger = getFinger(demoNote.string, demoNote.pitch) ?? 0;
        displayNote   = demoNote.pitch;
      } else if (activeStringKey) {
        displayString = activeStringKey;
        displayFinger = activeFinger;
        displayNote   = keyPitch ? keyPitch.name : null;
      }

      nowPlayingKeys.update(displayString, displayFinger, displayNote);
    }

    if (cameraController) cameraController.update();
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}