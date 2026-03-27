// temperaturehistory/page.tsx

"use client";
import React, { useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TemperatureHistoryPage() {
    const [data, setData] = React.useState<any[]>([]);
    const [finals, setFinals] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchData() {
            const { data: snapshots } = await supabase
                .from('temperature_prediction_snapshots')
                .select('*')
                .order('created_at', { ascending: true }); // Ascending for chronological chart points

            const { data: finalTemps } = await supabase
                .from('polymarket_final_temps')
                .select('*');

            setData(snapshots || []);
            setFinals(finalTemps || []);
            setLoading(false);
        }
        fetchData();
    }, []);

    // Process data into "Target Date" groups
    const groups = useMemo(() => {
        const map: Record<string, any> = {};

        data.forEach(snap => {
            snap.daily_forecasts.forEach((forecast: any) => {
                const dateKey = forecast.date;
                if (!map[dateKey]) map[dateKey] = { predictions: [], location: snap.location_name || 'London EGLC' };

                map[dateKey].predictions.push({
                    time: new Date(snap.created_at),
                    wu: forecast.wunderground?.maxTemp,
                    consensus: forecast.consensus,
                    others: forecast.otherSources,
                    // Add this to feed the white dotted line
                    observed_so_far: snap.observed_temp_at_snapshot
                });
            });
        });
        return map;
    }, [data]);

    if (loading) return <div style={{ padding: '20px' }}>Loading History...</div>;

    return (
        <main style={{ padding: '20px' }}>
            <h1>Market Convergence History</h1>
            <p style={{ opacity: 0.7 }}>Analyzing how prediction sources merge as the event approaches.</p>

            {Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(targetDate => {
                const targetData = groups[targetDate];
                const actual = finals.find(f => f.target_date === targetDate)?.final_max_temp;

                // Prepare Chart.js Data
                const chartData = {
                    labels: targetData.predictions.map((p: any) =>
                        p.time.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    ),
                    datasets: [
                        {
                            label: 'Wunderground',
                            data: targetData.predictions.map((p: any) => p.wu),
                            borderColor: '#ff9f43',
                            backgroundColor: '#ff9f43',
                            tension: 0.3,
                        },
                        {
                            label: 'Consensus',
                            data: targetData.predictions.map((p: any) => p.consensus),
                            borderColor: '#54a0ff',
                            backgroundColor: '#54a0ff',
                            borderDash: [5, 5],
                            tension: 0.3,
                        },
                        {
                            label: 'Observed Peak',
                            data: targetData.predictions.map((p: any) => p.observed_so_far), // You'd need to save this in the snapshot
                            borderColor: '#ffffff',
                            borderWidth: 2,
                            borderDash: [2, 2], // Dotted white line
                            pointRadius: 0,
                            fill: false,
                        },
                        // Map the other sources dynamically
                        ...(targetData.predictions[0]?.others || []).map((sourceObj: any, idx: number) => {
                            const colors = ['#1dd1a1', '#ee5253', '#feca57', '#5f27cd'];
                            return {
                                label: sourceObj.source,
                                data: targetData.predictions.map((p: any) =>
                                    p.others.find((s: any) => s.source === sourceObj.source)?.maxTemp
                                ),
                                borderColor: colors[idx % colors.length],
                                borderWidth: 1,
                                pointRadius: 0, // Keep it clean for high frequency
                                tension: 0.3,
                            };
                        })
                    ]
                };

                return (
                    <div key={targetDate} style={{ marginBottom: '50px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <h3>Target: {new Date(targetDate).toDateString()} ({targetData.location})</h3>
                            <h2 style={{ color: '#4dabf7' }}>{actual ? `Actual: ${actual}°C` : 'Result Pending'}</h2>
                        </div>

                        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                            <Line
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'top', labels: { color: '#ccc' } },
                                        tooltip: { mode: 'index', intersect: false }
                                    },
                                    scales: {
                                        y: { grid: { color: '#222' }, ticks: { color: '#888' } },
                                        x: { grid: { display: false }, ticks: { color: '#888' } }
                                    }
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </main>
    );
}