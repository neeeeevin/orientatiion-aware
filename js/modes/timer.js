/**
 * @module js/modes/timer
 * A high-precision countdown timer with presets and visual progress.
 */
import * as storage from '../core/storage.js';
import { celebrate } from '../features/confetti.js';

const STROKE_WIDTH = 8;
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

let state = {};
let dom = {};
let containerEl = null;
let audio;

const resetState = () => {
  state = {
    isActive: false,
    endTime: null,
    durationMs: storage.get('timer_last_duration', 60000),
    animationFrameId: null,
    lastRenderedTime: '',
  };
};

const formatTime = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const updateDisplay = (ms) => {
  const newTime = formatTime(ms);
  if (newTime !== state.lastRenderedTime) {
    dom.display.textContent = newTime;
    state.lastRenderedTime = newTime;
  }
  const percent = (state.durationMs - ms) / state.durationMs;
  const offset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, percent)));
  dom.progressRing.style.strokeDashoffset = offset;
};

const handleCompletion = () => {
  if (audio) audio.play().catch(e => console.error(e));
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  celebrate('burst');
  resetTimer();
};

const run = () => {
  const remaining = state.endTime - Date.now();
  if (remaining <= 0) {
    updateDisplay(0);
    handleCompletion();
    return;
  }
  updateDisplay(remaining);
  state.animationFrameId = requestAnimationFrame(run);
};

const startTimer = () => {
  state.isActive = true;
  state.endTime = Date.now() + state.durationMs;
  dom.startPauseButton.textContent = 'Pause';
  run();
};

const pauseTimer = () => {
  state.isActive = false;
  cancelAnimationFrame(state.animationFrameId);
  dom.startPauseButton.textContent = 'Start';
};

const resetTimer = () => {
  state.isActive = false;
  state.endTime = null;
  cancelAnimationFrame(state.animationFrameId);
  updateDisplay(state.durationMs);
  dom.startPauseButton.textContent = 'Start';
};

export function mount(container) {
  if (!container) return;
  containerEl = container;
  audio = new Audio('/assets/sounds/alarm.mp3');

  containerEl.innerHTML = `
    <div class="container">
      <h3>Timer</h3>
      <div class="progress-ring-container">
        <svg class="progress-ring-svg" width="200" height="200" viewBox="0 0 200 200">
          <circle class="progress-ring-bg" cx="100" cy="100" r="${RADIUS}" stroke-width="${STROKE_WIDTH}" />
          <circle id="timer-progress-ring" class="progress-ring-fg" cx="100" cy="100" r="${RADIUS}" stroke-width="${STROKE_WIDTH}" />
        </svg>
        <div id="timer-display" class="big-digits">00:00</div>
      </div>
      <div class="timer-presets">
        <button data-ms="60000" class="btn btn-secondary">1m</button>
        <button data-ms="300000" class="btn btn-secondary">5m</button>
        <button data-ms="600000" class="btn btn-secondary">10m</button>
      </div>
      <div class="controls">
        <button id="timer-start-pause-btn" class="btn btn-primary">Start</button>
        <button id="timer-reset-btn" class="btn btn-danger">Reset</button>
      </div>
    </div>
  `;

  dom = {
    display: containerEl.querySelector('#timer-display'),
    progressRing: containerEl.querySelector('#timer-progress-ring'),
    startPauseButton: containerEl.querySelector('#timer-start-pause-btn'),
    resetButton: containerEl.querySelector('#timer-reset-btn'),
  };

  dom.progressRing.style.strokeDasharray = CIRCUMFERENCE;
  dom.startPauseButton.addEventListener('click', () => state.isActive ? pauseTimer() : startTimer());
  dom.resetButton.addEventListener('click', resetTimer);
  containerEl.querySelector('.timer-presets').addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && !state.isActive) {
      state.durationMs = parseInt(e.target.dataset.ms, 10);
      storage.set('timer_last_duration', state.durationMs);
      updateDisplay(state.durationMs);
    }
  });

  resetState();
  updateDisplay(state.durationMs);
}

export function unmount() {
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  if (containerEl) containerEl.innerHTML = '';
}