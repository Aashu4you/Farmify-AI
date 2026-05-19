import fetch from "node-fetch";

const BASE = "https://api.openweathermap.org/data/2.5";
const GEO  = "https://api.openweathermap.org/geo/1.0";

// ── helpers ───────────────────────────────────────────────────────────────────

const weatherIcon = (code) => {
  if (code >= 200 && code < 300) return "⛈️";
  if (code >= 300 && code < 400) return "🌦️";
  if (code >= 500 && code < 600) return "🌧️";
  if (code >= 600 && code < 700) return "❄️";
  if (code >= 700 && code < 800) return "🌫️";
  if (code === 800)               return "☀️";
  if (code === 801)               return "🌤️";
  if (code <= 804)                return "⛅";
  return "🌡️";
};

const uvLabel = (uvi) => {
  if (uvi <= 2)  return "Low";
  if (uvi <= 5)  return "Moderate";
  if (uvi <= 7)  return "High";
  if (uvi <= 10) return "Very High";
  return "Extreme";
};

const getFarmAdvisories = (current, daily) => {
  const advisories = [];
  const rain       = current.rain?.["1h"] || 0;
  const windSpeed  = current.wind_speed;
  const humidity   = current.humidity;
  const temp       = current.temp;
  const uvi        = current.uvi || 0;

  // Check next 3 days for heavy rain
  const heavyRainDay = daily.slice(0, 3).find(
    (d) => (d.rain || 0) > 10 || d.pop > 0.7
  );
  if (heavyRainDay) {
    const dayName = new Date(heavyRainDay.dt * 1000).toLocaleDateString("en-IN", { weekday: "long" });
    advisories.push({
      icon: "🌧️",
      color: "amber",
      title: `Heavy Rain Expected — ${dayName}`,
      desc: "Delay fertilizer and pesticide application. Cover nursery seedlings.",
    });
  }

  // High UV
  if (uvi >= 7) {
    advisories.push({
      icon: "☀️",
      color: "red",
      title: "High UV Index Today",
      desc: "Risk of sunscald on tender crops. Consider shade netting for seedlings.",
    });
  }

  // Good spray window
  if (windSpeed < 15 && humidity < 80 && rain === 0) {
    advisories.push({
      icon: "🌿",
      color: "green",
      title: "Good Conditions for Spraying",
      desc: "Low wind and no rain — ideal window for pesticide or fertilizer application.",
    });
  }

  // Irrigation advice
  if (humidity < 40 && rain === 0) {
    advisories.push({
      icon: "💧",
      color: "amber",
      title: "Low Humidity — Irrigation Recommended",
      desc: `Humidity at ${humidity}%. Consider irrigating fields early morning or evening.`,
    });
  }

  // High wind
  if (windSpeed > 30) {
    advisories.push({
      icon: "🌬️",
      color: "red",
      title: "Strong Winds Warning",
      desc: `Wind speed at ${Math.round(windSpeed)} km/h. Secure greenhouse covers and young plants.`,
    });
  }

  // Cold temperature
  if (temp < 10) {
    advisories.push({
      icon: "🥶",
      color: "amber",
      title: "Cold Temperature Alert",
      desc: `Temperature at ${Math.round(temp)}°C. Protect frost-sensitive crops with covers.`,
    });
  }

  // High temp
  if (temp > 38) {
    advisories.push({
      icon: "🌡️",
      color: "red",
      title: "Extreme Heat Warning",
      desc: `Temperature at ${Math.round(temp)}°C. Irrigate early morning. Avoid midday field work.`,
    });
  }

  // Default if nothing triggered
  if (advisories.length === 0) {
    advisories.push({
      icon: "✅",
      color: "green",
      title: "Favourable Conditions Today",
      desc: "Weather looks good for most farm activities. Good day to inspect crops.",
    });
  }

  return advisories.slice(0, 4);
};

// ── controller ────────────────────────────────────────────────────────────────

