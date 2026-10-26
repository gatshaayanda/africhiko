"use client";

import { useCallback, useEffect, useState } from "react";

type Weather = { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; time: string };

function condition(code: number) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 95) return "Thunderstorms";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain or drizzle";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow or ice";
  return "Cloudy conditions";
}

export default function AfrichikoWeather() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const url = "https://api.open-meteo.com/v1/forecast?latitude=-24.6282&longitude=25.9231&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Africa%2FGaborone";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Weather unavailable");
      const data = await response.json() as { current?: Weather };
      if (!data.current || typeof data.current.temperature_2m !== "number") throw new Error("Weather data missing");
      setWeather(data.current);
    } catch {
      setWeather(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void loadWeather(); }, [loadWeather]);
  const updated = weather?.time ? new Date(weather.time).toLocaleTimeString("en-BW", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Gaborone" }) : "";

  return <section className="af-weather-card" aria-label="Current Gaborone weather">
    <div><p className="af-eyebrow">GABORONE · WORKSHOP WEATHER</p>
      {weather ? <><div className="af-weather-current"><strong>{Math.round(weather.temperature_2m)}°C</strong><span>{condition(weather.weather_code)}</span></div><p>Feels like {Math.round(weather.apparent_temperature)}°C</p></> : <p className="af-weather-status" role="status">{loading ? "Checking current conditions…" : error ? "Weather is unavailable right now." : ""}</p>}
      <small>{updated ? `Updated ${updated} local time · Open-Meteo` : "Current conditions · Open-Meteo"}</small>
    </div>
    {weather && <div className="af-weather-details"><span><small>Humidity</small><strong>{weather.relative_humidity_2m}%</strong></span><span><small>Wind</small><strong>{Math.round(weather.wind_speed_10m)} km/h</strong></span></div>}
    <div className="af-weather-footer"><span>For the workshop area, not a project-site forecast.</span>{!loading && <button type="button" onClick={() => void loadWeather()}>{error ? "Try again" : "Refresh"}</button>}</div>
  </section>;
}
