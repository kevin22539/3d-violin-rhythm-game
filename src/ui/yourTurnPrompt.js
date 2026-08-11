/**
 * "Your Turn!" 大字提示 + 速度選擇 overlay。
 * 在 demo 演奏結束、玩家挑戰開始前出現。
 *
 * 用法:
 *   const prompt = createYourTurnPrompt();
 *   prompt.show({
 *     onSelectSpeed: (speed) => {...},   // speed: 1.0 (normal) 或 0.5 (slow)
 *     onCancel:      ()      => {...},   // 玩家按 Esc / Space 取消
 *   });
 *   prompt.hide();
 *   prompt.isOpen();
 *
 * 鍵盤(只在 open 時聽,capture phase):
 *   1 → Normal speed
 *   2 → Slow speed
 *   Esc → cancel
 *   (Space 不在這裡處理,讓 main.js 的 Space handler 統一接管「取消當前階段」)
 */
export function createYourTurnPrompt({ container = document.body } = {}) {
  // === DOM ===
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0;
    display: none;
    align-items: center; justify-content: center;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: white;
  `;

  // 進場動畫容器(整個 panel 一起 scale + fade-in)
  const panel = document.createElement('div');
  panel.style.cssText = `
    display: flex; flex-direction: column; align-items: center;
    gap: 28px;
    transform: scale(0.92);
    opacity: 0;
    transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.4s ease;
  `;
  overlay.appendChild(panel);

  // 大標題 "Your Turn!"(漸層金 + 光暈)
  const bigTitle = document.createElement('div');
  bigTitle.textContent = 'Your Turn!';
  bigTitle.style.cssText = `
    font-size: 96px;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, #ffd47a 0%, #ffaa3d 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 30px rgba(255, 180, 80, 0.5));
    line-height: 1;
    user-select: none;
  `;
  panel.appendChild(bigTitle);

  // 副標
  const subtitle = document.createElement('div');
  subtitle.textContent = 'Choose your speed';
  subtitle.style.cssText = `
    font-size: 18px;
    opacity: 0.75;
    letter-spacing: 0.5px;
    margin-top: -8px;
  `;
  panel.appendChild(subtitle);

  // 按鈕列
  const buttonsRow = document.createElement('div');
  buttonsRow.style.cssText = `
    display: flex; gap: 18px; margin-top: 8px;
  `;

  const speedOptions = [
    { hotkey: '1', label: 'Normal', sublabel: '1.0× speed',    value: 1.0 },
    { hotkey: '2', label: 'Easy',   sublabel: '0.5× — slower', value: 0.5 },
  ];

  // 當前 callbacks(每次 show() 時更新)
  let onSelectSpeedCb = null;
  let onCancelCb = null;

  function makeSpeedButton(opt) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 22px 36px;
      background: rgba(255, 255, 255, 0.07);
      border: 2px solid rgba(255, 255, 255, 0.18);
      border-radius: 14px;
      color: white;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
      min-width: 180px;
    `;

    const main = document.createElement('span');
    main.textContent = opt.label;
    main.style.cssText = 'font-size: 24px; font-weight: 700;';
    btn.appendChild(main);

    const sub = document.createElement('span');
    sub.textContent = opt.sublabel;
    sub.style.cssText = 'font-size: 13px; opacity: 0.65; margin-top: 2px;';
    btn.appendChild(sub);

    const hotkeyBadge = document.createElement('span');
    hotkeyBadge.textContent = `Press ${opt.hotkey}`;
    hotkeyBadge.style.cssText = `
      margin-top: 8px;
      padding: 3px 10px;
      background: rgba(255, 200, 100, 0.16);
      border: 1px solid rgba(255, 200, 100, 0.4);
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.8px;
      opacity: 0.85;
    `;
    btn.appendChild(hotkeyBadge);

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255, 200, 100, 0.16)';
      btn.style.borderColor = 'rgba(255, 200, 100, 0.6)';
      btn.style.transform = 'translateY(-3px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.07)';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.18)';
      btn.style.transform = 'translateY(0)';
    });
    btn.addEventListener('click', () => {
      selectSpeed(opt.value);
    });
    return btn;
  }

  for (const opt of speedOptions) {
    buttonsRow.appendChild(makeSpeedButton(opt));
  }
  panel.appendChild(buttonsRow);

  // 底部 hint
  const hint = document.createElement('div');
  hint.textContent = 'Press Esc or Space to skip';
  hint.style.cssText = `
    font-size: 12px;
    opacity: 0.4;
    margin-top: 12px;
    letter-spacing: 0.6px;
  `;
  panel.appendChild(hint);

  container.appendChild(overlay);

  // === State + keyboard ===
  let opened = false;

  function selectSpeed(value) {
    if (!opened) return;
    const cb = onSelectSpeedCb;
    hide();
    cb?.(value);
  }

  function handleKeydown(event) {
    if (!opened) return;

    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancel();
      return;
    }

    const opt = speedOptions.find((o) => o.hotkey === event.key);
    if (opt) {
      event.preventDefault();
      event.stopPropagation();
      selectSpeed(opt.value);
    }
    // Space:不處理,讓 main.js 的 Space handler 統一接管「universal cancel」
  }

  window.addEventListener('keydown', handleKeydown, true);

  // === API ===
  function show({ onSelectSpeed = null, onCancel = null } = {}) {
    if (opened) return;
    opened = true;
    onSelectSpeedCb = onSelectSpeed;
    onCancelCb = onCancel;

    overlay.style.display = 'flex';
    // 觸發進場動畫:先進 DOM,下一幀才改 transform/opacity 才有 transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.transform = 'scale(1)';
        panel.style.opacity = '1';
      });
    });
  }

  function hide() {
    if (!opened) return;
    opened = false;
    overlay.style.display = 'none';
    panel.style.transform = 'scale(0.92)';
    panel.style.opacity = '0';
    onSelectSpeedCb = null;
    onCancelCb = null;
  }

  function cancel() {
    if (!opened) return;
    const cb = onCancelCb;
    hide();
    cb?.();
  }

  function isOpen() {
    return opened;
  }

  function destroy() {
    window.removeEventListener('keydown', handleKeydown, true);
    overlay.remove();
  }

  return { show, hide, cancel, isOpen, destroy };
}