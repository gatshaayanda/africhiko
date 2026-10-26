"use client";

import { useEffect, useState } from "react";

type Weather = { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; time: string };
export default function AfrichikoWeather() {
 const [weather, setWeather] = useState<Weather | null>(null);
 const [error, setError] = useState(false);
 useEffect(() => { const controller = new AbortController(); fetch("https://api.open-meteo.com/v1/forecast?latitude=-24.6282&longitude=25.9231&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Africa%2FGaborone", { signal: controller.signal }).then(r => { if (!r.ok) throw new Error("Weather unavailable"); return r.json(); }).then(d => setWeather(d.current)).catch(() => setError(true)); return () => controller.abort(); }, []);
 return <section className="af-weather-card" aria-label="Current Gaborone weather"><p className="af-eyebrow">GABORONE · WORKSHOP WEATHER</p>{weather ? <><div className="af-weather-current"><strong>{Math.round(weather.temperature_2m)}°C</strong><span>{weather.weather_code === 0 ? "Clear sky" : weather.weather_code <= 3 ? "Partly cloudy" : weather.weather_code >= 95 ? "Thunderstorms" : "Clouds or precipitation"}</span></div><p>Feels like {Math.round(weather.apparent_temperature)}°C · Humidity {weather.relative_humidity_2m}% · Wind {Math.round(weather.wind_speed_10m)} km/h</p><small>Updated {new Date(weather.time).toLocaleTimeString("en-BW", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Gaborone" })} local time · Open-Meteo</small></> : <p role="status">{error ? "Weather is unavailable. Try again when online." : "Checking current conditions…"}</p>}</section>;
}