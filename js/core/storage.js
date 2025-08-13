/**
 * @module js/core/storage
 * A simple wrapper for localStorage to handle JSON serialization.
 */

/**
 * Gets an item from localStorage and parses it as JSON.
 * @param {string} key The key of the item to retrieve.
 * @param {*} defaultValue The default value to return if the key doesn't exist.
 * @returns {*} The parsed item or the default value.
 */
export function get(key, defaultValue = null) {
  const value = localStorage.getItem(key);
  try {
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Sets an item in localStorage, serializing it as JSON.
 * @param {string} key The key of the item to set.
 * @param {*} value The value to set.
 */
export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error setting localStorage key "${key}":`, e);
  }
}

/**
 * Removes an item from localStorage.
 * @param {string} key The key of the item to remove.
 */
export function remove(key) {
  localStorage.removeItem(key);
}