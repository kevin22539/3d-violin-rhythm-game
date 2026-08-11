export function createHUD(statusElement) {
    function update({
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
  
      if (finished) {
        line1 = `Finished | Score: ${score} | Hits: ${hits} | Misses: ${misses}`;
        line2 = `Final Combo: ${combo}`;
      } else if (preRollRemainingMs > 0) {
        const sec = (preRollRemainingMs / 1000).toFixed(1);
        line1 = `Starting in ${sec}s`;
        line2 = `Move bow to the target string and hold A/S/D/F`;
      } else {
        line1 =
          `Target: ${targetString ?? '-'} | Bow String: ${bowString ?? 'none'} | Key: ${keyString ?? '-'} | ` +
          `Bow: ${moving ? 'moving' : 'still'} | Note: ${noteName ?? '-'}`;
  
        line2 =
          `Score: ${score} | Combo: ${combo} | Hits: ${hits} | Misses: ${misses} | ` +
          `Hold Shift and drag the bow handle. Hold A/S/D/F for G/D/A/E.`;
      }
  
      statusElement.innerHTML = `${line1}<br>${line2}`;
    }
  
    return {
      update,
    };
  }