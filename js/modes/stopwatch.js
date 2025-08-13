/**
 * @module js/modes/stopwatch
 * A high-precision stopwatch component.
 */
import { celebrate } from '../features/confetti.js';

let state = {};
let dom = {};
let containerEl = null;

const resetState = () => {
  state = {
    isActive: false,
    startTime: 0,
    timeElapsedBeforePause: 0,
    animationFrameId: null,
  };
};

const formatTime = (ms) => {
  const date = new Date(ms);
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
  return `${minutes}:${seconds}.${milliseconds}`;
};

const updateDisplay = () => {
  const elapsed = state.isActive ?
    (performance.now() - state.startTime) + state.timeElapsedBeforePause :
    state.timeElapsedBeforePause;
  dom.display.textContent = formatTime(elapsed);
};

const run = () => {
  if (!state.isActive) return;
  updateDisplay();
  state.animationFrameId = requestAnimationFrame(run);
};

const vibrate = (ms = 50) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};

const handleStartPause = () => {
  vibrate();
  state.isActive = !state.isActive;
  if (state.isActive) {
    state.startTime = performance.now();
    dom.startPauseButton.textContent = 'Pause';
    dom.lapButton.disabled = false;
    run();
  } else {
    state.timeElapsedBeforePause += performance.now() - state.startTime;
    dom.startPauseButton.textContent = 'Start';
    cancelAnimationFrame(state.animationFrameId);
    updateDisplay();
  }
};

const handleLap = () => {
  if (!state.isActive) return;
  vibrate();
  celebrate('rain');
  const lapTime = (performance.now() - state.startTime) + state.timeElapsedBeforePause;
  const li = document.createElement('li');
  li.textContent = formatTime(lapTime);
  dom.lapsList.prepend(li);
};

const handleReset = () => {
  vibrate();
  state.isActive = false;
  cancelAnimationFrame(state.animationFrameId);
  resetState();
  updateDisplay();
  dom.startPauseButton.textContent = 'Start';
  dom.lapButton.disabled = true;
  dom.lapsList.innerHTML = '';
};

export function mount(container) {
  if (!container) return;
  containerEl = container;

  containerEl.innerHTML = `
    <div class="container">
      <h3>Stopwatch</h3>
      <div class="big-digits" id="stopwatch-display">00:00.000</div>
      <div class="controls">
        <button id="sw-lap-btn" class="btn btn-secondary" disabled>Lap</button>
        <button id="sw-start-pause-btn" class="btn btn-primary">Start</button>
        <button id="sw-reset-btn" class="btn btn-danger">Reset</button>
      </div>
      <ul class="laps-list" id="stopwatch-laps-list"></ul>
    </div>
  `;

  dom = {
    display: containerEl.querySelector('#stopwatch-display'),
    startPauseButton: containerEl.querySelector('#sw-start-pause-btn'),
    lapButton: containerEl.querySelector('#sw-lap-btn'),
    resetButton: containerEl.querySelector('#sw-reset-btn'),
    lapsList: containerEl.querySelector('#stopwatch-laps-list'),
  };

  dom.startPauseButton.addEventListener('click', handleStartPause);
  dom.lapButton.addEventListener('click', handleLap);
  dom.resetButton.addEventListener('click', handleReset);
  
  resetState();
  updateDisplay();
}

export function unmount() {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  if (containerEl) containerEl.innerHTML = '';
  containerEl = null;
  dom = {};
}