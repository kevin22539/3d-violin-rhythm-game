/**
 * 倒數顯示 overlay (4-3-2-1)。畫面正中央顯示大數字,每拍切換,
 * 倒數結束呼叫 onComplete;期間呼叫 cancel() 會中斷並觸發 onCancel。
 *
 * 用法:
 *   const cd = createCountdown();
 *   cd.show(4, 600, () => melodyPlayer.start(...), () => console.log('cancelled'));
 *   cd.cancel();
 *   cd.isActive();
 */
export function createCountdown({ container = document.body } = {}) {
  // === DOM ===
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0;
    display: none;
    align-items: center; justify-content: center;
    pointer-events: none;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  `;

  const num = document.createElement('div');
  num.style.cssText = `
    font-size: 220px;
    font-weight: 800;
    color: #fff;
    text-shadow:
      0 0 30px rgba(255, 200, 100, 0.85),
      0 0 60px rgba(255, 180, 80, 0.5);
    transform: scale(1);
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    line-height: 1;
    user-select: none;
  `;
  overlay.appendChild(num);
  container.appendChild(overlay);

  // === State ===
  let timers = [];
  let onCompleteCb = null;
  let onCancelCb = null;

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function pop(value) {
    num.textContent = String(value);
    // scale up 然後落下,製造「彈出」感
    num.style.transform = 'scale(1.35)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        num.style.transform = 'scale(1)';
      });
    });
  }

  function show(beats, beatMs, onComplete, onCancel) {
    cancel(); // 確保前一輪結束(不會觸發舊的 onCancel,因為 cancel() 先清 cb)

    onCompleteCb = onComplete;
    onCancelCb = onCancel;
    overlay.style.display = 'flex';

    // 第一個數字立刻顯示(避免 setTimeout(0) 的微小 lag)
    pop(beats);

    // 後續每拍切換
    for (let i = 1; i < beats; i++) {
      timers.push(setTimeout(() => {
        pop(beats - i);
      }, i * beatMs));
    }

    // 倒數結束
    timers.push(setTimeout(() => {
      overlay.style.display = 'none';
      const cb = onCompleteCb;
      onCompleteCb = null;
      onCancelCb = null;
      timers = [];
      cb?.();
    }, beats * beatMs));
  }

  function cancel() {
    if (timers.length === 0 && !onCancelCb) return;
    clearTimers();
    overlay.style.display = 'none';
    const cb = onCancelCb;
    onCompleteCb = null;
    onCancelCb = null;
    cb?.();
  }

  function isActive() {
    return timers.length > 0;
  }

  function destroy() {
    cancel();
    overlay.remove();
  }

  return { show, cancel, isActive, destroy };
}