export function createScoreSystem() {
    let score = 0;
    let combo = 0;
    let hits = 0;
    let misses = 0;
  
    function registerHit() {
      hits += 1;
      combo += 1;
      score += 100 + Math.max(0, combo - 1) * 10;
    }
  
    function registerMiss() {
      misses += 1;
      combo = 0;
    }
  
    function getState() {
      return {
        score,
        combo,
        hits,
        misses,
      };
    }
  
    return {
      registerHit,
      registerMiss,
      getState,
    };
  }