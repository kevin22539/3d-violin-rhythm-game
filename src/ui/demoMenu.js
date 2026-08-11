/**
 * Demo 選曲選單。一頁式 UI:第一把位曲目 + 第三把位 placeholder。
 *
 * 速度選擇不在這裡 — 玩家先聽完 demo,結束後才透過 yourTurnPrompt 選速度。
 *
 * 用法:
 *   const menu = createDemoMenu({
 *     firstPositionSongs: [
 *       { hotkey: '1', name: 'Twinkle Twinkle Little Star', id: 'twinkle' },
 *       { hotkey: '2', name: 'Ode to Joy',                  id: 'odeToJoy' },
 *     ],
 *     onSelect: (id) => { ... },
 *     onClose:  ()  => { ... },
 *   });
 *
 * 鍵盤(只在 menu open 時聽):
 *   Esc / Space → 關閉(觸發 onClose)
 *   數字鍵      → 對應 hotkey 的曲目(觸發 onSelect)
 */
export function createDemoMenu({
  firstPositionSongs = [],
  onSelect = null,
  onClose = null,
  container = document.body,
} = {}) {
  // === DOM ===
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0;
    display: none;
    align-items: center; justify-content: center;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    color: white;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255, 200, 100, 0.35);
    border-radius: 14px;
    padding: 28px 36px 32px;
    min-width: 440px;
    max-width: 92vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset;
  `;
  overlay.appendChild(panel);

  // Header
  const title = document.createElement('h2');
  title.textContent = 'Choose a Demo Song';
  title.style.cssText = `
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.3px;
  `;
  panel.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = 'Press Esc or Space to close';
  subtitle.style.cssText = `
    font-size: 12px;
    opacity: 0.55;
    margin-bottom: 22px;
  `;
  panel.appendChild(subtitle);

  // === Section helpers ===
  function makeSectionHeader(label, dimmed = false) {
    const h = document.createElement('div');
    h.textContent = label;
    h.style.cssText = `
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.8px;
      opacity: ${dimmed ? 0.4 : 0.7};
      margin-bottom: 10px;
    `;
    return h;
  }

  function makeSongButton(song) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      width: 100%;
      padding: 14px 18px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: white;
      font-size: 15px;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
      text-align: left;
    `;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = song.name;
    btn.appendChild(nameSpan);

    const hotkeyBadge = document.createElement('span');
    hotkeyBadge.textContent = song.hotkey;
    hotkeyBadge.style.cssText = `
      background: rgba(255,200,100,0.18);
      border: 1px solid rgba(255,200,100,0.45);
      padding: 3px 10px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
      opacity: 0.9;
      min-width: 14px;
      text-align: center;
    `;
    btn.appendChild(hotkeyBadge);

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,200,100,0.14)';
      btn.style.borderColor = 'rgba(255,200,100,0.5)';
      btn.style.transform = 'translateX(4px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.06)';
      btn.style.borderColor = 'rgba(255,255,255,0.12)';
      btn.style.transform = 'translateX(0)';
    });
    btn.addEventListener('click', () => {
      onSelect?.(song.id);
    });
    return btn;
  }

  // === First Position section ===
  panel.appendChild(makeSectionHeader('FIRST POSITION'));
  const firstList = document.createElement('div');
  firstList.style.cssText = `
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px;
  `;
  for (const song of firstPositionSongs) {
    firstList.appendChild(makeSongButton(song));
  }
  panel.appendChild(firstList);

  // === Third Position section (placeholder) ===
  panel.appendChild(makeSectionHeader('THIRD POSITION', true));
  const thirdPlaceholder = document.createElement('div');
  thirdPlaceholder.textContent = 'Coming soon...';
  thirdPlaceholder.style.cssText = `
    padding: 14px 18px;
    background: rgba(255,255,255,0.03);
    border: 1px dashed rgba(255,255,255,0.18);
    border-radius: 8px;
    opacity: 0.5;
    font-size: 14px;
    font-style: italic;
  `;
  panel.appendChild(thirdPlaceholder);

  container.appendChild(overlay);

  // === State + keyboard ===
  let opened = false;

  function handleKeydown(event) {
    if (!opened) return;

    if (event.code === 'Escape' || event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }

    // 數字鍵 hotkey
    const song = firstPositionSongs.find((s) => s.hotkey === event.key);
    if (song) {
      event.preventDefault();
      event.stopPropagation();
      onSelect?.(song.id);
    }
  }

  // capture phase 確保比 main.js 的 Space handler 先收到事件
  window.addEventListener('keydown', handleKeydown, true);

  // === API ===
  function open() {
    if (opened) return;
    opened = true;
    overlay.style.display = 'flex';
  }

  function close() {
    if (!opened) return;
    opened = false;
    overlay.style.display = 'none';
    onClose?.();
  }

  function toggle() {
    if (opened) close();
    else open();
  }

  function isOpen() {
    return opened;
  }

  function destroy() {
    window.removeEventListener('keydown', handleKeydown, true);
    overlay.remove();
  }

  return { open, close, toggle, isOpen, destroy };
}