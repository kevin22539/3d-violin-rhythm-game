/**
 * 節拍器。用 Web Audio 的 sample-accurate scheduling 確保拍子準確,
 * 不會受 setTimeout 的 jitter 影響(setTimeout 在背景頁面或 GC 時可能延遲幾十毫秒)。
 *
 * 用法:
 *   const m = createMetronome({ audioContext });
 *   m.start(48, 600, {
 *     beatsPerBar: 4,          // 強拍週期(預設 4)
 *     onTick: (beat, total) => { ... },
 *     onComplete: () => { ... },
 *   });
 *   m.stop();
 *   m.isActive();
 *
 * 設計:
 *   - 每個 click 用獨立的 oscillator + envelope (40ms 短促音)
 *   - downbeat(每 N 拍一次)頻率較高、音量較大,聽得出「1-2-3-4」
 *   - 所有 osc 都記在陣列中,stop() 時統一 cancel 未來尚未播的 osc
 *   - onTick 用 setTimeout schedule(允許 ~1 frame 誤差),不影響 audio 精確度
 */
export function createMetronome({ audioContext } = {}) {
  if (!audioContext) {
    throw new Error('createMetronome: audioContext is required');
  }

  let active = false;
  let scheduledOscs = [];   // 所有 schedule 出去的 oscillator(stop 時要 cancel)
  let visualTimers = [];    // onTick 的 setTimeout id
  let completeTimer = null;
  let onTickCb = null;
  let onCompleteCb = null;

  /**
   * 在指定 audio time 播放一個 click 音。
   * accent=true 時頻率與音量都更突出(用於強拍)。
   */
  function clickAt(time, accent = false) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'square';   // square 比 sine 更脆、像木魚
    osc.frequency.setValueAtTime(accent ? 1600 : 1000, time);

    const peakVolume = accent ? 0.22 : 0.13;
    // 短促 envelope: 1ms attack, 30~40ms decay
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peakVolume, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (accent ? 0.05 : 0.035));

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.06);
    scheduledOscs.push(osc);
  }

  /**
   * @param totalBeats  總拍數(整首曲子)
   * @param beatMs      每拍多少毫秒(speed=1.0 時 600,speed=0.5 時 1200)
   * @param options.beatsPerBar  強拍週期,預設 4(每 4 拍一次 downbeat)
   * @param options.onTick       每拍觸發,參數 (beatNumber 1-indexed, totalBeats)
   * @param options.onComplete   全部拍數結束時觸發
   */
  function start(totalBeats, beatMs, options = {}) {
    const {
      beatsPerBar = 4,
      onTick = null,
      onComplete = null,
    } = options;

    stop(); // 確保前一輪結束
    active = true;
    onTickCb = onTick;
    onCompleteCb = onComplete;

    // 給 audio thread 一點 lead time,避免立刻 schedule 在 currentTime 上 → 可能爆音
    const startAudioTime = audioContext.currentTime + 0.05;

    for (let i = 0; i < totalBeats; i++) {
      const beatTime = startAudioTime + (i * beatMs) / 1000;
      const isDownbeat = i % beatsPerBar === 0;
      clickAt(beatTime, isDownbeat);

      // 視覺 callback(允許 ~1 frame 誤差)
      const delayMs = (beatTime - audioContext.currentTime) * 1000;
      const beatNumber = i + 1;
      visualTimers.push(setTimeout(() => {
        if (!active) return;
        onTickCb?.(beatNumber, totalBeats);
      }, delayMs));
    }

    // 全部結束
    const endDelayMs = (startAudioTime - audioContext.currentTime) * 1000 + totalBeats * beatMs;
    completeTimer = setTimeout(() => {
      if (!active) return;
      active = false;
      scheduledOscs = [];   // 都已自然停了,可以清陣列
      const cb = onCompleteCb;
      onTickCb = null;
      onCompleteCb = null;
      cb?.();
    }, endDelayMs);
  }

  function stop() {
    if (!active && scheduledOscs.length === 0) return;
    active = false;

    // 取消所有未來的 visual ticks
    for (const t of visualTimers) clearTimeout(t);
    visualTimers = [];

    if (completeTimer != null) {
      clearTimeout(completeTimer);
      completeTimer = null;
    }

    // 取消所有未來尚未播的 oscillator
    // 已經響到一半的會被立刻切掉(可能有極短 click,可接受)
    const now = audioContext.currentTime;
    for (const osc of scheduledOscs) {
      try {
        osc.stop(now);
      } catch (e) {
        // already stopped naturally, ignore
      }
    }
    scheduledOscs = [];

    onTickCb = null;
    onCompleteCb = null;
  }

  function isActive() {
    return active;
  }

  return { start, stop, isActive };
}