export function createNoteChart(sequence = null) {
    const defaultSequence = [
      { string: 'G', durationMs: 2200 },
      { string: 'D', durationMs: 2200 },
      { string: 'A', durationMs: 2200 },
      { string: 'E', durationMs: 2200 },
      { string: 'G', durationMs: 1800 },
      { string: 'A', durationMs: 1800 },
      { string: 'D', durationMs: 1800 },
      { string: 'E', durationMs: 1800 },
    ];
  
    const chart = sequence ?? defaultSequence;
  
    let startTimeMs = 0;
    let started = false;
  
    function start(nowMs = performance.now(), leadInMs = 1200) {
      startTimeMs = nowMs + leadInMs;
      started = true;
    }
  
    function getCurrentTarget(nowMs = performance.now()) {
      if (!started) return null;
  
      const elapsed = nowMs - startTimeMs;
      if (elapsed < 0) {
        return {
          index: -1,
          string: null,
          startTimeMs,
          endTimeMs: startTimeMs,
          progress: 0,
          preRoll: true,
          remainingMs: -elapsed,
        };
      }
  
      let t = 0;
      for (let i = 0; i < chart.length; i++) {
        const item = chart[i];
        const end = t + item.durationMs;
  
        if (elapsed >= t && elapsed < end) {
          return {
            index: i,
            string: item.string,
            startTimeMs: startTimeMs + t,
            endTimeMs: startTimeMs + end,
            progress: (elapsed - t) / item.durationMs,
            preRoll: false,
            remainingMs: end - elapsed,
          };
        }
  
        t = end;
      }
  
      return null;
    }
  
    function isFinished(nowMs = performance.now()) {
      return started && getCurrentTarget(nowMs) === null;
    }
  
    return {
      start,
      getCurrentTarget,
      isFinished,
    };
  }