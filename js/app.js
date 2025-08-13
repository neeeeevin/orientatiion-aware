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

  switch (mode) {
    case 'landscape':
      modulePromise = Promise.all([
        import('./modes/stopwatch.js'),
        import('./modes/weather.js')
      ]);
      toastMessage = 'Landscape → Stopwatch & Weather';
      break;
    case 'portrait-inverted':
      modulePromise = import('./modes/timer.js');
      toastMessage = 'Upside Down → Timer';
      break;
    case 'portrait-upright':
    default:
      modulePromise = import('./modes/alarm.js');
      toastMessage = 'Portrait → Alarm';
      break;
  }

  try {
    const modules = await modulePromise;
    if (Array.isArray(modules)) {
      // Handle landscape mode with two modules
      const landscapeContainer = document.createElement('div');
      landscapeContainer.style.display = 'flex';
      landscapeContainer.style.width = '100%';
      const stopwatchView = document.createElement('div');
      const weatherView = document.createElement('div');
      stopwatchView.style.flex = '1';
      weatherView.style.flex = '1';
      landscapeContainer.append(stopwatchView, weatherView);
      view.append(landscapeContainer);
      modules[0].mount(stopwatchView);
      modules[1].mount(weatherView);
      currentModule = { unmount: () => { modules[0].unmount(); modules[1].unmount(); } };
    } else {
      // Handle single module modes
      modules.mount(view);
      currentModule = modules;
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
    navigator.serviceWorker.register('/pwa/sw.js')
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