export const getWeather = async (req, res) => {
  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    console.log("[weather] API_KEY present:", !!API_KEY);
    if (!API_KEY) {
      return res.status(500).json({ message: "OPENWEATHER_API_KEY not set in .env" });
    }

    let { lat, lon, city } = req.query;

    // If city name provided, geocode it first
    if (city && (!lat || !lon)) {
      const geoRes  = await fetch(
        `${GEO}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
      );
      const geoData = await geoRes.json();

      if (!geoData || geoData.length === 0) {
        return res.status(404).json({ message: `City "${city}" not found` });
      }

      lat  = geoData[0].lat;
      lon  = geoData[0].lon;
      city = geoData[0].name;
    }

    if (!lat || !lon) {
      return res.status(400).json({ message: "Provide lat/lon or city name" });
    }

    // Fetch current + hourly + daily in one call (One Call API 3.0 or 2.5)
    const oneCallRes = await fetch(
      `${BASE}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`
    );

    if (!oneCallRes.ok) {
      // Fallback: One Call 3.0 requires paid plan on some accounts
      // Use separate current + forecast endpoints instead
      const [curRes, fcastRes] = await Promise.all([
        fetch(`${BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
        fetch(`${BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=40&appid=${API_KEY}`),
      ]);

      const cur    = await curRes.json();
      const fcast  = await fcastRes.json();

      if (cur.cod !== 200 && cur.cod !== undefined && cur.cod !== "200") {
        return res.status(400).json({ message: cur.message || "Weather fetch failed" });
      }

      // Build daily from 3-hour forecast (take noon slot per day)
      const dailyMap = {};
      fcast.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toDateString();
        const hour = new Date(item.dt * 1000).getHours();
        if (!dailyMap[date] || Math.abs(hour - 12) < Math.abs(new Date(dailyMap[date].dt * 1000).getHours() - 12)) {
          dailyMap[date] = item;
        }
      });

      const daily7 = Object.values(dailyMap).slice(0, 7).map((item, i) => ({
        dt:        item.dt,
        day:       i === 0 ? "Today" : new Date(item.dt * 1000).toLocaleDateString("en-IN", { weekday: "short" }),
        icon:      weatherIcon(item.weather[0].id),
        condition: item.weather[0].main,
        high:      Math.round(item.main.temp_max),
        low:       Math.round(item.main.temp_min),
        rain:      Math.round((item.pop || 0) * 100),
      }));

      const currentData = {
        temp:        Math.round(cur.main.temp),
        feels_like:  Math.round(cur.main.feels_like),
        humidity:    cur.main.humidity,
        condition:   cur.weather[0].main,
        description: cur.weather[0].description,
        icon:        weatherIcon(cur.weather[0].id),
        wind_speed:  Math.round(cur.wind.speed * 3.6), // m/s → km/h
        wind_dir:    cur.wind.deg,
        visibility:  cur.visibility ? `${(cur.visibility / 1000).toFixed(1)} km` : "N/A",
        pressure:    cur.main.pressure,
        uvi:         0,
        uv_label:    "N/A",
        sunrise:     new Date(cur.sys.sunrise * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        sunset:      new Date(cur.sys.sunset  * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        rain:        cur.rain?.["1h"] || 0,
      };

      return res.json({
        location:   city || cur.name,
        lat, lon,
        current:    currentData,
        daily:      daily7,
        advisories: getFarmAdvisories(
          { ...currentData, wind_speed: cur.wind.speed * 3.6, uvi: 0 },
          fcast.list.map(i => ({ dt: i.dt, rain: 0, pop: i.pop || 0 }))
        ),
      });
    }

    // One Call success path
    const data    = await oneCallRes.json();
    const current = data.current;
    const daily   = data.daily;

    const currentData = {
      temp:        Math.round(current.temp),
      feels_like:  Math.round(current.feels_like),
      humidity:    current.humidity,
      condition:   current.weather[0].main,
      description: current.weather[0].description,
      icon:        weatherIcon(current.weather[0].id),
      wind_speed:  Math.round(current.wind_speed * 3.6),
      wind_dir:    current.wind_deg,
      visibility:  current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : "N/A",
      pressure:    current.pressure,
      uvi:         current.uvi,
      uv_label:    uvLabel(current.uvi),
      sunrise:     new Date(current.sunrise * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      sunset:      new Date(current.sunset  * 1000).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      rain:        current.rain?.["1h"] || 0,
    };

    const daily7 = daily.slice(0, 7).map((d, i) => ({
      dt:        d.dt,
      day:       i === 0 ? "Today" : new Date(d.dt * 1000).toLocaleDateString("en-IN", { weekday: "short" }),
      icon:      weatherIcon(d.weather[0].id),
      condition: d.weather[0].main,
      high:      Math.round(d.temp.max),
      low:       Math.round(d.temp.min),
      rain:      Math.round((d.pop || 0) * 100),
    }));

    return res.json({
      location:   city || data.timezone.split("/").pop().replace("_", " "),
      lat, lon,
      current:    currentData,
      daily:      daily7,
      advisories: getFarmAdvisories(current, daily),
    });

  } catch (error) {
    console.error("[weather]", error.message);
    res.status(500).json({ message: error.message });
  }
};