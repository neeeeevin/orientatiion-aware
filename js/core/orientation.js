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
 * @returns {string} The determined mode: "portrait-primary", "portrait-secondary", "landscape-primary", or "landscape-secondary".
 */
const determineMode = () => {
  // The modern screen.orientation API is the only one that can reliably
  // distinguish all four orientations.
  if (window.screen && window.screen.orientation && window.screen.orientation.type) {
    return window.screen.orientation.type;
  }

  // Fallbacks cannot distinguish between primary/secondary orientations.
  if (window.matchMedia) {
    if (window.matchMedia('(orientation: landscape)').matches) {
      return 'landscape-primary'; // Default to primary landscape
    }
    return 'portrait-primary'; // Default to primary portrait
  }
  
  return window.innerHeight > window.innerWidth ? 'portrait-primary' : 'landscape-primary';
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
  // Check if DeviceMotionEvent exists before using it.
  if (typeof DeviceMotionEvent === 'undefined' || typeof DeviceMotionEvent.requestPermission !== 'function') {
    return true; // Not required or not supported on this device/context.
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