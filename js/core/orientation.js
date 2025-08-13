/**
 * @module js/core/orientation
 * Handles device orientation detection, including modern APIs, fallbacks,
 * and iOS permission flow. It debounces events to emit a stable mode.
 */

// Module-level state
let currentMode = null;
let onModeChangeCallback = () => {};

/**
 * A simple debounce utility.
 * @param {Function} func The function to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay) => {
  let debounceTimer;
  return (...args) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

/**
 * Determines the current orientation mode using the best available browser API.
 * @returns {string} The determined mode: "portrait-upright", "portrait-inverted", or "landscape".
 */
const determineMode = () => {
  if (window.screen && window.screen.orientation && window.screen.orientation.type) {
    const { type } = window.screen.orientation;
    if (type.startsWith('landscape')) return 'landscape';
    if (type === 'portrait-secondary') return 'portrait-inverted';
    return 'portrait-upright';
  }
  if (window.matchMedia) {
    if (window.matchMedia('(orientation: landscape)').matches) return 'landscape';
    return 'portrait-upright';
  }
  return window.innerHeight > window.innerWidth ? 'portrait-upright' : 'landscape';
};


/**
 * Detects the current mode and, if it has changed, updates the state
 * and fires the callback.
 */
const handleOrientationChange = () => {
  const newMode = determineMode();
  if (newMode && newMode !== currentMode) {
    currentMode = newMode;
    onModeChangeCallback(currentMode);
  }
};

/**
 * Handles the iOS 13+ permission flow for accessing motion events.
 * This must be called from within a user gesture (e.g., a button click).
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted, false otherwise.
 */
export async function requestMotionPermission() {
  if (typeof DeviceMotionEvent.requestPermission !== 'function') {
    return true; // Not required on this device
  }
  try {
    const permissionState = await DeviceMotionEvent.requestPermission();
    return permissionState === 'granted';
  } catch (error) {
    console.error('Error requesting motion permission:', error);
    return false;
  }
}

/**
 * Initializes the orientation detection listeners.
 * Returns a cleanup function to remove the listeners.
 * @param {Function} onModeChange A callback function that receives the new mode string on change.
 * @returns {Function} A cleanup function to call when the listeners are no longer needed.
 */
export function initOrientation(onModeChange) {
  if (typeof onModeChange === 'function') {
    onModeChangeCallback = onModeChange;
  }

  const handler = debounce(handleOrientationChange, 150);
  const listenerTarget = window.screen && window.screen.orientation ? window.screen.orientation : window;
  const eventName = window.screen && window.screen.orientation ? 'change' : 'resize';

  listenerTarget.addEventListener(eventName, handler);

  // Set initial mode
  currentMode = determineMode();
  onModeChangeCallback(currentMode);

  // Return a cleanup function
  return () => {
    listenerTarget.removeEventListener(eventName, handler);
  };
}