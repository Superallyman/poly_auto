import { NextResponse } from 'next/server';

const EGLC_COORDS = { lat: 51.5048, lon: 0.0503 };

interface DailyForecast {
  date: string;
  maxTemp: number | null;
}

interface SourceForecast {
  source: string;
  currentTemp: number | null;
  forecasts: DailyForecast[];
  error?: string;
}

// ─── Open-Meteo (free, no key required) ──────────────────────────────────────
async function fetchOpenMeteo(): Promise<SourceForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${EGLC_COORDS.lat}&longitude=${EGLC_COORDS.lon}` +
    `&current_weather=true` +
    `&daily=temperature_2m_max` +
    `&timezone=Europe%2FLondon` +
    `&forecast_days=3`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const currentTemp: number = json.current_weather?.temperature ?? null;

    const forecasts: DailyForecast[] = (json.daily?.time ?? [])
      .slice(0, 3)
      .map((date: string, i: number) => ({
        date,
        maxTemp: json.daily.temperature_2m_max?.[i] ?? null,
      }));

    return { source: 'Open-Meteo', currentTemp, forecasts };
  } catch (err: any) {
    return { source: 'Open-Meteo', currentTemp: null, forecasts: [], error: err.message };
  }
}

// ─── OpenWeatherMap ───────────────────────────────────────────────────────────
async function fetchOpenWeatherMap(): Promise<SourceForecast> {
  const key = process.env.OPENWEATHER_KEY;
  if (!key) {
    return { source: 'OpenWeatherMap', currentTemp: null, forecasts: [], error: 'Missing API key' };
  }

  // Current weather
  const currentUrl =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${EGLC_COORDS.lat}&lon=${EGLC_COORDS.lon}&appid=${key}&units=metric`;

  // 5-day / 3-hour forecast — we'll extract daily max from the 3-hour buckets
  const forecastUrl =
    `https://api.openweathermap.org/data/2.5/forecast` +
    `?lat=${EGLC_COORDS.lat}&lon=${EGLC_COORDS.lon}&appid=${key}&units=metric`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl, { cache: 'no-store' }),
      fetch(forecastUrl, { cache: 'no-store' }),
    ]);

    if (!currentRes.ok) throw new Error(`Current HTTP ${currentRes.status}`);
    if (!forecastRes.ok) throw new Error(`Forecast HTTP ${forecastRes.status}`);

    const currentJson = await currentRes.json();
    const forecastJson = await forecastRes.json();

    const currentTemp: number = currentJson.main?.temp ?? null;

    // Group 3-hour slots by local date (UTC+1 approximation via London offset)
    const dailyMap: Record<string, number[]> = {};
    for (const item of forecastJson.list ?? []) {
      // item.dt_txt is "YYYY-MM-DD HH:MM:SS"
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) dailyMap[date] = [];
      dailyMap[date].push(item.main?.temp_max ?? item.main?.temp);
    }

    const today = new Date();
    const forecasts: DailyForecast[] = [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const dateStr = d.toISOString().split('T')[0];
      const temps = dailyMap[dateStr] ?? [];
      return {
        date: dateStr,
        maxTemp: temps.length ? Math.max(...temps) : null,
      };
    });

    return { source: 'OpenWeatherMap', currentTemp, forecasts };
  } catch (err: any) {
    return { source: 'OpenWeatherMap', currentTemp: null, forecasts: [], error: err.message };
  }
}

// ─── WeatherAPI.com ───────────────────────────────────────────────────────────
async function fetchWeatherAPI(): Promise<SourceForecast> {
  const key = process.env.WEATHERAPI_KEY;
  if (!key) {
    return { source: 'WeatherAPI', currentTemp: null, forecasts: [], error: 'Missing API key' };
  }

  // forecast endpoint returns today + N days
  const url =
    `https://api.weatherapi.com/v1/forecast.json` +
    `?key=${key}&q=${EGLC_COORDS.lat},${EGLC_COORDS.lon}&days=3&aqi=no&alerts=no`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const currentTemp: number = json.current?.temp_c ?? null;

    const forecasts: DailyForecast[] = (json.forecast?.forecastday ?? [])
      .slice(0, 3)
      .map((day: any) => ({
        date: day.date,
        maxTemp: day.day?.maxtemp_c ?? null,
      }));

    return { source: 'WeatherAPI', currentTemp, forecasts };
  } catch (err: any) {
    return { source: 'WeatherAPI', currentTemp: null, forecasts: [], error: err.message };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const [openMeteo, openWeather, weatherApi] = await Promise.all([
    fetchOpenMeteo(),
    fetchOpenWeatherMap(),
    fetchWeatherAPI(),
  ]);

  const allSources: SourceForecast[] = [openMeteo, openWeather, weatherApi];

  // Build date labels for today / tomorrow / day after
  const today = new Date();
  const dateLabels = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  // Current temperature from each source
  const currentTemps = allSources.map((s) => ({
    source: s.source,
    temp: s.currentTemp !== null ? Math.round(s.currentTemp * 10) / 10 : null,
    error: s.error,
  }));

  // Per-day max forecasts from each source
  const days = dateLabels.map((date, i) => {
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : '2 Days From Now';

    const predictions = allSources.map((s) => {
      const match = s.forecasts.find((f) => f.date === date);
      return {
        source: s.source,
        maxTemp: match?.maxTemp !== null && match?.maxTemp !== undefined
          ? Math.round(match.maxTemp * 10) / 10
          : null,
        error: s.error,
      };
    });

    // Simple average of available predictions
    const available = predictions.filter((p) => p.maxTemp !== null);
    const consensus =
      available.length > 0
        ? Math.round(
            (available.reduce((sum, p) => sum + (p.maxTemp as number), 0) /
              available.length) *
              10
          ) / 10
        : null;

    return { date, label, predictions, consensus };
  });

  return NextResponse.json({
    location: 'London City Airport (EGLC)',
    coordinates: EGLC_COORDS,
    generatedAt: new Date().toISOString(),
    currentTemps,
    days,
  });
}