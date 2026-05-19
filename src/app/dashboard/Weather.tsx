"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  condition: string;
  description: string;
  icon: string;
  wind_speed: number;
  wind_dir: number;
  visibility: string;
  pressure: number;
  uvi: number;
  uv_label: string;
  sunrise: string;
  sunset: string;
  rain: number;
}

interface DailyForecast {
  dt: number;
  day: string;
  icon: string;
  condition: string;
  high: number;
  low: number;
  rain: number;
}

interface Advisory {
  icon: string;
  color: "green" | "amber" | "red";
  title: string;
  desc: string;
}

interface WeatherData {
  location: string;
  lat: number;
  lon: number;
  current: CurrentWeather;
  daily: DailyForecast[];
  advisories: Advisory[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Weather() {
  const [data, setData]           = useState<WeatherData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [cityInput, setCityInput] = useState("");
  const [searching, setSearching] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchByCoords = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchByCity = async (city: string) => {
    setSearching(true);
    setError("");
    try {
      const res = await axios.get(
        `http://localhost:5000/api/weather?city=${encodeURIComponent(city)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
      setCityInput("");
    } catch (err: any) {
      setError(err.response?.data?.message || "City not found");
    } finally {
      setSearching(false);
    }
  };

  // Try GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
        () => {
          // GPS denied — show manual input
          setLoading(false);
          setError("Location access denied. Search for your city below.");
        },
        { timeout: 8000 }
      );
    } else {
      setLoading(false);
      setError("GPS not supported. Search for your city below.");
    }
  }, [fetchByCoords]);

  const windDirection = (deg: number) => {
    const dirs = ["N","NE","E","SE","S","SW","W","NW"];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <div className="view-root">
      <style>{`
        .weather-search-row {
          display: flex; gap: 10px; align-items: center;
        }
        .weather-search-input {
          flex: 1; background: var(--bg2);
          border: 1px solid var(--border2);
          border-radius: 10px; padding: 11px 16px;
          font-size: 14px; font-family: 'Syne', sans-serif;
          color: var(--cream); outline: none;
          transition: border-color 0.2s; max-width: 340px;
        }
        .weather-search-input:focus { border-color: var(--green); }
        .weather-search-input::placeholder { color: var(--muted); }

        /* Hero */
        .weather-hero {
          display: grid; grid-template-columns: 260px 1fr;
          gap: 20px; background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 28px;
          align-items: center;
        }
        .weather-main {
          text-align: center;
          border-right: 1px solid var(--border);
          padding-right: 28px;
        }
        .weather-icon-big { font-size: 60px; margin-bottom: 8px; }
        .weather-temp {
          font-family: 'Cormorant Garamond', serif;
          font-size: 64px; font-weight: 700;
          color: var(--cream); line-height: 1;
        }
        .weather-condition {
          font-size: 15px; color: var(--muted);
          margin-top: 6px; text-transform: capitalize;
        }
        .weather-feels {
          font-size: 12px; color: var(--muted);
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Metrics grid */
        .weather-metrics {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .weather-metric-card {
          background: var(--bg3); border-radius: 12px; padding: 14px;
        }
        .wm-icon { font-size: 18px; margin-bottom: 4px; }
        .wm-lbl { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
        .wm-val { font-size: 13px; font-weight: 600; color: var(--cream); }

        /* Forecast */
        .forecast-section {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .forecast-grid {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 8px; margin-top: 16px;
        }
        .forecast-card {
          background: var(--bg3); border-radius: 12px;
          padding: 14px 8px; text-align: center;
          display: flex; flex-direction: column;
          gap: 6px; align-items: center;
        }
        .fc-day { font-size: 11px; font-weight: 600; color: var(--muted); }
        .fc-icon { font-size: 24px; }
        .fc-high { font-size: 15px; font-weight: 700; color: var(--cream); }
        .fc-low  { font-size: 12px; color: var(--muted); }
        .fc-rain-wrap {
          width: 100%; display: flex;
          flex-direction: column; gap: 3px; align-items: center;
        }
        .fc-rain-bar {
          width: 100%; height: 3px;
          background: var(--border); border-radius: 2px; overflow: hidden;
        }
        .fc-rain-fill {
          height: 100%; background: #5ba8e8; border-radius: 2px;
        }
        .fc-rain-pct {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: #5ba8e8;
        }

        /* Advisories */
        .advisory-section {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .advisory-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-top: 16px;
        }
        .advisory-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; border-radius: 12px;
        }
        .advisory-card.amber { background: var(--alo); border: 1px solid rgba(232,162,69,0.2); }
        .advisory-card.red   { background: var(--rlo); border: 1px solid rgba(224,92,92,0.2);  }
        .advisory-card.green { background: var(--glo); border: 1px solid rgba(76,175,110,0.2); }
        .advisory-icon { font-size: 22px; flex-shrink: 0; }
        .advisory-title { font-size: 13px; font-weight: 600; color: var(--cream); margin-bottom: 4px; }
        .advisory-desc  { font-size: 12px; color: var(--muted); line-height: 1.5; }

        /* Skeleton */
        .skeleton {
          background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 16px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Error */
        .weather-error {
          background: var(--rlo); border: 1px solid rgba(224,92,92,0.25);
          border-radius: 12px; padding: 14px 18px;
          font-size: 13px; color: var(--red);
          display: flex; align-items: center; gap: 10px;
        }

        @media (max-width: 900px) {
          .weather-hero { grid-template-columns: 1fr; }
          .weather-main { border-right: none; border-bottom: 1px solid var(--border); padding-right: 0; padding-bottom: 20px; }
          .forecast-grid { grid-template-columns: repeat(4, 1fr); }
          .advisory-grid { grid-template-columns: 1fr; }
          .weather-metrics { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Weather</h1>
          <p className="view-sub">Real-time conditions and 7-day forecast for your farm location.</p>
        </div>
        {data && (
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, color: "var(--muted)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            📍 {data.location}
          </div>
        )}
      </div>

      {/* ── City Search ── */}
      <div className="weather-search-row">
        <input
          className="weather-search-input"
          placeholder="Search city… e.g. Indore, Bhopal, Nagpur"
          value={cityInput}
          onChange={e => setCityInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && cityInput.trim() && fetchByCity(cityInput.trim())}
        />
        <button
          className="action-btn green"
          onClick={() => cityInput.trim() && fetchByCity(cityInput.trim())}
          disabled={searching || !cityInput.trim()}
        >
          {searching ? "Searching…" : "🔍 Search"}
        </button>
        {data && (
          <button
            className="action-btn"
            onClick={() => {
              if (navigator.geolocation) {
                setLoading(true);
                navigator.geolocation.getCurrentPosition(
                  pos => fetchByCoords(pos.coords.latitude, pos.coords.longitude),
                  () => { setLoading(false); setError("GPS access denied."); }
                );
              }
            }}
          >
            📍 Use My Location
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="weather-error">
          ⚠️ {error}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 200 }} />
          <div className="skeleton" style={{ height: 140 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
      )}

      {/* ── Real Data ── */}
      {!loading && data && (
        <>
          {/* Current conditions */}
          <div className="weather-hero">
            <div className="weather-main">
              <div className="weather-icon-big">{data.current.icon}</div>
              <div className="weather-temp">{data.current.temp}°C</div>
              <div className="weather-condition">{data.current.description}</div>
              <div className="weather-feels">
                Feels like {data.current.feels_like}°C · Humidity {data.current.humidity}%
              </div>
            </div>

            <div className="weather-metrics">
              {[
                { icon: "💨", label: "Wind Speed",  val: `${data.current.wind_speed} km/h ${windDirection(data.current.wind_dir)}` },
                { icon: "🌡️", label: "UV Index",    val: `${data.current.uvi > 0 ? data.current.uvi : "N/A"} ${data.current.uv_label !== "N/A" ? `(${data.current.uv_label})` : ""}` },
                { icon: "👁️", label: "Visibility",  val: data.current.visibility },
                { icon: "📊", label: "Pressure",    val: `${data.current.pressure} hPa` },
                { icon: "💧", label: "Humidity",    val: `${data.current.humidity}%` },
                { icon: "🌅", label: "Sunrise",     val: data.current.sunrise },
                { icon: "🌇", label: "Sunset",      val: data.current.sunset },
                { icon: "🌧️", label: "Rain (1h)",   val: `${data.current.rain} mm` },
                { icon: "🌬️", label: "Wind Dir",    val: windDirection(data.current.wind_dir) },
              ].map(m => (
                <div key={m.label} className="weather-metric-card">
                  <div className="wm-icon">{m.icon}</div>
                  <div className="wm-lbl">{m.label}</div>
                  <div className="wm-val">{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-day forecast */}
          <div className="forecast-section">
            <div className="chart-box-title">7-Day Forecast</div>
            <div className="forecast-grid">
              {data.daily.map((d, i) => (
                <div key={i} className="forecast-card">
                  <div className="fc-day">{d.day}</div>
                  <div className="fc-icon">{d.icon}</div>
                  <div className="fc-high">{d.high}°</div>
                  <div className="fc-low">{d.low}°</div>
                  <div className="fc-rain-wrap">
                    <div className="fc-rain-bar">
                      <div className="fc-rain-fill" style={{ width: `${d.rain}%` }} />
                    </div>
                    <div className="fc-rain-pct">{d.rain}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Farm advisories */}
          <div className="advisory-section">
            <div className="chart-box-title">Farm Advisories</div>
            <div className="advisory-grid">
              {data.advisories.map((a, i) => (
                <div key={i} className={`advisory-card ${a.color}`}>
                  <div className="advisory-icon">{a.icon}</div>
                  <div>
                    <div className="advisory-title">{a.title}</div>
                    <div className="advisory-desc">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── No data yet (GPS denied, no search yet) ── */}
      {!loading && !data && !error && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 64, gap: 16, textAlign: "center",
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 52, opacity: 0.4 }}>🌦️</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: "var(--cream)" }}>
            Search for your city
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
            Type your city name above to get real-time weather and farm advisories.
          </p>
        </div>
      )}
    </div>
  );
}