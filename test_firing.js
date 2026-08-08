// Test script to check if game exists
if (typeof window !== 'undefined') {
  console.log('Window is defined');
  setTimeout(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      console.log('Canvas found');
      // Try to dispatch pointer events manually
      const downEvent = new PointerEvent('pointerdown', {
        button: 0,
        bubbles: true,
        cancelable: true,
        view: window
      });
      canvas.dispatchEvent(downEvent);
      console.log('Pointer down dispatched');
    }
  }, 100);
}
