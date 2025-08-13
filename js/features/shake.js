/**
 * @module js/features/shake
 * Detects a device shake gesture.
 */
const SHAKE_THRESHOLD = 15; // m/s^2
let last_x, last_y, last_z;
let lastUpdate = 0;
let onShakeCallback = () => {};

function deviceMotionHandler(event) {
  const { accelerationIncludingGravity } = event;
  const curTime = new Date().getTime();

  if ((curTime - lastUpdate) > 100) {
    const diffTime = curTime - lastUpdate;
    lastUpdate = curTime;

    const x = accelerationIncludingGravity.x;
    const y = accelerationIncludingGravity.y;
    const z = accelerationIncludingGravity.z;

    const speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;

    if (speed > SHAKE_THRESHOLD) {
      onShakeCallback();
    }

    last_x = x;
    last_y = y;
    last_z = z;
  }
}

export function initShake(onShake) {
  if (window.DeviceMotionEvent) {
    onShakeCallback = onShake;
    window.addEventListener('devicemotion', deviceMotionHandler, false);
    return () => window.removeEventListener('devicemotion', deviceMotionHandler);
  }
  return () => {}; // Return empty cleanup if not supported
}