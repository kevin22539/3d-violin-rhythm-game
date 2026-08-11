//Top-right floating panel of camera preset buttons//

export function createCameraPanel({
  entries,             // [{id,label} | {id,label,children:[...]}, ...]
  onSelect,            // (id) => void  — fired for leaves only
  initialActive = null,
}) {
  const panel = document.createElement('div');
  panel.id = 'camera-panel';

  const title = document.createElement('div');
  title.className = 'camera-panel-title';
  title.textContent = 'Camera';
  panel.appendChild(title);

  const buttonList = document.createElement('div');
  buttonList.className = 'camera-panel-buttons';
  panel.appendChild(buttonList);

  // leafId -> { button, parentId | null }
  const leafButtons = new Map();
  // parentId -> { button, childContainer, childIds: [] }
  const parentMeta  = new Map();

  let expandedParentId = null;

  function makeLeafButton(entry, parentId = null, isChild = false) {
    const btn = document.createElement('button');
    btn.className = 'camera-panel-button' + (isChild ? ' camera-panel-child' : '');
    btn.type = 'button';
    btn.textContent = entry.label;
    btn.dataset.id = entry.id;
    btn.addEventListener('click', () => {
      onSelect?.(entry.id);
      setActive(entry.id);
    });
    leafButtons.set(entry.id, { button: btn, parentId });
    return btn;
  }

  function makeParentButton(entry) {
    const btn = document.createElement('button');
    btn.className = 'camera-panel-button camera-panel-parent';
    btn.type = 'button';
    btn.dataset.id = entry.id;

    const labelEl = document.createElement('span');
    labelEl.textContent = entry.label;
    const caret = document.createElement('span');
    caret.className = 'camera-panel-caret';
    caret.textContent = '▾';
    btn.appendChild(labelEl);
    btn.appendChild(caret);

    btn.addEventListener('click', () => {
      const willOpen = expandedParentId !== entry.id;
      // Collapse any other open parent
      for (const [pid, meta] of parentMeta) {
        const open = willOpen && pid === entry.id;
        meta.childContainer.classList.toggle('open', open);
        meta.button.classList.toggle('expanded', open);
      }
      expandedParentId = willOpen ? entry.id : null;
    });

    const childContainer = document.createElement('div');
    childContainer.className = 'camera-panel-children';

    parentMeta.set(entry.id, {
      button: btn,
      childContainer,
      childIds: (entry.children || []).map((c) => c.id),
    });

    return { button: btn, childContainer };
  }

  for (const entry of entries) {
    if (entry.children && entry.children.length > 0) {
      const { button, childContainer } = makeParentButton(entry);
      buttonList.appendChild(button);
      for (const child of entry.children) {
        childContainer.appendChild(makeLeafButton(child, entry.id, true));
      }
      buttonList.appendChild(childContainer);
    } else {
      buttonList.appendChild(makeLeafButton(entry, null, false));
    }
  }

  document.body.appendChild(panel);

  function setActive(id) {
    // Clear all
    for (const { button } of leafButtons.values()) {
      button.classList.remove('active');
    }
    for (const { button } of parentMeta.values()) {
      button.classList.remove('active');
    }
    // Mark the matching leaf and (if any) its parent
    const leaf = leafButtons.get(id);
    if (!leaf) return;
    leaf.button.classList.add('active');
    if (leaf.parentId) {
      const parent = parentMeta.get(leaf.parentId);
      if (parent) {
        parent.button.classList.add('active');
        // Auto-open the parent when one of its children becomes active
        for (const [pid, meta] of parentMeta) {
          const open = pid === leaf.parentId;
          meta.childContainer.classList.toggle('open', open);
          meta.button.classList.toggle('expanded', open);
        }
        expandedParentId = leaf.parentId;
      }
    }
  }

  if (initialActive) setActive(initialActive);

  function destroy() {
    panel.remove();
  }

  return { setActive, destroy };
}