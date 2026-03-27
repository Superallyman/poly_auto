// temperature/page.tsx

import React from 'react';
import { headers } from 'next/headers';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CurrentTemp {
  source: string;
  temp: number | null;
  note?: string;
  error?: string;
}

interface SourcePrediction {
  source: string;
  maxTemp: number | null;
  deltaVsWu: number | null;
  error?: string;
}

interface DayForecast {
  date: string;
  label: string;
  wunderground: { maxTemp: number | null; note?: string };
  otherSources: SourcePrediction[];
  consensus: number | null;
  consensusDeltaVsWu: number | null;
}

interface WuMeta {
  hoursCount: number;
  totalDaysAvailable: number;
  daysDisplayed: number;
  countWarning: string | null;
  error?: string;
}

interface TemperatureReport {
  location: string;
  coordinates: { lat: number; lon: number };
  generatedAt: string;
  londonToday: string;
  wundergroundMeta: WuMeta;
  currentTemps: CurrentTemp[];
  days: DayForecast[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | null) => (v !== null ? `${v}°C` : '—');

function fmtDelta(d: number | null) {
  if (d === null) return '—';
  return `${d > 0 ? '+' : ''}${d}°C`;
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function formatGenerated(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function deltaColor(d: number | null): string {
  if (d === null) return '#999';
  if (Math.abs(d) <= 0.5) return '#155724';
  if (Math.abs(d) <= 1.5) return '#856404';
  return '#721c24';
}

function deltaBg(d: number | null): string {
  if (d === null) return 'transparent';
  if (Math.abs(d) <= 0.5) return '#d4edda';
  if (Math.abs(d) <= 1.5) return '#fff3cd';
  return '#f8d7da';
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TemperaturePage() {
  const host = (await headers()).get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  let data: TemperatureReport;
  try {
    const res = await fetch(`${protocol}://${host}/api/temperature`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API status ${res.status}`);
    data = await res.json();
  } catch (err: any) {
    return (
      <main style={s.main}>
        <h1 style={s.h1}>⚠ System Error</h1>
        <p style={s.errorBox}>
          The temperature API returned an invalid response.<br />
          <small>{err?.message}</small>
        </p>
      </main>
    );
  }

  // Safety check to prevent the "Cannot read properties of undefined" bug
  const days = data?.days ?? [];
  const wuMeta = data?.wundergroundMeta ?? ({} as WuMeta);
  const otherSourceNames = days[0]?.otherSources.map((o) => o.source) ?? [];

  return (
    <main style={s.main}>
      <header style={s.header}>
        <h1 style={s.h1}>🌡 Temperature Forecast Report</h1>
        <p style={s.subtitle}>
          <strong>{data.location}</strong>
          &nbsp;·&nbsp;{data.coordinates.lat}°N, {data.coordinates.lon}°E
        </p>
        <p style={s.meta}>
          Generated: {formatGenerated(data.generatedAt)}
          &nbsp;·&nbsp;London date: <strong>{data.londonToday}</strong>
        </p>
      </header>

      {(wuMeta.error || wuMeta.countWarning) ? (
        <div style={s.warnBanner}>
          <strong>⚠ Wunderground issue:</strong> {wuMeta.error ?? wuMeta.countWarning}
        </div>
      ) : (
        <div style={s.okBanner}>
          ✓ Wunderground: {wuMeta.hoursCount} hourly values confirmed
          ({wuMeta.totalDaysAvailable} days available, showing {wuMeta.daysDisplayed})
        </div>
      )}

      <section style={s.section}>
        <h2 style={s.h2}>Current Temperature</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Source</th>
              <th style={s.th}>Temp</th>
              <th style={s.th}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {(data.currentTemps ?? []).map((c, i) => (
              <tr key={c.source} style={i === 0 ? { ...s.tr, background: '#fff8e1' } : s.tr}>
                <td style={s.td}><strong>{c.source}</strong></td>
                <td style={{ ...s.td, ...s.tempCell }}>{fmt(c.temp)}</td>
                <td style={{ ...s.td, fontSize: '0.8rem', color: '#555' }}>
                  {c.error ? <span style={s.errBadge}>⚠ {c.error}</span> : c.note ?? <span style={s.okBadge}>✓</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>10-Day Predicted High — Wunderground vs Other Sources</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...s.table, minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ ...s.th, minWidth: 110 }}>Day</th>
                <th style={{ ...s.th, ...s.wuHeadCell, textAlign: 'center' }}>Wunderground</th>
                {otherSourceNames.map((name) => (
                  <th key={name} style={{ ...s.th, textAlign: 'center' }} colSpan={2}>{name}</th>
                ))}
                <th style={{ ...s.th, textAlign: 'center' }} colSpan={2}>Consensus</th>
              </tr>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={s.subTh} />
                <th style={{ ...s.subTh, background: '#fff8e1' }}>°C</th>
                {otherSourceNames.map((name) => (
                  <React.Fragment key={name}>
                    <th style={s.subTh}>°C</th>
                    <th style={s.subTh}>Δ</th>
                  </React.Fragment>
                ))}
                <th style={s.subTh}>°C</th>
                <th style={s.subTh}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={day.date} style={{ ...s.tr, background: i === 0 ? '#fffbf0' : i % 2 === 0 ? '#fafbfd' : '#fff', fontWeight: i === 0 ? 700 : 400 }}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 700 }}>{day.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{formatDateShort(day.date)}</div>
                    {day.wunderground.note && <div style={{ fontSize: '0.68rem', color: '#aaa' }}>{day.wunderground.note}</div>}
                  </td>
                  <td style={{ ...s.td, ...s.wuTempCell }}>{fmt(day.wunderground.maxTemp)}</td>
                  {day.otherSources.map((p) => (
                    <React.Fragment key={p.source}>
                      <td style={{ ...s.td, ...s.tempCell }}>{p.error ? <span style={s.errBadge}>⚠</span> : fmt(p.maxTemp)}</td>
                      <td style={{ ...s.td, fontWeight: 700, textAlign: 'center', color: deltaColor(p.deltaVsWu), background: deltaBg(p.deltaVsWu) }}>{fmtDelta(p.deltaVsWu)}</td>
                    </React.Fragment>
                  ))}
                  <td style={{ ...s.td, ...s.tempCell }}>{fmt(day.consensus)}</td>
                  <td style={{ ...s.td, fontWeight: 700, textAlign: 'center', color: deltaColor(day.consensusDeltaVsWu), background: deltaBg(day.consensusDeltaVsWu) }}>{fmtDelta(day.consensusDeltaVsWu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <footer style={s.footer}> Ground truth: Wunderground (EGLC) · Supporting: Open-Meteo, OpenWeatherMap, WeatherAPI </footer>
    </main>
  );
}

// ... Keep existing styles 's' object as provided in original prompt ...
// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    maxWidth: 1020,
    margin: '0 auto',
    padding: '2rem 1.5rem',
    background: '#f4f7fc',
    minHeight: '100vh',
    color: '#1a1a2e',
  },
  header: {
    background: '#1a1a2e', color: '#e8f0fe',
    borderRadius: 10, padding: '1.5rem 2rem', marginBottom: '1rem',
  },
  h1: { margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'inherit' },
  subtitle: { margin: '0.4rem 0 0.2rem', fontSize: '1rem', opacity: 0.85 },
  meta: { margin: 0, fontSize: '0.78rem', opacity: 0.55 },
  okBanner: {
    background: '#d4edda', color: '#155724', borderRadius: 7,
    padding: '0.5rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600,
  },
  warnBanner: {
    background: '#f8d7da', color: '#721c24', borderRadius: 7,
    padding: '0.5rem 1rem', marginBottom: '1rem', fontSize: '0.85rem',
  },
  section: {
    background: '#fff', borderRadius: 10, padding: '1.5rem',
    marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  h2: { margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700 },
  note: { margin: '0 0 1rem', fontSize: '0.82rem', color: '#666' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  th: {
    textAlign: 'left', padding: '0.45rem 0.6rem',
    borderBottom: '2px solid #e0e7ef', color: '#444',
    fontWeight: 700, fontSize: '0.75rem',
    textTransform: 'uppercase', letterSpacing: '0.03em',
    background: '#f0f4fb',
  },
  wuHeadCell: { background: '#fff8e1', color: '#7b5800' },
  subTh: {
    textAlign: 'center', padding: '0.25rem 0.5rem',
    borderBottom: '1px solid #e0e7ef',
    color: '#888', fontSize: '0.68rem', fontWeight: 600,
    background: '#f8f9fa',
  },
  tr: { borderBottom: '1px solid #f0f0f0' },
  td: { padding: '0.5rem 0.6rem', verticalAlign: 'middle' },
  tempCell: {
    fontWeight: 700, fontSize: '0.95rem', color: '#1a6eb5',
    textAlign: 'center' as const,
  },
  wuTempCell: {
    fontWeight: 800, fontSize: '1rem', color: '#e65100',
    textAlign: 'center' as const, background: '#fff8e1',
  },
  okBadge: {
    background: '#d4edda', color: '#155724',
    borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
  },
  errBadge: {
    background: '#f8d7da', color: '#721c24',
    borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
  },
  footer: {
    textAlign: 'center' as const, fontSize: '0.75rem',
    color: '#aaa', marginTop: '1.5rem',
  },
  errorBox: {
    background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: 8,
  },
};
