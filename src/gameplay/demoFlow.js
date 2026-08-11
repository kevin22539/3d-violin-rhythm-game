import { TWINKLE_TWINKLE_A_MAJOR } from './twinkle.js';
import { ODE_TO_JOY_G_MAJOR }      from './odetoJoy.js';

const BASE_QUARTER_MS = 600;

const DEMO_SONGS = {
  twinkle:  { melody: TWINKLE_TWINKLE_A_MAJOR, name: 'Twinkle Twinkle' },
  odeToJoy: { melody: ODE_TO_JOY_G_MAJOR,      name: 'Ode to Joy' },
};

const COUNTDOWN_BEATS = 4;

function countQuarterBeats(melody) {
  let totalQuarterMs = 0;
  for (const n of melody) totalQuarterMs += n.durationMs;
  return Math.round(totalQuarterMs / BASE_QUARTER_MS);
}

/**
 * 建立 demo flow 的所有函式,回傳給 main.js 使用。
 *
 * @param {{ melodyPlayer, countdown, metronome, yourTurnPrompt, demoMenu, showHint, setDemoStatusMessage, setGameMode }} refs
 */
export function createDemoFlow(refs) {
  const {
    getMelodyPlayer,
    getCountdown,
    getMetronome,
    getYourTurnPrompt,
    getDemoMenu,
    showHint,
    setDemoStatusMessage,
    setGameMode,
  } = refs;

  function startCountdownWithMetronome(beats, beatMs, onComplete, onCancel) {
    getMetronome().start(beats, beatMs);
    getCountdown().show(beats, beatMs,
      () => { onComplete?.(); },
      () => { getMetronome().stop(); onCancel?.(); }
    );
  }

  function startChallengePlaying(entry, beatMs, totalBeats, speedLabel) {
    setDemoStatusMessage(`🎯 ${entry.name}${speedLabel}: Beat 1/${totalBeats}`);
    getMetronome().start(totalBeats, beatMs, {
      onTick: (beat, total) => {
        setDemoStatusMessage(`🎯 ${entry.name}${speedLabel}: Beat ${beat}/${total}`);
      },
      onComplete: () => {
        setDemoStatusMessage('');
        showHint('🏁 Challenge complete! Well done.', 3000);
      },
    });
  }

  function startChallengeCountdown(entry, playerSpeed) {
    const beatMs      = BASE_QUARTER_MS / playerSpeed;
    const totalBeats  = countQuarterBeats(entry.melody);
    const speedLabel  = playerSpeed === 1.0 ? '' : ` (${playerSpeed}× slow)`;

    setDemoStatusMessage(`🎯 ${entry.name}${speedLabel} — Get ready!`);
    startCountdownWithMetronome(COUNTDOWN_BEATS, beatMs,
      () => startChallengePlaying(entry, beatMs, totalBeats, speedLabel),
      () => { setDemoStatusMessage(''); showHint('Challenge cancelled.', 1500); }
    );
  }

  function showYourTurnPrompt(entry) {
    getYourTurnPrompt().show({
      onSelectSpeed: (playerSpeed) => { startChallengeCountdown(entry, playerSpeed); },
      onCancel: () => { showHint('Skipped. Press Space to play again.', 2000); },
    });
  }

  function startDemoPlaying(entry) {
    setDemoStatusMessage(`🎵 ${entry.name}: Starting...`);
    getMelodyPlayer().start(
      entry.melody,
      {
        onNoteStart: (note, index, total) => {
          setDemoStatusMessage(
            `🎵 ${entry.name}: ${index + 1}/${total} — ${note.pitch} on ${note.string} string`
          );
        },
        onFinish: () => { setDemoStatusMessage(''); showYourTurnPrompt(entry); },
        onCancel: () => { setDemoStatusMessage(''); showHint('Demo stopped.', 1500); },
      },
      { speed: 1.0 }
    );
  }

  function startDemoFlow(songId) {
    const entry = DEMO_SONGS[songId];
    if (!entry) return;

    if (getDemoMenu()?.isOpen()) getDemoMenu().close();
    setGameMode(false);

    setDemoStatusMessage(`🎬 ${entry.name} — Listen to the demo`);
    startCountdownWithMetronome(COUNTDOWN_BEATS, BASE_QUARTER_MS,
      () => startDemoPlaying(entry),
      () => { setDemoStatusMessage(''); showHint('Countdown cancelled.', 1500); }
    );
  }

  function isDemoActive() {
    return (
      (getDemoMenu()?.isOpen()) ||
      (getCountdown()?.isActive()) ||
      (getMelodyPlayer()?.isPlaying()) ||
      (getYourTurnPrompt()?.isOpen())
    );
  }

  function isAnyDemoFlowRunning() {
    return isDemoActive() || getMetronome()?.isActive();
  }

  return { startDemoFlow, isDemoActive, isAnyDemoFlowRunning };
}