const STRING_TO_KEY = { G: 'A', D: 'S', A: 'D', E: 'F' };
const FINGER_LABEL  = { 1: 'Index', 2: 'Middle', 3: 'Ring', 4: 'Pinky' };

export function createNowPlayingKeys() {
  const root = document.createElement('div');
  root.id = 'now-playing-keys';

  function makeCard() {
    const wrap = document.createElement('div');
    wrap.className = 'now-playing-item hidden';
    const keyEl = document.createElement('div');
    keyEl.className = 'now-playing-key';
    const labelEl = document.createElement('div');
    labelEl.className = 'now-playing-label';
    wrap.appendChild(keyEl);
    wrap.appendChild(labelEl);
    return {
      wrap,
      show(key, label) {
        keyEl.textContent   = key;
        labelEl.textContent = label;
        wrap.classList.remove('hidden');
      },
      hide() { wrap.classList.add('hidden'); },
    };
  }

  const stringCard = makeCard();
  const fingerCard = makeCard();
  const noteEl = document.createElement('div');
  noteEl.className = 'now-playing-note';

  root.appendChild(stringCard.wrap);
  root.appendChild(fingerCard.wrap);
  root.appendChild(noteEl);
  document.body.appendChild(root);

  let lastString = null;
  let lastFinger = 0;
  let lastNote   = null;

  function update(stringName, finger, noteName) {
    // Cheap dirty-check — this is called every frame.
    if (stringName === lastString && finger === lastFinger && noteName === lastNote) return;
    lastString = stringName;
    lastFinger = finger;
    lastNote   = noteName;

    if (stringName && STRING_TO_KEY[stringName]) {
      stringCard.show(STRING_TO_KEY[stringName], `${stringName} string`);
    } else {
      stringCard.hide();
    }

    if (finger >= 1 && finger <= 4) {
      fingerCard.show(String(finger), FINGER_LABEL[finger] || '');
    } else {
      fingerCard.hide();
    }

    if (noteName && stringName) {
      noteEl.textContent = noteName;
      noteEl.classList.add('visible');
    } else {
      noteEl.textContent = '';
      noteEl.classList.remove('visible');
    }
  }

  function destroy() { root.remove(); }
  return { update, destroy };
}