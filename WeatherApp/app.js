// === CONFIG ===
    // The URL you provided (we keep it editable so you can replace the key if needed)
    const BASE_EXAMPLE = 'http://api.weatherapi.com/v1/current.json?key=cb6538f8a8fc4df1be492634250201';

    // References
    const form = document.getElementById('searchForm');
    const input = document.getElementById('locationInput');
    const btn = document.getElementById('searchBtn');
    const card = document.getElementById('card');
    const errorBox = document.getElementById('error');

    const condIcon = document.getElementById('condIcon');
    const condText = document.getElementById('condText');
    const locationName = document.getElementById('locationName');
    const tempVal = document.getElementById('tempVal');
    const feelsLike = document.getElementById('feelsLike');
    const localTime = document.getElementById('localTime');
    const humidity = document.getElementById('humidity');
    const wind = document.getElementById('wind');

    // Helper to format numbers
    function fmt(n){return (Math.round(n*10)/10).toFixed(1)}

    async function fetchWeather(q){
      const url = `${BASE_EXAMPLE}&q=${encodeURIComponent(q)}&aqi=yes`;
      // Show loading
      btn.disabled = true; btn.textContent = 'Loading...';
      errorBox.hidden = true;
      try{
        const resp = await fetch(url);
        if(!resp.ok){
          const text = await resp.text();
          throw new Error(resp.status + ' ' + resp.statusText + (text?(': '+text):''));
        }
        const data = await resp.json();
        return data;
      }catch(err){
        throw err;
      }finally{
        btn.disabled = false; btn.textContent = 'Get Weather';
      }
    }

    function showError(msg){
      errorBox.textContent = msg;
      errorBox.hidden = false;
      card.hidden = true;
    }

    function render(data){
      try{
        const loc = data.location;
        const cur = data.current;
        condIcon.src = 'https:' + cur.condition.icon.replace('//','/');
        condIcon.alt = cur.condition.text || 'condition';
        condText.textContent = cur.condition.text || '--';
        locationName.textContent = `${loc.name}, ${loc.region ? loc.region + ', ': ''}${loc.country}`;
        tempVal.textContent = `${fmt(cur.temp_c)}°C / ${fmt(cur.temp_f)}°F`;
        feelsLike.textContent = `${fmt(cur.feelslike_c)}°C`;
        localTime.textContent = loc.localtime || '--';
        humidity.textContent = (cur.humidity != null) ? cur.humidity + '%' : '--';
        wind.textContent = (cur.wind_kph != null) ? fmt(cur.wind_kph) + ' kph' : '--';

        card.hidden = false;
        errorBox.hidden = true;
      }catch(e){
        showError('Unexpected response format.');
        console.error(e);
      }
    }

    // Event handlers
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      const q = input.value.trim();
      if(!q) return;
      try{
        const data = await fetchWeather(q);
        if(data && data.error){
          showError(data.error.message || 'API returned an error');
          return;
        }
        render(data);
      }catch(err){
        console.error(err);
        // Common CORS hint
        if(err.message && err.message.toLowerCase().includes('cors')){
          showError('CORS error: your browser blocked the request. Run this page via a local server or proxy the request through your backend.');
        } else if(err.message){
          showError('Failed to fetch: ' + err.message);
        } else {
          showError('Failed to fetch weather.');
        }
      }
    });

    // Allow pressing Enter in the input to submit
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        form.dispatchEvent(new Event('submit', {cancelable:true, bubbles:true}));
      }
    });

    // Optional: try to pre-fill with a sample
    // input.value = 'London';