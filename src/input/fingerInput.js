// 第一把位的左手指法 input。
//
// 鍵盤 1 / 2 / 3 / 4(主鍵盤與 Numpad 都吃)= 食指 / 中指 / 無名指 / 小指。
// 沒按到任何數字 → 0(空弦)。
// 多指同時按下時,回傳最高的那一指(對應真實小提琴行為:最高指實際停弦)。

const FINGER_CODES = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
  Digit4: 4,
  Numpad1: 1,
  Numpad2: 2,
  Numpad3: 3,
  Numpad4: 4,
};

export function createFingerInput() {
  const pressed = new Set();

  function onKeyDown(event) {
    const finger = FINGER_CODES[event.code];
    if (finger != null) pressed.add(finger);
  }

  function onKeyUp(event) {
    const finger = FINGER_CODES[event.code];
    if (finger != null) pressed.delete(finger);
  }

  function onBlur() {
    // 視窗失焦時當作所有指都鬆開,避免「按著切換 tab → 回來還在按」的鬼狀態
    pressed.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  /**
   * @returns {number} 0 (空弦) 或 1..4
   */
  function getActiveFinger() {
    if (pressed.size === 0) return 0;
    let max = 0;
    for (const f of pressed) {
      if (f > max) max = f;
    }
    return max;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    pressed.clear();
  }

  return { getActiveFinger, dispose };
}