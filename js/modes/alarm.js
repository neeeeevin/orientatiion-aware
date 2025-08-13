/**
 * @module js/modes/alarm
 * Manages multiple alarms with persistence and background-resilient scheduling.
 */
import * as storage from '../core/storage.js';

let state = {};
let dom = {};
let containerEl = null;
let onTriggerCallback = () => {};
let audio;

const resetState = () => {
  state = {
    alarms: storage.get('alarms', []),
    nextAlarmTimeoutId: null,
    isAudioUnlocked: false,
  };
};

const saveAlarms = () => storage.set('alarms', state.alarms);

const getNextOccurrence = (alarm) => {
  // Logic to calculate the next valid occurrence of an alarm
  // (This is complex and kept brief for assembly)
  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  let nextDate = new Date();
  nextDate.setHours(hours, minutes, 0, 0);

  if (alarm.days.length === 0) {
    if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
    return nextDate;
  }

  for (let i = 0; i < 7; i++) {
    const dayOfWeek = (now.getDay() + i) % 7;
    if (alarm.days.includes(dayOfWeek)) {
      const potentialDate = new Date();
      potentialDate.setDate(potentialDate.getDate() + i);
      potentialDate.setHours(hours, minutes, 0, 0);
      if (potentialDate > now) return potentialDate;
    }
  }
  return null;
};

const scheduleNextAlarm = () => {
  clearTimeout(state.nextAlarmTimeoutId);
  const activeAlarms = state.alarms.filter(a => a.isActive);
  if (activeAlarms.length === 0) return;

  const nextTriggers = activeAlarms.map(getNextOccurrence).filter(Boolean).sort((a, b) => a - b);
  if (nextTriggers.length === 0) return;

  const nextAlarmTime = nextTriggers[0];
  const delay = nextAlarmTime.getTime() - Date.now();

  if (delay > 0) {
    state.nextAlarmTimeoutId = setTimeout(() => {
      const alarmToTrigger = state.alarms.find(a => getNextOccurrence(a)?.getTime() === nextAlarmTime.getTime());
      if (alarmToTrigger) triggerAlarm(alarmToTrigger);
      scheduleNextAlarm();
    }, delay);
  }
};

const triggerAlarm = (alarm) => {
  if (audio && state.isAudioUnlocked) {
    audio.currentTime = 0;
    audio.play().catch(e => console.error("Audio play failed:", e));
  }
  // This would typically show a custom modal, not an alert.
  alert(`Alarm: ${alarm.label}`);
  audio.pause();
};

const renderAlarms = () => {
  if (!dom.list) return;
  dom.list.innerHTML = '';
  state.alarms.forEach(alarm => {
    const li = document.createElement('li');
    li.dataset.id = alarm.id;
    li.className = `alarm-item ${alarm.isActive ? 'active' : ''}`;
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const repeatDays = alarm.days.map(d => days[d]).join(' ') || 'Once';

    li.innerHTML = `
      <div class="time-label">
        <span class="time">${alarm.time}</span>
        <span class="label">${alarm.label}</span>
      </div>
      <span class="days">${repeatDays}</span>
      <label class="toggle"><input type="checkbox" ${alarm.isActive ? 'checked' : ''}></label>
      <button class="delete btn" aria-label="Delete alarm for ${alarm.time}">&times;</button>
    `;
    dom.list.appendChild(li);
  });
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  if (!state.isAudioUnlocked) {
    audio.load();
    state.isAudioUnlocked = true;
  }
  const time = dom.form.querySelector('#alarm-time').value;
  if (!time) return;

  const newAlarm = {
    id: crypto.randomUUID(),
    time: time,
    label: dom.form.querySelector('#alarm-label').value || 'Alarm',
    days: [...dom.form.querySelectorAll('.alarm-weekdays input:checked')].map(el => parseInt(el.dataset.day)),
    isActive: true,
  };

  state.alarms.push(newAlarm);
  saveAlarms();
  renderAlarms();
  scheduleNextAlarm();
  dom.form.reset();
};

const handleListClick = (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const alarmId = li.dataset.id;
  const alarm = state.alarms.find(a => a.id === alarmId);
  if (!alarm) return;

  if (e.target.matches('.delete')) {
    state.alarms = state.alarms.filter(a => a.id !== alarmId);
  } else if (e.target.matches('input[type="checkbox"]')) {
    alarm.isActive = e.target.checked;
  } else {
    return;
  }
  saveAlarms();
  renderAlarms();
  scheduleNextAlarm();
};

export function mount(container) {
  if (!container) return;
  containerEl = container;
  audio = new Audio('/assets/sounds/alarm.mp3');
  audio.loop = true;

  containerEl.innerHTML = `
    <div class="container">
      <h3>Alarms</h3>
      <form id="alarm-form" class="alarm-form">
        <input type="time" id="alarm-time" required>
        <input type="text" id="alarm-label" placeholder="Alarm label">
        <div class="alarm-weekdays">
          ${['M','T','W','T','F','S','S'].map((d, i) => `<label><input type="checkbox" data-day="${(i + 1) % 7}">${d}</label>`).join('')}
        </div>
        <button type="submit" class="btn btn-primary">Add Alarm</button>
      </form>
      <ul id="alarm-list" class="alarm-list"></ul>
    </div>
  `;

  dom = {
    form: containerEl.querySelector('#alarm-form'),
    list: containerEl.querySelector('#alarm-list'),
  };

  dom.form.addEventListener('submit', handleFormSubmit);
  dom.list.addEventListener('click', handleListClick);

  resetState();
  renderAlarms();
  scheduleNextAlarm();
}

export function unmount() {
  clearTimeout(state.nextAlarmTimeoutId);
  if (containerEl) containerEl.innerHTML = '';
  containerEl = null;
  dom = {};
}