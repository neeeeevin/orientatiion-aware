/**
 * @module js/app
 * Main application orchestrator. Handles initialization, mode switching,
 * and global UI state like toasts and themes.
 */
import { initOrientation, requestMotionPermission } from './core/orientation.js';
import { initShake } from './features/shake.js';
import { initEasterEgg } from './features/easteregg.js';
import * as Voice from './features/voice.js';

// --- DOM References ---
const appContainer = document.getElementById('app');
const toastElement = document.getElementById('toast');
const startOverlay = document.getElementById('start-overlay');
const startButton = document.getElementById('start-btn');
const voiceContainer = document.getElementById('voice-control-container');

// --- State ---
let currentModule = null;
let toastTimeoutId = null;

function showToast(message) {
  clearTimeout(toastTimeoutId);
  toastElement.textContent = message;
  toastElement.classList.add('show');
  toastTimeoutId = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2000);
}

async function handleModeChange(mode) {
  if (currentModule && typeof currentModule.unmount === 'function') {
    currentModule.unmount();
  }

  appContainer.innerHTML = '';
  const view = document.createElement('div');
  view.className = 'view';
  appContainer.appendChild(view);

  let modulePromise;
  let toastMessage = '';

  // FIX: Updated switch to handle four distinct modes
  switch (mode) {
    case 'landscape-primary': // Phone rotated left
      modulePromise = import('./modes/stopwatch.js');
      toastMessage = 'Landscape (Right-Side Up) → Stopwatch';
      break;
    case 'landscape-secondary': // Phone rotated right
      modulePromise = import('./modes/weather.js');
      toastMessage = 'Landscape (Left-Side Up) → Weather';
      break;
    case 'portrait-secondary': // Phone upside down
      modulePromise = import('./modes/timer.js');
      toastMessage = 'Upside Down → Timer';
      break;
    case 'portrait-primary': // Phone upright
    default:
      modulePromise = import('./modes/alarm.js');
      toastMessage = 'Portrait → Alarm';
      break;
  }

  try {
    // FIX: Simplified logic since we are always loading a single module now
    const newModule = await modulePromise;
    if (newModule && typeof newModule.mount === 'function') {
        newModule.mount(view);
        currentModule = newModule;
    }
    setTimeout(() => view.classList.add('active'), 50);
    showToast(toastMessage);
  } catch (error) {
    console.error("Failed to load module:", error);
    showToast("Error loading view.");
  }
}

function handleVoiceCommand(command) {
    // This is where you would integrate voice commands with module actions
    console.log('Voice command received:', command);
    showToast(`Voice command: ${command.intent}`);
}

async function startApp() {
  startOverlay.style.display = 'none';

  // Register the service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./pwa/sw.js') // Use relative path
      .then(reg => console.log('Service Worker registered.', reg))
      .catch(err => console.error('Service Worker registration failed:', err));
  }

  const permissionGranted = await requestMotionPermission();
  if (!permissionGranted) {
    showToast('Motion access denied. Orientation features may be limited.');
  }

  initOrientation(handleModeChange);
  initShake(() => showToast('Shake detected!'));
  initEasterEgg();
  Voice.mount(voiceContainer, handleVoiceCommand);
}

document.addEventListener('DOMContentLoaded', () => {
  startButton.addEventListener('click', startApp, { once: true });
});