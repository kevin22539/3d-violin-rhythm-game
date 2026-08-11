export function createViolinAudio() {
  let audioContext = null;
  let unlocked = false;
  let noiseBuffer = null;
 
  let activeVoice = null;
  let activeFrequency = null;
  let activeVolume = 0.10; // 給 triggerBowChange 做 dip 用,跟著 startContinuousNote 同步
 
  function ensureContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }
 
  // 200 ms 的白噪音 buffer,所有 bow-change burst 共用 (random offset 取段)
  function getNoiseBuffer(ctx) {
    if (noiseBuffer) return noiseBuffer;
    const sr = ctx.sampleRate;
    const length = Math.floor(sr * 0.2);
    noiseBuffer = ctx.createBuffer(1, length, sr);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }
 
  async function unlock() {
    const ctx = ensureContext();
 
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
 
    // 預先生成 noise buffer,第一次換弓不卡
    getNoiseBuffer(ctx);
 
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
 
    unlocked = true;
  }
 
  function stopContinuousNote() {
    if (!activeVoice || !audioContext) return;
 
    const now = audioContext.currentTime;
 
    try {
      activeVoice.masterGain.gain.cancelScheduledValues(now);
      activeVoice.masterGain.gain.setValueAtTime(
        Math.max(activeVoice.masterGain.gain.value, 0.0001),
        now
      );
      activeVoice.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
 
      // Vibrato 也淡掉,避免最後一刻 detune 還在抖
      activeVoice.lfoDepth.gain.cancelScheduledValues(now);
      activeVoice.lfoDepth.gain.linearRampToValueAtTime(0, now + 0.04);
 
      const stopTime = now + 0.06;
      activeVoice.osc1.stop(stopTime);
      activeVoice.osc2.stop(stopTime);
      activeVoice.osc3.stop(stopTime);
      activeVoice.osc4.stop(stopTime);
      activeVoice.lfo.stop(stopTime);
    } catch (e) {
      console.warn('stopContinuousNote warning:', e);
    }
 
    activeVoice = null;
    activeFrequency = null;
  }
 
  function startContinuousNote(frequency, options = {}) {
    const { volume = 0.10 } = options;
    const ctx = ensureContext();
 
    if (ctx.state !== 'running') {
      console.warn('AudioContext not running yet.');
      return;
    }
 
    // 同一個音還在播 -> 不重建,只同步 volume (方便外部之後做動態力度)
    if (activeVoice && activeFrequency === frequency) {
      activeVolume = volume;
      return;
    }
 
    // 換音時先把舊音停掉
    if (activeVoice) {
      stopContinuousNote();
    }
 
    const now = ctx.currentTime;
 
    // ====== 四個諧波 oscillator ======
    // 1x = sawtooth (基音,提供豐富泛音)
    // 2x = triangle (圓潤偶次諧波)
    // 3x = sine
    // 5x = sine
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const osc4 = ctx.createOscillator();
 
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc3.type = 'sine';
    osc4.type = 'sine';
 
    osc1.frequency.setValueAtTime(frequency, now);
    osc2.frequency.setValueAtTime(frequency * 2, now);
    osc3.frequency.setValueAtTime(frequency * 3, now);
    osc4.frequency.setValueAtTime(frequency * 5, now);
 
    // 微微 detune 讓泛音不完全鎖相,聽起來更「活」
    osc2.detune.setValueAtTime(4, now);
    osc3.detune.setValueAtTime(-3, now);
    osc4.detune.setValueAtTime(2, now);
 
    // 每個諧波各自的混音量 (相對於基音)
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain(); // -12 dB ≈ 0.25
    const gain4 = ctx.createGain(); // -18 dB ≈ 0.125
    gain1.gain.setValueAtTime(1.0, now);
    gain2.gain.setValueAtTime(0.5, now);
    gain3.gain.setValueAtTime(0.25, now);
    gain4.gain.setValueAtTime(0.125, now);
 
    // ====== Filter chain ======
    // lowpass 用來砍掉太刺的高頻 (鋸齒的尖銳感)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, now); // 比原本的 2800 稍微高一點,讓 3x/5x 還聽得到
    lowpass.Q.setValueAtTime(0.8, now);
 
    // Body resonance: 模擬琴箱在 ~500 Hz 的一個主要 air-mode 凸起
    const bodyResonance = ctx.createBiquadFilter();
    bodyResonance.type = 'peaking';
    bodyResonance.frequency.setValueAtTime(500, now);
    bodyResonance.Q.setValueAtTime(2.0, now);
    bodyResonance.gain.setValueAtTime(7.0, now); // +7 dB
 
    // ====== Master gain (整體 envelope) ======
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(volume, now + 0.03);
 
    // 接線
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    osc4.connect(gain4);
 
    gain1.connect(lowpass);
    gain2.connect(lowpass);
    gain3.connect(lowpass);
    gain4.connect(lowpass);
 
    lowpass.connect(bodyResonance);
    bodyResonance.connect(masterGain);
    masterGain.connect(ctx.destination);
 
    // ====== Vibrato LFO ======
    // 5.5 Hz sine -> gain (深度 cents) -> 所有 oscillator 的 detune
    // ±17 cents ≈ ±1% 音高
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, now);
 
    const lfoDepth = ctx.createGain();
    const VIBRATO_CENTS = 17;
    // 0 -> 0 (保持 200 ms) -> ramp 到目標深度 (再花 400 ms 淡入)
    lfoDepth.gain.setValueAtTime(0, now);
    lfoDepth.gain.setValueAtTime(0, now + 0.2);
    lfoDepth.gain.linearRampToValueAtTime(VIBRATO_CENTS, now + 0.6);
 
    lfo.connect(lfoDepth);
    lfoDepth.connect(osc1.detune);
    lfoDepth.connect(osc2.detune);
    lfoDepth.connect(osc3.detune);
    lfoDepth.connect(osc4.detune);
 
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc4.start(now);
    lfo.start(now);
 
    activeVoice = {
      osc1, osc2, osc3, osc4,
      gain1, gain2, gain3, gain4,
      lowpass, bodyResonance, masterGain,
      lfo, lfoDepth,
    };
    activeFrequency = frequency;
    activeVolume = volume;
  }
 
  // === 換弓瞬間:filtered noise burst + 短 amplitude dip ===
  // 由外部 (main.js animate loop) 在 bowMotionTracker 偵測到方向反轉時呼叫。
  // 沒有正在發音時呼叫會 no-op。
  function triggerBowChange(options = {}) {
    if (!activeVoice || !audioContext) return;
 
    const {
      noiseDuration = 0.06,   // 60 ms,範圍建議 30~80 ms
      noiseLevel = 0.55,      // burst 峰值相對於當前 volume 的倍率
      bandpassFreq = 3000,    // 擦弦的「沙沙」主要在 2~4 kHz
      bandpassQ = 1.2,
      dipRatio = 0.4,         // dip 到當前音量的 40%
      dipDownMs = 12,
      dipUpMs = 70,
    } = options;
 
    const ctx = audioContext;
    const now = ctx.currentTime;
    const buffer = getNoiseBuffer(ctx);
 
    // --- amplitude dip ---
    // 把 masterGain 快速壓低再回升,製造「重新起音」的感覺
    const target = activeVolume;
    const dipLevel = Math.max(target * dipRatio, 0.0001);
 
    activeVoice.masterGain.gain.cancelScheduledValues(now);
    activeVoice.masterGain.gain.setValueAtTime(
      Math.max(activeVoice.masterGain.gain.value, 0.0001),
      now
    );
    activeVoice.masterGain.gain.linearRampToValueAtTime(
      dipLevel,
      now + dipDownMs / 1000
    );
    activeVoice.masterGain.gain.linearRampToValueAtTime(
      target,
      now + (dipDownMs + dipUpMs) / 1000
    );
 
    // --- noise burst ---
    // 重要:noise burst 直接接到 destination,不經過 masterGain
    // 不然 burst 自己也會被 dip 壓掉,就聽不到擦弦感了。
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    // 隨機 playbackRate + 隨機 buffer 起點 → 連續換弓不會聽起來像同樣本 loop
    noiseSrc.playbackRate.setValueAtTime(0.9 + Math.random() * 0.3, now);
 
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    // bandpass 中心頻率也加一點 jitter,每次擦弦的「顆粒」略不同
    const freqJitter = bandpassFreq * (0.85 + Math.random() * 0.3);
    bp.frequency.setValueAtTime(freqJitter, now);
    bp.Q.setValueAtTime(bandpassQ, now);
 
    const noiseGain = ctx.createGain();
    const peak = Math.max(target * noiseLevel, 0.0001);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(peak, now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);
 
    noiseSrc.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ctx.destination);
 
    const maxOffset = Math.max(0, buffer.duration - noiseDuration - 0.005);
    const startOffset = Math.random() * maxOffset;
    noiseSrc.start(now, startOffset);
    noiseSrc.stop(now + noiseDuration + 0.02);
  }
 
  function getState() {
    const ctx = ensureContext();
    return {
      unlocked,
      state: ctx.state,
      isPlaying: !!activeVoice,
      activeFrequency,
    };
  }
 
  return {
    unlock,
    startContinuousNote,
    stopContinuousNote,
    triggerBowChange,
    getState,
    // 暴露 audioContext 給 metronome 等其他 audio 模組共用,避免多個 context 互相 race
    getAudioContext: () => ensureContext(),
  };
}