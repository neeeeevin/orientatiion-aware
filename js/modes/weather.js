/**
 * @module js/modes/weather
 * Fetches and displays current weather data with caching.
 */
import * as storage from '../core/storage.js';

// IMPORTANT: Replace with your actual WeatherAPI.com key
const API_KEY = 'ac196292650b42cc86960134251308';
const CACHE_KEY = 'weather_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

let containerEl = null;

const getMarkup = (data) => `
  <div class="container weather-content">
    <h3>Weather</h3>
    <div class="weather-main">
      <img src="${data.iconUrl}" alt="${data.condition}" class="weather-icon">
      <div class="weather-temp">${Math.round(data.temp_c)}<span class="deg">&deg;C</span></div>
    </div>
    <div class="weather-location">${data.locationName}</div>
    <div class="weather-details">
      <div>Feels like: ${Math.round(data.feelslike_c)}&deg;C</div>
      <div>Humidity: ${data.humidity}%</div>
      <div>Wind: ${data.wind_kph} kph</div>
    </div>
    <div class="weather-last-updated">
      Updated: ${new Date(data.timestamp).toLocaleTimeString()}
    </div>
  </div>
`;

const getErrorMarkup = (message) => `
  <div class="container">
    <h3>Weather</h3>
    <p>Could not fetch weather: ${message}</p>
    <p>Please check your API key and network connection.</p>
  </div>
`;

const getLoadingMarkup = () => `
  <div class="container">
    <h3>Weather</h3>
    <p>Fetching weather data...</p>
  </div>
`;

const fetchWeather = async (query) => {
  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${query}&aqi=no`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const processedData = {
      locationName: `${data.location.name}, ${data.location.country}`,
      temp_c: data.current.temp_c,
      feelslike_c: data.current.feelslike_c,
      condition: data.current.condition.text,
      iconUrl: `https:${data.current.condition.icon}`,
      humidity: data.current.humidity,
      wind_kph: data.current.wind_kph,
      timestamp: Date.now(),
    };
    storage.set(CACHE_KEY, processedData);
    containerEl.innerHTML = getMarkup(processedData);
  } catch (error) {
    console.error("Weather fetch failed:", error);
    containerEl.innerHTML = getErrorMarkup(error.message);
  }
};

const initWeatherFetch = () => {
  const cachedData = storage.get(CACHE_KEY);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION_MS)) {
    containerEl.innerHTML = getMarkup(cachedData);
    return;
  }

  containerEl.innerHTML = getLoadingMarkup();
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      fetchWeather(`${latitude},${longitude}`);
    },
    (error) => {
      console.warn(`Geolocation error: ${error.message}`);
      // Fallback to a default location if geolocation fails
      fetchWeather('New York');
    }
  );
};

export function mount(container) {
  if (!container) return;
  containerEl = container;
  initWeatherFetch();
}

export function unmount() {
  if (containerEl) containerEl.innerHTML = '';
}