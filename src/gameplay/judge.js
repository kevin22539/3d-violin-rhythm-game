export function createJudge() {
    const resolvedTargetIndexes = new Set();
    let lastTargetIndex = null;
  
    function update({ target, activeString, keyString, movingRecently }) {
      const events = [];
  
      const currentTargetIndex = target ? target.index : null;
  
      // 前一個 target 結束但尚未命中 => miss
      if (
        lastTargetIndex !== null &&
        currentTargetIndex !== lastTargetIndex &&
        !resolvedTargetIndexes.has(lastTargetIndex)
      ) {
        resolvedTargetIndexes.add(lastTargetIndex);
        events.push({
          type: 'miss',
          targetIndex: lastTargetIndex,
        });
      }
  
      if (
        target &&
        target.index >= 0 &&
        !resolvedTargetIndexes.has(target.index)
      ) {
        const isCorrect =
          activeString === target.string &&
          keyString === target.string &&
          movingRecently;
  
        if (isCorrect) {
          resolvedTargetIndexes.add(target.index);
          events.push({
            type: 'hit',
            targetIndex: target.index,
            string: target.string,
          });
        }
      }
  
      lastTargetIndex = currentTargetIndex;
      return events;
    }
  
    return {
      update,
    };
  }