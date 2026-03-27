import { NextResponse } from 'next/server';
// Using relative import to prevent alias (@/) errors
import * as weatherservice from '../../../services/weatherservice';

export async function GET() {
  try {
    const [currentTemps, predictions, refinedReport, wuTemp] = await Promise.all([
      weatherservice.fetchCurrentTemps(),
      weatherservice.fetchDailyPredictions(),
      weatherservice.getRefinedReport(),
      weatherservice.getWundergroundLive()
    ]);

    return NextResponse.json({
      date: new Date().toLocaleDateString('en-GB'),
      currentTemps,
      predictions,
      refinedReport,
      wundergroundLive: wuTemp
    });
  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}