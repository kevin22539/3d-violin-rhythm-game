export function createMouseInput(domElement) {
  const state = {
    x: 0,
    y: 0,
    isPointerDown: false,
    isBowDragging: false,

    updateFromEvent(event) {
      const rect = domElement.getBoundingClientRect();

      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      state.x = px * 2 - 1;
      state.y = -(py * 2 - 1);
    },
  };

  domElement.addEventListener('pointermove', (event) => {
    state.updateFromEvent(event);
  });

  domElement.addEventListener('pointerdown', (event) => {
    state.updateFromEvent(event);
    state.isPointerDown = true;
  });

  window.addEventListener('pointerup', () => {
    state.isPointerDown = false;
    state.isBowDragging = false;
  });

  return state;
}