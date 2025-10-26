// === CONFIG ===
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// References
const form = document.getElementById('searchForm');
const input = document.getElementById('locationInput');
const btn = document.getElementById('searchBtn');
const card = document.getElementById('card');
const errorBox = document.getElementById('error');

// Weather Card References - ICON REFERENCES ARE NOW IGNORED OR DELETED
// const condIcon = document.getElementById('condIcon'); // NO LONGER USED
const condText = document.getElementById('condText');
const locationName = document.getElementById('locationName');
const tempVal = document.getElementById('tempVal');
const feelsLike = document.getElementById('feelsLike');
const localTime = document.getElementById('localTime');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');

// Helper to format numbers
function fmt(n) { return (Math.round(n * 10) / 10).toFixed(1); }

// Helper to get weather text from WMO code (ICON URL LOGIC IS DELETED)
function getWeatherText(code) {
    // Open-Meteo WMO Weather Codes (Simplified mapping for text only)
    switch (code) {
        case 0: return 'Clear sky';
        case 1:
        case 2: return 'Mainly Clear / Partly Cloudy';
        case 3: return 'Overcast';
        case 45:
        case 48: return 'Fog';
        case 51:
        case 53:
        case 55: return 'Drizzle';
        case 61:
        case 63:
        case 65: return 'Rain';
        case 71:
        case 73:
        case 75: return 'Snow';
        case 80:
        case 81:
        case 82: return 'Rain Showers';
        case 95: 
        case 96:
        case 99: return 'Thunderstorm';
        default: return 'Unknown';
    }
}


// Geocoding API to get lat/lon from city name (no login needed)
async function getLatLong(city) {
  const resp = await fetch(`https://geocode.maps.co/search?q=${encodeURIComponent(city)}`);
  const arr = await resp.json();
  if (arr && arr.length > 0) {
    return {
      latitude: arr[0].lat,
      longitude: arr[0].lon,
      display_name: arr[0].display_name
    };
  }
  throw new Error("Location not found.");
}

// Fetch weather from Open-Meteo
async function fetchWeather(city) {
  btn.disabled = true; btn.textContent = 'Loading...';
  errorBox.hidden = true;
  try {
    const coords = await getLatLong(city);
    
    // CRITICAL FIX: Request all needed data variables from Open-Meteo
    const currentVars = 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m';
    const params = `current=${currentVars}&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
    const url = `${BASE_URL}?latitude=${coords.latitude}&longitude=${coords.longitude}&${params}`;
    
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Weather API Error: ${resp.status} ${resp.statusText}`);
    }
    const data = await resp.json();
    data.coords = coords; 
    return data;
  } catch (err) {
    throw err;
  } finally {
    btn.disabled = false; btn.textContent = 'Get Weather';
  }
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  card.hidden = true;
}

function render(data) {
  try {
    const cur = data.current;
    
    // Use WMO code for text description only
    const weatherText = getWeatherText(cur.weather_code);
    
    // Location Name: From the geocoding response
    locationName.textContent = data.coords.display_name || '--';

    // Weather Condition TEXT
    condText.textContent = weatherText;
    
    // NOTE: Icon setting lines are removed. The <img> tag will remain empty.
    
    // Temperature
    tempVal.textContent = `${fmt(cur.temperature_2m)}°C`;
    
    // Feels Like 
    feelsLike.textContent = `${fmt(cur.apparent_temperature)}°C`; 
    
    // Local Time 
    const localTimeRaw = cur.time;
    localTime.textContent = new Date(localTimeRaw).toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });

    // Humidity
    humidity.textContent = `${cur.relative_humidity_2m != null ? cur.relative_humidity_2m + '%' : '--'}`;
    
    // Wind Speed 
    wind.textContent = `${cur.wind_speed_10m != null ? fmt(cur.wind_speed_10m) + ' kph' : '--'}`;
    
    card.hidden = false;
    errorBox.hidden = true;
  } catch (e) {
    showError('Unexpected response format or failed to process data.');
    console.error(e);
  }
}

// Event handlers
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  try {
    const data = await fetchWeather(q);
    render(data);
  } catch (err) {
    console.error(err);
    if (err.message && err.message.toLowerCase().includes('cors')) {
      showError('CORS error: your browser blocked the request. Run this page via a local server (e.g., using "npx http-server") or proxy the request through your backend.');
    } else if (err.message) {
      showError('Failed to fetch: ' + err.message);
    } else {
      showError('Failed to fetch weather. Check console for details.');
    }
  }
});

// Allow pressing Enter in the input to submit
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
});