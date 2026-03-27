// temperature/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EGLC_COORDS = { lat: 51.5048, lon: 0.0503 };
const WU_TOTAL_HOURS = 360;
const WU_TOTAL_DAYS = 15;
const DISPLAY_DAYS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function londonToday(): { year: number; month: number; day: number } {
  const str = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
  const [y, m, d] = str.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function londonDateStr(offsetDays: number): string {
  const { year, month, day } = londonToday();
  const d = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return d.toISOString().slice(0, 10);
}

function londonCurrentHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
    10,
  );
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

interface WundergroundResult {
  hoursCount: number;
  countWarning: string | null;
  currentHourIndex: number;
  actualsToday: number;
  remainingToday: number;
  forecasts: DailyForecast[];
  currentTempC: number | null;
  error?: string;
}

function extractArray(html: string, pos: number): number[] | null {
  let depth = 0,
    end = pos;
  for (let i = pos; i < html.length; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  try {
    return JSON.parse(html.slice(pos, end + 1));
  } catch {
    return null;
  }
}

async function fetchWunderground(): Promise<WundergroundResult> {
  const EMPTY: WundergroundResult = {
    hoursCount: 0,
    countWarning: null,
    currentHourIndex: 0,
    actualsToday: 0,
    remainingToday: 0,
    forecasts: [],
    currentTempC: null,
  };
  try {
    const res = await fetch("https://www.wunderground.com/forecast/gb/london/EGLC", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const marker = '"temperature":[';
    let searchFrom = 0,
      rawHours: number[] | null = null;
    while (true) {
      const markerPos = html.indexOf(marker, searchFrom);
      if (markerPos === -1) break;
      const candidate = extractArray(html, markerPos + marker.length - 1);
      if (candidate && candidate.length === WU_TOTAL_HOURS) {
        rawHours = candidate;
        break;
      }
      searchFrom = markerPos + marker.length;
    }
    if (!rawHours) throw new Error("Wunderground data mismatch");

    const currentHourIndex = londonCurrentHour();
    const fToC = (f: number) => Math.round((((f - 32) * 5) / 9) * 10) / 10;
    const forecasts = Array.from({ length: WU_TOTAL_DAYS }, (_, i) => {
      const slice = rawHours!.slice(i * 24, i * 24 + 24);
      return { date: londonDateStr(i), maxTemp: fToC(Math.max(...slice)) };
    });

    return {
      hoursCount: rawHours.length,
      countWarning: null,
      currentHourIndex,
      actualsToday: currentHourIndex,
      remainingToday: 23 - currentHourIndex,
      forecasts,
      currentTempC: fToC(rawHours[currentHourIndex]),
    };
  } catch (err: any) {
    return { ...EMPTY, error: err.message };
  }
}

async function fetchOpenMeteo(): Promise<SourceForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${EGLC_COORDS.lat}&longitude=${EGLC_COORDS.lon}&current_weather=true&daily=temperature_2m_max&timezone=Europe%2FLondon&forecast_days=${DISPLAY_DAYS}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    return {
      source: "Open-Meteo",
      currentTemp: json.current_weather?.temperature ?? null,
      forecasts: (json.daily?.time ?? []).map((date: string, i: number) => ({
        date,
        maxTemp: json.daily.temperature_2m_max?.[i] ?? null,
      })),
    };
  } catch (err: any) {
    return { source: "Open-Meteo", currentTemp: null, forecasts: [], error: err.message };
  }
}

async function fetchOpenWeatherMap(): Promise<SourceForecast> {
  const key = process.env.OPENWEATHER_KEY;
  if (!key) return { source: "OpenWeatherMap", currentTemp: null, forecasts: [], error: "Missing Key" };
  try {
    const [cRes, fRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${EGLC_COORDS.lat}&lon=${EGLC_COORDS.lon}&appid=${key}&units=metric`, { cache: "no-store" }),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${EGLC_COORDS.lat}&lon=${EGLC_COORDS.lon}&appid=${key}&units=metric`, { cache: "no-store" }),
    ]);
    const cJson = await cRes.json();
    const fJson = await fRes.json();
    const dailyMap: Record<string, number[]> = {};
    for (const item of fJson.list ?? []) {
      const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(item.dt * 1000));
      if (!dailyMap[d]) dailyMap[d] = [];
      dailyMap[d].push(item.main.temp_max);
    }
    return {
      source: "OpenWeatherMap",
      currentTemp: cJson.main?.temp ?? null,
      forecasts: Array.from({ length: DISPLAY_DAYS }, (_, i) => {
        const d = londonDateStr(i);
        return { date: d, maxTemp: dailyMap[d] ? Math.max(...dailyMap[d]) : null };
      }),
    };
  } catch (err: any) {
    return { source: "OpenWeatherMap", currentTemp: null, forecasts: [], error: err.message };
  }
}

