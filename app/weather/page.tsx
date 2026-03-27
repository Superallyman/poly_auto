import { headers } from 'next/headers';

export default async function WeatherPage() {
  const host = (await headers()).get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  // Fetching with a try/catch to handle HTML error pages gracefully
  let data;
  try {
    const res = await fetch(`${protocol}://${host}/api/weather`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Status ${res.status}`);
    data = await res.json();
  } catch (err) {
    return <main><h1>System Error</h1><p>The API is currently returning an invalid response.</p></main>;
  }

  return (
    <main>
      <h1>Weather Intelligence: {data.date}</h1>

      <section>
        <h2>1. Current Temps</h2>
        {data.currentTemps.map((s: any) => (
          <p key={s.source}>{s.source}: {s.temp}°C</p>
        ))}
      </section>

      <section>
        <h2>2-5. Max Predictions</h2>
        <p>Open-Meteo: {data.predictions.openMeteo}°C</p>
        <p>Visual Crossing: {data.predictions.visualCrossing}°C</p>
        <p>WeatherAPI.com: {data.predictions.WeatherAPI}°C</p>
      </section>

      <section>
        <h2>6. Refined Prediction (Our Method)</h2>
        <p><strong>{data.refinedReport.finalGuess}°C</strong></p>
        <p><small>{data.refinedReport.methodName}</small></p>
      </section>

      <section>
        <h2>Wunderground Ground Truth</h2>
        <p>EGLC Station Live: {data.wundergroundLive}°C</p>
      </section>
    </main>
  );
}