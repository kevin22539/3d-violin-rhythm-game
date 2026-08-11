export function createKeyboardInput() {
  // 鍵位左到右對應琴弦左到右(低音 → 高音)
  const KEY_TO_STRING = {
    KeyA: 'G',  // 最左指 → 最左弦(低音)
    KeyS: 'D',
    KeyD: 'A',
    KeyF: 'E',  // 最右指 → 最右弦(高音)
  };

  let activeStringKey = null;

  window.addEventListener('keydown', (event) => {
    const stringName = KEY_TO_STRING[event.code];
    if (!stringName) return;

    activeStringKey = stringName;
  });

  window.addEventListener('keyup', (event) => {
    const stringName = KEY_TO_STRING[event.code];
    if (!stringName) return;

    if (activeStringKey === stringName) {
      activeStringKey = null;
    }
  });

  return {
    getActiveStringKey() {
      return activeStringKey;
    },
  };
}