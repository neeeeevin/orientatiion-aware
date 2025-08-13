/**
 * @module js/features/voice
 * Handles voice command recognition and TTS feedback.
 */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let state = { isSupported: !!SpeechRecognition, isListening: false };
let dom = { micButton: null, transcriptDisplay: null };
let onCommandCallback = () => {};

const commands = [
  { intent: 'setAlarm', regex: /set alarm for (.+)/i, valueIndex: 1 },
  { intent: 'startStopwatch', regex: /start stopwatch/i },
  { intent: 'stopStopwatch', regex: /stop stopwatch/i },
  { intent: 'startTimer', regex: /start timer (?:for )?(\d+)\s*minute(s)?/i, valueIndex: 1 },
  { intent: 'showWeather', regex: /show weather/i },
];

const parseCommand = (transcript) => {
  for (const cmd of commands) {
    const match = transcript.match(cmd.regex);
    if (match) return { intent: cmd.intent, value: cmd.valueIndex ? match[cmd.valueIndex].trim() : null };
  }
  return null;
};

const speak = (text) => {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};

const startListening = () => {
  if (!state.isSupported || state.isListening) return;
  state.isListening = true;
  dom.micButton.classList.add('listening');
  dom.transcriptDisplay.classList.add('visible');
  recognition.start();
};

const stopListening = () => {
  if (!state.isSupported || !state.isListening) return;
  state.isListening = false;
  dom.micButton.classList.remove('listening');
  dom.transcriptDisplay.classList.remove('visible');
  recognition.stop();
};

export function mount(container, onCommand) {
  if (!container) return;
  onCommandCallback = onCommand;
  container.innerHTML = `
    <div id="voice-transcript" aria-live="assertive"></div>
    <button id="mic-btn" class="btn" title="Voice Control" aria-label="Activate Voice Control" disabled>🎤</button>
  `;
  dom = {
    micButton: container.querySelector('#mic-btn'),
    transcriptDisplay: container.querySelector('#voice-transcript'),
  };

  if (!state.isSupported) return;
  dom.micButton.disabled = false;
  dom.micButton.addEventListener('click', () => state.isListening ? stopListening() : startListening());

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    dom.transcriptDisplay.textContent = transcript;
    const command = parseCommand(transcript);
    if (command) {
      speak(`Okay, ${transcript}`);
      onCommandCallback(command);
    }
  };
  recognition.onerror = (event) => console.error('Voice recognition error:', event.error);
  recognition.onend = () => stopListening();
}

export function unmount(container) {
  if (recognition) stopListening();
  if (container) container.innerHTML = '';
}