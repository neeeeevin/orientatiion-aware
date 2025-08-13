/**
 * @module js/features/easteregg
 * Listens for the Konami code to trigger a fun surprise.
 */
import { celebrate } from './confetti.js';

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let keySequence = [];

function keydownHandler(e) {
  keySequence.push(e.key);
  keySequence.splice(-konamiCode.length - 1, keySequence.length - konamiCode.length);
  if (keySequence.join('') === konamiCode.join('')) {
    celebrate('burst');
    console.log('Konami Activated!');
  }
}

export function initEasterEgg() {
  window.addEventListener('keydown', keydownHandler);
  return () => window.removeEventListener('keydown', keydownHandler);
}