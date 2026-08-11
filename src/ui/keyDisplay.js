//Bottom-center overlay showing the four A/S/D/F keys and their corresponding fingers

const POSITIONS = [
  {
    id: 'first',
    label: '1st Position',
    keys: [
      { key: 'A', string: 'G' },  // leftmost = lowest pitch
      { key: 'S', string: 'D' },
      { key: 'D', string: 'A' },
      { key: 'F', string: 'E' },  // rightmost = highest pitch
    ],
  },
  {
    id: 'third',
    label: '3rd Position',
    // TODO: 第三把位的按鍵對應之後補在這裡。
    //       格式跟 first position 一樣:{ key: '<鍵盤鍵>', string: '<弦名>' }。
    //       如果第三把位想用不同的鍵 (例如 Q/W/E/R),直接改 key 欄位即可。
    keys: [],
    placeholder: 'Third position — key mapping coming soon.',
  },
];

export function createKeyDisplay() {
  const root = document.createElement('div');
  root.id = 'key-display';

  // Keys panel sits ABOVE the tabs (so the tabs anchor at the bottom and the
  // panel grows upward when revealed — tabs never move).
  const keysWrap = document.createElement('div');
  keysWrap.className = 'key-display-keys';
  root.appendChild(keysWrap);

  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'key-display-tabs';
  root.appendChild(tabsWrap);

  document.body.appendChild(root);

  // Build tab buttons once.
  const tabButtons = new Map(); // positionId -> button element
  for (const pos of POSITIONS) {
    const btn = document.createElement('button');
    btn.className = 'key-display-tab';
    btn.type = 'button';
    btn.textContent = pos.label;
    btn.addEventListener('click', () => {
      // Click active tab again → collapse. Click another tab → switch.
      const nextId = activePositionId === pos.id ? null : pos.id;
      setActivePosition(nextId);
    });
    tabsWrap.appendChild(btn);
    tabButtons.set(pos.id, btn);
  }

  // Per-render state: filled in by renderKeys when a position is active.
  let activePositionId = null;
  let items = new Map(); // stringName -> { wrap, keyEl, noteEl }
  let lastActive = null;
  let lastNote = null;

  function renderKeys(positionId) {
    // Rebuild from scratch — cheap, only happens on tab click.
    keysWrap.innerHTML = '';
    items.clear();
    lastActive = null;
    lastNote = null;

    if (!positionId) {
      keysWrap.classList.remove('open');
      return;
    }

    const pos = POSITIONS.find((p) => p.id === positionId);
    if (!pos) return;

    keysWrap.classList.add('open');

    // Empty `keys` array → show a "coming soon" placeholder.
    if (!pos.keys || pos.keys.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'key-display-placeholder';
      placeholder.textContent = pos.placeholder || 'No keys defined.';
      keysWrap.appendChild(placeholder);
      return;
    }

    for (const k of pos.keys) {
      const wrap = document.createElement('div');
      wrap.className = 'key-display-item';
      wrap.dataset.string = k.string;

      const keyEl = document.createElement('div');
      keyEl.className = 'key-display-key';
      keyEl.textContent = k.key;

      const stringEl = document.createElement('div');
      stringEl.className = 'key-display-string';
      stringEl.textContent = `${k.string} string`;

      const noteEl = document.createElement('div');
      noteEl.className = 'key-display-note';
      noteEl.textContent = '';

      wrap.appendChild(keyEl);
      wrap.appendChild(stringEl);
      wrap.appendChild(noteEl);
      keysWrap.appendChild(wrap);

      items.set(k.string, { wrap, keyEl, noteEl });
    }
  }

  function setActivePosition(id) {
    activePositionId = id;
    for (const [pid, btn] of tabButtons) {
      btn.classList.toggle('active', pid === id);
    }
    renderKeys(id);
  }

  // Start collapsed — nothing shown until the user clicks a tab.
  setActivePosition(null);

  /**
   * Called every frame by the animation loop. Cheap when nothing changed.
   * No-op when no position is selected (items map is empty).
   */
  function update(activeStringKey, currentNoteName) {
    if (items.size === 0) return; // collapsed — nothing to update
    if (activeStringKey === lastActive && currentNoteName === lastNote) return;
    lastActive = activeStringKey;
    lastNote = currentNoteName;

    for (const [stringName, refs] of items) {
      const isActive = stringName === activeStringKey;
      refs.wrap.classList.toggle('active', isActive);
      refs.noteEl.textContent = isActive && currentNoteName ? currentNoteName : '';
    }
  }

  function destroy() {
    root.remove();
  }

  return { update, destroy };
}