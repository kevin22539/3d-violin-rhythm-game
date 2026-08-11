import { getFrequency, getFinger } from './pitchMap.js';

/**
 * 示範演奏播放器。
 *
 * 譜面格式:
 *   [{ string: 'A', pitch: 'A4', durationMs: 600, gapAfterMs?: 0 }, ...]
 *
 * - string: 'G' | 'D' | 'A' | 'E',哪一條弦
 * - pitch:  音名(例如 'A4'、'F#5'),會用 pitchMap 轉成頻率
 * - durationMs: 這個音響的時間
 * - gapAfterMs: (可選) 這個音結束後額外的「真空白」,用來製造樂句呼吸感。
 *               > 0 時這段時間會 stopContinuousNote(沒有聲音),
 *               = 0 時下一個音會 cross-fade 接上(legato)。
 *
 * 用法:
 *   const player = createMelodyPlayer({ violinAudio, fingerboard, updateStringHighlight });
 *   player.start(melody, {
 *     onNoteStart: (note, index, total) => {...},
 *     onNoteEnd: (note, index) => {...},
 *     onFinish: () => {...},
 *     onCancel: () => {...},   // stop() 被呼叫時觸發
 *   }, {
 *     speed: 1.0,              // 1.0 = 正常,0.5 = 半速(durationMs/gapAfterMs 都會 × 2)
 *   });
 *   player.stop();
 *   player.isPlaying();
 *
 * 依賴:
 *   violinAudio.startContinuousNote(freq, { volume })
 *   violinAudio.stopContinuousNote()
 *   violinAudio.triggerBowChange(options)   // 可選,沒有也能跑
 *   fingerboard.clear() / fingerboard.light(string, finger)
 *   updateStringHighlight(stringName)       // null 代表清除
 */
export function createMelodyPlayer({
  violinAudio,
  fingerboard = null,
  updateStringHighlight = null,
  volume = 0.10,
} = {}) {
  if (!violinAudio) {
    throw new Error('createMelodyPlayer: violinAudio is required');
  }

  let playing = false;
  let timers = [];
  let melody = null;
  let callbacks = null;
  let currentIndex = -1;
  let timeScale = 1.0;   // 1 / speed,音長時間都要乘這個

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function schedule(delayMs, fn) {
    const id = setTimeout(() => {
      if (!playing) return;
      fn();
    }, delayMs);
    timers.push(id);
  }

  function applyVisuals(note) {
    const finger = getFinger(note.string, note.pitch); // 可能為 0(空弦)或 1..4
    if (updateStringHighlight) updateStringHighlight(note.string);
    if (fingerboard) {
      fingerboard.clear();
      if (finger != null && finger > 0) {
        fingerboard.light(note.string, finger);
      }
    }
  }

  function clearVisuals() {
    if (fingerboard) fingerboard.clear();
    if (updateStringHighlight) updateStringHighlight(null);
  }

  function playNoteAt(index) {
    if (!playing) return;
    if (index >= melody.length) {
      finishPlayback();
      return;
    }

    const note = melody[index];
    currentIndex = index;

    // === Note onset ===
    const frequency = getFrequency(note.pitch);
    if (frequency != null) {
      violinAudio.startContinuousNote(frequency, { volume });

      // 第二個音開始,每次切音都注入一個換弓 transient,聽起來才像「在拉」
      if (index > 0 && typeof violinAudio.triggerBowChange === 'function') {
        violinAudio.triggerBowChange({
          noiseLevel: 0.55,
          noiseDuration: 0.05,
          bandpassFreq: 2800,
          bandpassQ: 1.4,
          dipRatio: 0.4,
          dipDownMs: 12,
          dipUpMs: 70,
        });
      }
    }

    applyVisuals(note);
    callbacks?.onNoteStart?.(note, index, melody.length);

    const gapAfterMs = note.gapAfterMs ?? 0;
    const isLastNote = index === melody.length - 1;

    // === Note end ===
    // 有 gap 或最後一音的話,要主動停聲讓 silence 真正出現;
    // 沒 gap 的中間音,就讓下一個 startContinuousNote 自然 cross-fade 接上。
    schedule(note.durationMs * timeScale, () => {
      if (gapAfterMs > 0 || isLastNote) {
        violinAudio.stopContinuousNote();
      }
      callbacks?.onNoteEnd?.(note, index);
    });

    // === 切到下一個音(或結束)===
    const totalSlotMs = (note.durationMs + gapAfterMs) * timeScale;
    if (isLastNote) {
      schedule(totalSlotMs, () => {
        finishPlayback();
      });
    } else {
      schedule(totalSlotMs, () => {
        playNoteAt(index + 1);
      });
    }
  }

  function finishPlayback() {
    if (!playing) return;
    clearTimers();
    violinAudio.stopContinuousNote();
    clearVisuals();
    playing = false;
    const cb = callbacks;
    melody = null;
    callbacks = null;
    currentIndex = -1;
    cb?.onFinish?.();
  }

  // ===== Public API =====

  function start(_melody, _callbacks = {}, _options = {}) {
    if (!Array.isArray(_melody) || _melody.length === 0) {
      console.warn('melodyPlayer.start: melody is empty.');
      return;
    }
    if (playing) {
      stop();
    }

    const { speed = 1.0 } = _options;
    timeScale = 1 / Math.max(0.01, speed);  // speed=0.5 → timeScale=2(時間 ×2)

    melody = _melody;
    callbacks = _callbacks;
    currentIndex = -1;
    playing = true;

    playNoteAt(0);
  }

  function stop() {
    if (!playing) return;
    clearTimers();
    violinAudio.stopContinuousNote();
    clearVisuals();
    playing = false;
    const cb = callbacks;
    melody = null;
    callbacks = null;
    currentIndex = -1;
    cb?.onCancel?.();
  }

  function isPlaying() {
    return playing;
  }

  function getProgress() {
    if (!playing || !melody) return null;
    return {
      index: currentIndex,
      total: melody.length,
      note: melody[currentIndex] ?? null,
    };
  }

  return { start, stop, isPlaying, getProgress };
}