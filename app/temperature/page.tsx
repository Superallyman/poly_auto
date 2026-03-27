import { headers } from 'next/headers';

// ─── Types matching the route.ts response shape ───────────────────────────────
interface SourceCurrent {
  source: string;
  temp: number | null;
  error?: string;
}

interface SourcePrediction {
  source: string;
  maxTemp: number | null;
  error?: string;
}

interface DayForecast {
  date: string;
  label: string;
  predictions: SourcePrediction[];
  consensus: number | null;
}

interface TemperatureReport {
  location: string;
  coordinates: { lat: number; lon: number };
  generatedAt: string;
  currentTemps: SourceCurrent[];
  days: DayForecast[];
}

// ─── Small display helpers ────────────────────────────────────────────────────
function fmt(val: number | null): string {
  return val !== null ? `${val}°C` : 'N/A';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatGenerated(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function TemperaturePage() {
  const host = (await headers()).get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';

  let data: TemperatureReport;
  try {
    const res = await fetch(`${protocol}://${host}/api/temperature`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`API responded with status ${res.status}`);
    data = await res.json();
  } catch (err: any) {
    return (
      <main style={styles.main}>
        <h1 style={styles.h1}>⚠ System Error</h1>
        <p style={styles.errorMsg}>
          The temperature API returned an invalid response.
          <br />
          <small>{err?.message}</small>
        </p>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <h1 style={styles.h1}>🌡 Temperature Forecast Report</h1>
        <p style={styles.subtitle}>
          <strong>{data.location}</strong>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          {data.coordinates.lat}°N, {data.coordinates.lon}°E
        </p>
        <p style={styles.meta}>Generated: {formatGenerated(data.generatedAt)}</p>
      </header>

      {/* ── Section 1 — Current Temperatures ── */}
      <section style={styles.section}>
        <h2 style={styles.h2}>1. Current Temperature</h2>
        <p style={styles.sectionNote}>
          Live readings from each data source right now.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Source</th>
              <th style={styles.th}>Current Temp</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.currentTemps.map((s) => (
              <tr key={s.source} style={styles.tr}>
                <td style={styles.td}>{s.source}</td>
                <td style={{ ...styles.td, ...styles.tempCell }}>{fmt(s.temp)}</td>
                <td style={styles.td}>
                  {s.error ? (
                    <span style={styles.errorBadge}>⚠ {s.error}</span>
                  ) : (
                    <span style={styles.okBadge}>✓ OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Section 2 — Daily Max Forecasts ── */}
      <section style={styles.section}>
        <h2 style={styles.h2}>2. Predicted High Temperatures</h2>
        <p style={styles.sectionNote}>
          Forecast maximum temperatures for today, tomorrow, and the day after.
          Consensus is the simple average of available sources.
        </p>

        {data.days.map((day, i) => (
          <div key={day.date} style={styles.dayCard}>
            <div style={styles.dayHeader}>
              <span style={styles.dayLabel}>
                {i === 0 ? '📅 Today' : i === 1 ? '📅 Tomorrow' : '📅 2 Days From Now'}
              </span>
              <span style={styles.dayDate}>{formatDate(day.date)}</span>
              {day.consensus !== null && (
                <span style={styles.consensusBadge}>
                  Consensus: {fmt(day.consensus)}
                </span>
              )}
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Source</th>
                  <th style={styles.th}>Predicted High</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {day.predictions.map((p) => (
                  <tr key={p.source} style={styles.tr}>
                    <td style={styles.td}>{p.source}</td>
                    <td style={{ ...styles.td, ...styles.tempCell }}>
                      {fmt(p.maxTemp)}
                    </td>
                    <td style={styles.td}>
                      {p.error ? (
                        <span style={styles.errorBadge}>⚠ {p.error}</span>
                      ) : p.maxTemp !== null ? (
                        <span style={styles.okBadge}>✓ OK</span>
                      ) : (
                        <span style={styles.warnBadge}>— No data</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <footer style={styles.footer}>
        Data sources: Open-Meteo · OpenWeatherMap · WeatherAPI.com
      </footer>
    </main>
  );
}

// ─── Inline styles (no external CSS dependency) ───────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: "'Segoe UI', Arial, sans-serif",
    maxWidth: 720,
    margin: '0 auto',
    padding: '2rem 1.5rem',
    color: '#1a1a2e',
    background: '#f4f7fc',
    minHeight: '100vh',
  },
  header: {
    background: '#1a1a2e',
    color: '#e8f0fe',
    borderRadius: 10,
    padding: '1.5rem 2rem',
    marginBottom: '2rem',
  },
  h1: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: 'inherit',
  },
  subtitle: {
    margin: '0.5rem 0 0.25rem',
    fontSize: '1rem',
    opacity: 0.85,
  },
  meta: {
    margin: 0,
    fontSize: '0.8rem',
    opacity: 0.6,
  },
  section: {
    background: '#ffffff',
    borderRadius: 10,
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  h2: {
    margin: '0 0 0.25rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  sectionNote: {
    margin: '0 0 1rem',
    fontSize: '0.85rem',
    color: '#666',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem 0.75rem',
    borderBottom: '2px solid #e0e7ef',
    color: '#555',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '0.55rem 0.75rem',
    verticalAlign: 'middle',
  },
  tempCell: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1a6eb5',
  },
  okBadge: {
    background: '#d4edda',
    color: '#155724',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  errorBadge: {
    background: '#f8d7da',
    color: '#721c24',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  warnBadge: {
    background: '#fff3cd',
    color: '#856404',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  dayCard: {
    border: '1px solid #e0e7ef',
    borderRadius: 8,
    marginBottom: '1rem',
    overflow: 'hidden',
  },
  dayHeader: {
    background: '#eef2fb',
    padding: '0.65rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  dayLabel: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: '#1a1a2e',
  },
  dayDate: {
    fontSize: '0.85rem',
    color: '#555',
    flex: 1,
  },
  consensusBadge: {
    background: '#1a6eb5',
    color: '#fff',
    borderRadius: 20,
    padding: '2px 12px',
    fontSize: '0.82rem',
    fontWeight: 700,
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.78rem',
    color: '#999',
    marginTop: '1.5rem',
  },
  errorMsg: {
    color: '#721c24',
    background: '#f8d7da',
    padding: '1rem',
    borderRadius: 8,
  },
};