async function fetchWeatherAPI(): Promise<SourceForecast> {
  const key = process.env.WEATHERAPI_KEY;
  if (!key) return { source: "WeatherAPI", currentTemp: null, forecasts: [], error: "Missing Key" };
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${EGLC_COORDS.lat},${EGLC_COORDS.lon}&days=${DISPLAY_DAYS}`, { cache: "no-store" });
    const json = await res.json();
    return {
      source: "WeatherAPI",
      currentTemp: json.current?.temp_c ?? null,
      forecasts: (json.forecast?.forecastday ?? []).map((d: any) => ({
        date: d.date,
        maxTemp: d.day.maxtemp_c,
      })),
    };
  } catch (err: any) {
    return { source: "WeatherAPI", currentTemp: null, forecasts: [], error: err.message };
  }
}

export async function GET() {
  try {
    const [wu, openMeteo, openWeather, weatherApi] = await Promise.all([fetchWunderground(), fetchOpenMeteo(), fetchOpenWeatherMap(), fetchWeatherAPI()]);

    const otherSources = [openMeteo, openWeather, weatherApi];
    const days = Array.from({ length: DISPLAY_DAYS }, (_, i) => {
      const date = londonDateStr(i); // Define date FIRST
      const wuMaxFromForecast = wu.forecasts.find((f) => f.date === date)?.maxTemp ?? null;

      // Apply the High-Water Mark Logic: Max temp cannot be lower than the current temperature
      let finalWuMax = wuMaxFromForecast;
      if (i === 0 && wu.currentTempC !== null && wuMaxFromForecast !== null) {
        finalWuMax = Math.max(wuMaxFromForecast, wu.currentTempC);
      }

      const others = otherSources.map((s) => {
        const m = s.forecasts.find((f) => f.date === date)?.maxTemp ?? null;
        return {
          source: s.source,
          maxTemp: m !== null ? Math.round(m * 10) / 10 : null,
          // Use finalWuMax here so Deltas are accurate to the actual peak
          deltaVsWu: finalWuMax !== null && m !== null ? Math.round((m - finalWuMax) * 10) / 10 : null,
          error: s.error,
        };
      });

      const avail = others.filter((p) => p.maxTemp !== null);
      const consensus = avail.length > 0 ? Math.round((avail.reduce((a, b) => a + b.maxTemp!, 0) / avail.length) * 10) / 10 : null;

      return {
        date,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `+${i} Days`,
        // Save finalWuMax here
        wunderground: { maxTemp: finalWuMax, note: i === 0 ? `${wu.actualsToday} rec + ${wu.remainingToday} forecast` : undefined },
        otherSources: others,
        consensus,
        consensusDeltaVsWu: finalWuMax !== null && consensus !== null ? Math.round((consensus - finalWuMax) * 10) / 10 : null,
      };
    });

    const currentTemps = [
      {
        source: "Wunderground (EGLC)",
        temp: wu.currentTempC,
        note: `London ${wu.currentHourIndex}:00 — ${wu.actualsToday} rec + ${wu.remainingToday} forecast`,
        error: wu.error,
      },
      ...otherSources.map((s) => ({
        source: s.source,
        temp: s.currentTemp !== null ? Math.round(s.currentTemp * 10) / 10 : null,
        error: s.error,
      })),
    ];

    // FIX: Map code object to DB columns (latitude/longitude instead of nested coordinates)
    const dbPayload = {
      location_name: "London City Airport (EGLC)",
      location_slug: "london-eglc",
      latitude: EGLC_COORDS.lat,
      longitude: EGLC_COORDS.lon,
      london_date: londonDateStr(0),
      current_temps: currentTemps,
      daily_forecasts: days,
      wunderground_meta: {
        hoursCount: wu.hoursCount,
        totalDaysAvailable: WU_TOTAL_DAYS,
        daysDisplayed: DISPLAY_DAYS,
        error: wu.error,
      },
      today_wu_max_temp: days[0]?.wunderground.maxTemp,
      today_consensus_temp: days[0]?.consensus,
      observed_temp_at_snapshot: wu.currentTempC,
    };

    const { error: dbError } = await supabase.from("temperature_prediction_snapshots").insert([dbPayload]);
    if (dbError) console.error("Supabase Error:", dbError);

    return NextResponse.json({
      location: dbPayload.location_name,
      coordinates: EGLC_COORDS,
      londonToday: dbPayload.london_date,
      currentTemps,
      days,
      wundergroundMeta: dbPayload.wunderground_meta,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
