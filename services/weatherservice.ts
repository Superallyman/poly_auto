export const EGLC_COORDS = { lat: 51.5048, lon: 0.0503 };

async function safeFetch(url: string, key?: string) {
  // Check if key is missing or is the literal string "undefined"
  if (!key || key === "undefined") {
    if (url.includes('api.open-meteo.com')) return await (await fetch(url)).json(); // Open-Meteo is public
    return { error: "Missing API Key" };
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return { error: `API Error: ${res.status}` };
    return data;
  } catch (e) {
    return { error: "Network Error" };
  }
}

export async function fetchCurrentTemps() {
  const sources = [
    { name: 'Open-Meteo', url: `https://api.open-meteo.com/v1/forecast?latitude=${EGLC_COORDS.lat}&longitude=${EGLC_COORDS.lon}&current_weather=true`, key: 'public' },
    { name: 'OpenWeatherMap', url: `https://api.openweathermap.org/data/2.5/weather?lat=${EGLC_COORDS.lat}&lon=${EGLC_COORDS.lon}&appid=${process.env.OPENWEATHER_KEY}&units=metric`, key: process.env.OPENWEATHER_KEY },
    { name: 'WeatherAPI', url: `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHERAPI_KEY}&q=${EGLC_COORDS.lat},${EGLC_COORDS.lon}`, key: process.env.WEATHERAPI_KEY }
  ];

  const results = await Promise.all(sources.map(s => safeFetch(s.url, s.key)));
  
  return results.map((data, i) => ({
    source: sources[i].name,
    temp: data.error ? data.error : (data.current_weather?.temperature ?? data.main?.temp ?? data.current?.temp_c ?? 'N/A')
  }));
}

export async function fetchDailyPredictions() {
  const om = await safeFetch(`https://api.open-meteo.com/v1/forecast?latitude=${EGLC_COORDS.lat}&longitude=${EGLC_COORDS.lon}&daily=temperature_2m_max&timezone=Europe/London`, 'public');
  const vc = await safeFetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${EGLC_COORDS.lat},${EGLC_COORDS.lon}/today?unitGroup=metric&key=${process.env.VISUAL_CROSSING_KEY}&include=days`, process.env.VISUAL_CROSSING_KEY);
  const wa = await safeFetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_KEY}&q=${EGLC_COORDS.lat},${EGLC_COORDS.lon}&days=1`,
    process.env.WEATHERAPI_KEY
  );
  return {
    openMeteo: om.error ? om.error : om.daily?.temperature_2m_max?.[0],
    visualCrossing: vc.error ? vc.error : vc.days?.[0]?.tempmax,
    weatherAPI: wa.error ? wa.error : wa.forecast?.forecastday?.[0]?.day?.maxtemp_c,
  };
}

export async function getRefinedReport() {
  const data = await safeFetch(`https://api.open-meteo.com/v1/forecast?latitude=${EGLC_COORDS.lat}&longitude=${EGLC_COORDS.lon}&current_weather=true&hourly=winddirection_10m,shortwave_radiation&daily=temperature_2m_max&timezone=Europe/London`, 'public');

  if (data.error) return { source: "Open-Meteo", finalGuess: "Error", methodName: data.error };

  const windDir = data.current_weather?.winddirection || 0;
  const isRiverBreeze = windDir >= 70 && windDir <= 150;
  const radiation = data.hourly?.shortwave_radiation?.[new Date().getHours()] || 0;

  let refined = data.daily?.temperature_2m_max?.[0] || 0;
  if (isRiverBreeze) refined -= 0.5;
  if (radiation > 300) refined += 0.8;

  return {
    source: "Open-Meteo (Refined)",
    methodName: "Diurnal Velocity & River Breeze Adjustment",
    finalGuess: refined ? refined.toFixed(1) : "N/A",
    factors: { isRiverBreeze, radiation }
  };
}

export async function getWundergroundLive() {
  const key = process.env.WUNDERGROUND_API_KEY;
  if (!key || key === "undefined") return "Missing API Key";
  
  const data = await safeFetch(`https://api.weather.com/v2/pws/observations/current?stationId=EGLC&format=json&units=m&apiKey=${key}`, key);
  return data.error ? data.error : data.observations?.[0]?.metric?.temp || "N/A";
}