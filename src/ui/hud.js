export function createHUD(statusElement) {
  function update({
    mode,
    bowString,
    keyString,
    noteName,
    moving,
    targetString,
    score,
    combo,
    hits,
    misses,
    preRollRemainingMs,
    finished,
  }) {
    let line1 = '';
    let line2 = '';
    let line3 = '';

    if (mode === 'free') {
      line1 =
        `Mode: Free Play | Bow String: ${bowString ?? 'none'} | Key String: ${keyString ?? '-'} | ` +
        `Bow: ${moving ? 'moving' : 'still'} | Note: ${noteName ?? '-'}`;
      line2 = `Index = 1   |   Middle = 2`;
      line3 = `Ring = 3   |   Pinky = 4`;
    } else if (finished) {
      line1 = `Mode: Game | Finished | Score: ${score} | Hits: ${hits} | Misses: ${misses}`;
      line2 = `Final Combo: ${combo} | Press Tab to switch mode.`;
    } else if (preRollRemainingMs > 0) {
      const sec = (preRollRemainingMs / 1000).toFixed(1);
      line1 = `Mode: Game | Starting in ${sec}s`;
      line2 = `Move bow to the target string and hold the matching key. Press Tab to switch mode.`;
    } else {
      line1 =
        `Mode: Game | Target: ${targetString ?? '-'} | Bow String: ${bowString ?? 'none'} | Key String: ${keyString ?? '-'} | ` +
        `Bow: ${moving ? 'moving' : 'still'} | Note: ${noteName ?? '-'}`;
      line2 =
        `Score: ${score} | Combo: ${combo} | Hits: ${hits} | Misses: ${misses} | Press Tab to switch mode.`;
    }

    statusElement.innerHTML = [line1, line2, line3].filter(Boolean).join('<br>');
  }

  return { update };
}