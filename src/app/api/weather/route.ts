import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800;

export async function GET() {
  const apiKey = process.env.OPEN_METEO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Weather is not configured. Add the server-only OPEN_METEO_API_KEY for the commercial weather API." }, { status: 503 });
  }

  try {
    const url = new URL("https://customer-api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", "-24.6282");
    url.searchParams.set("longitude", "25.9231");
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
    url.searchParams.set("timezone", "Africa/Gaborone");
    url.searchParams.set("apikey", apiKey);
    const response = await fetch(url, { next: { revalidate: 1800 } });
    if (!response.ok) {
      return NextResponse.json({ error: "The weather provider could not return current conditions." }, { status: 502 });
    }
    const data = await response.json();
    if (!data.current || typeof data.current.temperature_2m !== "number") {
      return NextResponse.json({ error: "The weather provider returned an incomplete response." }, { status: 502 });
    }
    return NextResponse.json({ current: data.current, attribution: "Weather data by Open-Meteo (CC BY 4.0)" }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Current weather is temporarily unavailable." }, { status: 502 });
  }
}
