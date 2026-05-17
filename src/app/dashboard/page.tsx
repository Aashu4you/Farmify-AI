"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Section = "overview" | "crops" | "disease" | "weather" | "scheduler" | "chatbot";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CROPS = [
  { id: 1, name: "Wheat", field: "Field 1", area: "3.2 ac", stage: "Flowering", health: 92, daysLeft: 24, status: "good" },
  { id: 2, name: "Rice", field: "Field 2", area: "2.8 ac", stage: "Tillering", health: 78, daysLeft: 55, status: "warn" },
  { id: 3, name: "Maize", field: "Field 3", area: "1.5 ac", stage: "Germination", health: 95, daysLeft: 80, status: "good" },
  { id: 4, name: "Soybean", field: "Field 4", area: "2.1 ac", stage: "Pod Fill", health: 61, daysLeft: 18, status: "bad" },
  { id: 5, name: "Cotton", field: "Field 5", area: "4.0 ac", stage: "Boll Dev.", health: 88, daysLeft: 42, status: "good" },
];

const TASKS = [
  { id: 1, title: "Irrigate Field 3 — Soil moisture critical", time: "Today, 6:00 PM", type: "irrigation", done: false },
  { id: 2, title: "Apply NPK fertilizer — Field 1 Wheat", time: "Tomorrow, 7:00 AM", type: "fertilizer", done: false },
  { id: 3, title: "Pest spray — Field 4 Soybean", time: "Wed, 8:00 AM", type: "spray", done: false },
  { id: 4, title: "Harvest check — Field 5 Cotton", time: "Thu, 9:00 AM", type: "harvest", done: true },
  { id: 5, title: "Soil test — Field 2 Rice", time: "Fri, 10:00 AM", type: "soil", done: false },
];

const WEATHER_DAYS = [
  { day: "Today", icon: "⛅", high: 32, low: 22, rain: 10 },
  { day: "Tue", icon: "☀️", high: 34, low: 24, rain: 0 },
  { day: "Wed", icon: "🌧️", high: 28, low: 20, rain: 85 },
  { day: "Thu", icon: "🌦️", high: 29, low: 21, rain: 40 },
  { day: "Fri", icon: "☀️", high: 35, low: 25, rain: 5 },
  { day: "Sat", icon: "⛅", high: 31, low: 22, rain: 15 },
  { day: "Sun", icon: "☀️", high: 33, low: 23, rain: 0 },
];

const YIELD_DATA = [38, 52, 45, 68, 60, 78, 72, 88, 82, 94, 90, 96];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: "overview",   label: "Overview",         icon: "◈" },
  { id: "crops",      label: "My Crops",          icon: "🌾" },
  { id: "disease",    label: "Disease Detection", icon: "🔬" },
  { id: "weather",    label: "Weather",           icon: "🌦️" },
  { id: "scheduler",  label: "Scheduler",         icon: "📅" },
  { id: "chatbot",    label: "AI Chatbot",        icon: "💬" },
];

// ─── Sub-views ────────────────────────────────────────────────────────────────

function Overview() {
  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Good morning, Aashu 👋</h1>
          <p className="view-sub">Here's what's happening on your farm today.</p>
        </div>
        <div className="view-date">Sun, 17 May 2026</div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {[
          { icon: "🌾", label: "Active Crops", value: "8", delta: "+2 this month", color: "green" },
          { icon: "🌱", label: "Avg Soil Health", value: "83%", delta: "▲ Good", color: "green" },
          { icon: "⚠️", label: "Disease Alerts", value: "1", delta: "Field 4 Soybean", color: "amber" },
          { icon: "📈", label: "Est. Revenue", value: "₹2.4L", delta: "+18% YoY", color: "green" },
          { icon: "💧", label: "Water Used", value: "3,200L", delta: "−30% vs last week", color: "green" },
          { icon: "📅", label: "Pending Tasks", value: "4", delta: "2 urgent today", color: "amber" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-val">{s.value}</div>
            <div className="stat-lbl">{s.label}</div>
            <div className={`stat-delta ${s.color}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Yield bar chart */}
        <div className="chart-box wide">
          <div className="chart-box-header">
            <span className="chart-box-title">Yield Forecast — 2026</span>
            <span className="chart-box-tag">tonnes/acre</span>
          </div>
          <div className="yield-chart">
            {YIELD_DATA.map((v, i) => (
              <div key={i} className="yield-col">
                <div className="yield-bar-wrap">
                  <div
                    className="yield-bar"
                    style={{ height: `${v}%`, opacity: i === 11 ? 1 : 0.55 + i * 0.04 }}
                  />
                </div>
                <div className="yield-month">{MONTHS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Crop health donut */}
        <div className="chart-box">
          <div className="chart-box-header">
            <span className="chart-box-title">Crop Health</span>
          </div>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(76,175,110,0.1)" strokeWidth="12" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#4caf6e" strokeWidth="12"
                strokeDasharray="184 92" strokeDashoffset="69" strokeLinecap="round" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#e8a245" strokeWidth="12"
                strokeDasharray="55 221" strokeDashoffset="-115" strokeLinecap="round" />
              <circle cx="60" cy="60" r="44" fill="none" stroke="#e05c5c" strokeWidth="12"
                strokeDasharray="37 239" strokeDashoffset="-170" strokeLinecap="round" />
            </svg>
            <div className="donut-center">
              <span className="donut-val">83%</span>
              <span className="donut-lbl">avg</span>
            </div>
          </div>
          <div className="donut-legend">
            {[["#4caf6e","Healthy","67%"],["#e8a245","Fair","20%"],["#e05c5c","Poor","13%"]].map(([c,l,v]) => (
              <div key={l} className="legend-row">
                <span className="legend-dot" style={{background:c}} />
                <span className="legend-lbl">{l}</span>
                <span className="legend-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts + recent tasks */}
      <div className="bottom-row">
        <div className="alert-box">
          <div className="chart-box-title" style={{marginBottom:16}}>Active Alerts</div>
          {[
            { icon:"💧", title:"Soil moisture critical — Field 3", sub:"Irrigate before 6 PM today", color:"amber" },
            { icon:"🦠", title:"Possible leaf blight — Field 4 Soybean", sub:"Upload image for AI diagnosis", color:"red" },
            { icon:"🌡️", title:"High temperature forecast — Wed", sub:"Shade netting recommended for seedlings", color:"amber" },
          ].map(a => (
            <div key={a.title} className={`alert-row ${a.color}`}>
              <span className="alert-row-icon">{a.icon}</span>
              <div>
                <div className="alert-row-title">{a.title}</div>
                <div className="alert-row-sub">{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="recent-tasks-box">
          <div className="chart-box-title" style={{marginBottom:16}}>Today's Tasks</div>
          {TASKS.slice(0,4).map(t => (
            <div key={t.id} className={`task-row ${t.done ? "done" : ""}`}>
              <span className="task-check">{t.done ? "✓" : "○"}</span>
              <div>
                <div className="task-title">{t.title}</div>
                <div className="task-time">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyCrops() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">My Crops</h1>
          <p className="view-sub">Track all active crops and field conditions.</p>
        </div>
        <button className="action-btn">+ Add Crop</button>
      </div>
      <div className="crops-table">
        <div className="crops-thead">
          {["Crop","Field","Area","Stage","Health","Days Left","Status"].map(h => (
            <div key={h} className="crops-th">{h}</div>
          ))}
        </div>
        {CROPS.map(c => (
          <div
            key={c.id}
            className={`crops-row ${selected === c.id ? "selected" : ""}`}
            onClick={() => setSelected(selected === c.id ? null : c.id)}
          >
            <div className="crops-td crop-name">{c.name}</div>
            <div className="crops-td muted">{c.field}</div>
            <div className="crops-td muted">{c.area}</div>
            <div className="crops-td">
              <span className="stage-pill">{c.stage}</span>
            </div>
            <div className="crops-td">
              <div className="health-bar-wrap">
                <div className="health-bar" style={{
                  width:`${c.health}%`,
                  background: c.health > 80 ? "#4caf6e" : c.health > 65 ? "#e8a245" : "#e05c5c"
                }} />
              </div>
              <span className="health-num">{c.health}%</span>
            </div>
            <div className="crops-td muted">{c.daysLeft}d</div>
            <div className="crops-td">
              <span className={`status-dot ${c.status}`} />
              <span className="muted" style={{fontSize:12}}>
                {c.status === "good" ? "Healthy" : c.status === "warn" ? "Monitor" : "Action needed"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (() => {
        const c = CROPS.find(x => x.id === selected)!;
        return (
          <div className="crop-detail">
            <div className="chart-box-title">{c.name} — {c.field} Detail</div>
            <div className="crop-detail-grid">
              {[
                ["Crop","name"],["Field","field"],["Area","area"],["Stage","stage"],
                ["Health",`${c.health}%`],["Days to Harvest",`${c.daysLeft} days`]
              ].map(([l,v]) => (
                <div key={l} className="crop-detail-cell">
                  <div className="crop-detail-lbl">{l}</div>
                  <div className="crop-detail-val">{(c as any)[v] ?? v}</div>
                </div>
              ))}
            </div>
            <div className="crop-actions">
              <button className="action-btn">📋 View History</button>
              <button className="action-btn amber">⚠️ Report Issue</button>
              <button className="action-btn">🔬 Run Disease Scan</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function DiseaseDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle"|"analyzing"|"done">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const analyze = () => {
    setStatus("analyzing");
    setTimeout(() => setStatus("done"), 2800);
  };

  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Disease Detection</h1>
          <p className="view-sub">Upload a crop leaf image — our CNN model identifies disease instantly.</p>
        </div>
      </div>

      <div className="disease-layout">
        <div className="disease-upload-col">
          <div
            className={`upload-zone ${preview ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef} type="file" accept="image/*" style={{display:"none"}}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {preview ? (
              <img src={preview} alt="Leaf" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">🍃</div>
                <div className="upload-text">Drop a leaf image here</div>
                <div className="upload-sub">or click to browse · JPG, PNG, WEBP</div>
              </div>
            )}
          </div>
          {preview && (
            <div className="upload-actions">
              <button className="action-btn" onClick={() => { setFile(null); setPreview(null); setStatus("idle"); }}>
                ✕ Clear
              </button>
              <button className="action-btn green" onClick={analyze} disabled={status === "analyzing"}>
                {status === "analyzing" ? "Analyzing…" : "🔬 Run Analysis"}
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="disease-tips">
            <div className="tips-title">Photo Tips</div>
            {["Capture the affected leaf clearly in natural light","Include both healthy and diseased portions","Avoid blurry or dark images","One leaf per upload for best results"].map(t => (
              <div key={t} className="tip-row"><span className="tip-dot" />  {t}</div>
            ))}
          </div>
        </div>

        <div className="disease-result-col">
          {status === "idle" && !preview && (
            <div className="result-empty">
              <div style={{fontSize:48,marginBottom:16}}>🔬</div>
              <div className="result-empty-title">Upload a leaf to begin</div>
              <div className="result-empty-sub">Results appear here after analysis</div>
            </div>
          )}
          {status === "idle" && preview && (
            <div className="result-empty">
              <div style={{fontSize:48,marginBottom:16}}>👆</div>
              <div className="result-empty-title">Ready to analyse</div>
              <div className="result-empty-sub">Click "Run Analysis" to detect disease</div>
            </div>
          )}
          {status === "analyzing" && (
            <div className="result-empty">
              <div className="spinner" />
              <div className="result-empty-title" style={{marginTop:20}}>Analysing image…</div>
              <div className="result-empty-sub">CNN model processing — takes ~3 seconds</div>
            </div>
          )}
          {status === "done" && (
            <div className="result-card">
              <div className="result-header">
                <span className="result-badge red">⚠️ Disease Detected</span>
                <span className="result-conf">94% confidence</span>
              </div>
              <div className="result-disease-name">Early Blight</div>
              <div className="result-disease-sci">Alternaria solani</div>
              <div className="result-section-title">Symptoms Identified</div>
              <div className="result-symptoms">
                {["Dark brown circular lesions","Yellowing around lesions (chlorosis)","Lesions with concentric rings","Lower leaves affected first"].map(s => (
                  <div key={s} className="symptom-row"><span style={{color:"#e8a245"}}>▸</span> {s}</div>
                ))}
              </div>
              <div className="result-section-title">Recommended Treatment</div>
              <div className="treatment-grid">
                {[
                  {icon:"💊",t:"Fungicide",d:"Apply Mancozeb 75WP @ 2g/L water every 7 days"},
                  {icon:"✂️",t:"Pruning",d:"Remove & destroy severely infected leaves immediately"},
                  {icon:"💧",t:"Irrigation",d:"Avoid overhead watering; switch to drip irrigation"},
                  {icon:"🌿",t:"Nutrition",d:"Apply potassium-rich fertilizer to boost immunity"},
                ].map(r => (
                  <div key={r.t} className="treatment-card">
                    <div className="treatment-icon">{r.icon}</div>
                    <div className="treatment-title">{r.t}</div>
                    <div className="treatment-desc">{r.d}</div>
                  </div>
                ))}
              </div>
              <div className="result-actions">
                <button className="action-btn green">📋 Save Report</button>
                <button className="action-btn">📤 Share with Expert</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Weather() {
  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Weather</h1>
          <p className="view-sub">Real-time conditions and 7-day forecast for your farm location.</p>
        </div>
        <div className="location-tag">📍 Indore, MP</div>
      </div>

      {/* Current conditions */}
      <div className="weather-hero">
        <div className="weather-main">
          <div className="weather-icon-big">⛅</div>
          <div className="weather-temp">32°C</div>
          <div className="weather-condition">Partly Cloudy</div>
          <div className="weather-feels">Feels like 35°C · Humidity 68%</div>
        </div>
        <div className="weather-metrics">
          {[
            {icon:"💨",label:"Wind Speed",val:"14 km/h NW"},
            {icon:"🌡️",label:"UV Index",val:"High (8)"},
            {icon:"👁️",label:"Visibility",val:"9 km"},
            {icon:"📊",label:"Pressure",val:"1008 hPa"},
            {icon:"💧",label:"Humidity",val:"68%"},
            {icon:"🌅",label:"Sunrise",val:"5:48 AM"},
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
        <div className="chart-box-title" style={{marginBottom:16}}>7-Day Forecast</div>
        <div className="forecast-grid">
          {WEATHER_DAYS.map(d => (
            <div key={d.day} className="forecast-card">
              <div className="fc-day">{d.day}</div>
              <div className="fc-icon">{d.icon}</div>
              <div className="fc-high">{d.high}°</div>
              <div className="fc-low">{d.low}°</div>
              <div className="fc-rain-wrap">
                <div className="fc-rain-bar">
                  <div className="fc-rain-fill" style={{width:`${d.rain}%`}} />
                </div>
                <div className="fc-rain-pct">{d.rain}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Farm advisories */}
      <div className="advisory-section">
        <div className="chart-box-title" style={{marginBottom:16}}>Farm Advisories</div>
        <div className="advisory-grid">
          {[
            {icon:"🌧️",color:"amber",title:"Heavy Rain Wednesday",desc:"Delay fertilizer application. Cover seedlings in Field 3 nursery."},
            {icon:"☀️",color:"red",title:"High UV Thursday–Friday",desc:"Risk of sunscald on Cotton bolls. Consider reflective mulch."},
            {icon:"💧",color:"green",title:"Irrigation Window",desc:"Optimal irrigation window: Tuesday 6–8 AM before heat sets in."},
            {icon:"🌬️",color:"green",title:"Good Spray Conditions",desc:"Low wind Monday morning. Ideal for pesticide application on Field 4."},
          ].map(a => (
            <div key={a.title} className={`advisory-card ${a.color}`}>
              <div className="advisory-icon">{a.icon}</div>
              <div>
                <div className="advisory-title">{a.title}</div>
                <div className="advisory-desc">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Scheduler() {
  const [tasks, setTasks] = useState(TASKS);
  const [newTask, setNewTask] = useState("");

  const toggle = (id: number) =>
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const add = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask, time: "Scheduled", type: "soil", done: false }]);
    setNewTask("");
  };

  const typeIcon: Record<string, string> = {
    irrigation: "💧", fertilizer: "🌿", spray: "🧪", harvest: "🌾", soil: "🪱"
  };

  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Scheduler</h1>
          <p className="view-sub">Plan farm tasks, reminders, and irrigation schedules.</p>
        </div>
      </div>

      <div className="scheduler-layout">
        {/* Task list */}
        <div className="task-list-col">
          <div className="add-task-row">
            <input
              className="task-input"
              placeholder="Add a task…"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
            />
            <button className="action-btn green" onClick={add}>Add</button>
          </div>

          <div className="tasks-section-label">Upcoming</div>
          {tasks.filter(t => !t.done).map(t => (
            <div key={t.id} className="sched-task-row" onClick={() => toggle(t.id)}>
              <span className="sched-check">{t.done ? "✓" : "○"}</span>
              <span className="task-type-icon">{typeIcon[t.type] || "📌"}</span>
              <div className="sched-task-body">
                <div className="sched-task-title">{t.title}</div>
                <div className="sched-task-time">{t.time}</div>
              </div>
            </div>
          ))}

          <div className="tasks-section-label" style={{marginTop:24}}>Completed</div>
          {tasks.filter(t => t.done).map(t => (
            <div key={t.id} className="sched-task-row done" onClick={() => toggle(t.id)}>
              <span className="sched-check done">✓</span>
              <span className="task-type-icon" style={{opacity:0.4}}>{typeIcon[t.type] || "📌"}</span>
              <div className="sched-task-body">
                <div className="sched-task-title done">{t.title}</div>
                <div className="sched-task-time">{t.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini calendar */}
        <div className="calendar-col">
          <div className="chart-box-title" style={{marginBottom:16}}>May 2026</div>
          <div className="mini-cal">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="cal-head">{d}</div>
            ))}
            {/* offset for May 2026 starting on Friday = 5 blanks */}
            {Array(5).fill(null).map((_,i) => <div key={`b${i}`} />)}
            {Array(31).fill(null).map((_,i) => {
              const day = i + 1;
              const hasTask = [3,7,9,14,17,21,28].includes(day);
              const isToday = day === 17;
              return (
                <div key={day} className={`cal-day ${isToday ? "today" : ""} ${hasTask ? "has-task" : ""}`}>
                  {day}
                  {hasTask && <span className="cal-dot" />}
                </div>
              );
            })}
          </div>

          {/* Upcoming reminders */}
          <div className="chart-box-title" style={{margin:"24px 0 12px"}}>Reminders</div>
          {[
            {icon:"💊",text:"Fungicide — Field 4",when:"Tomorrow"},
            {icon:"🌿",text:"NPK application — Field 1",when:"Wed"},
            {icon:"🌾",text:"Harvest window opens — Field 5",when:"Sat"},
          ].map(r => (
            <div key={r.text} className="reminder-row">
              <span className="reminder-icon">{r.icon}</span>
              <div className="reminder-text">{r.text}</div>
              <div className="reminder-when">{r.when}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIChatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Namaste! I'm your Farmify AI assistant. Ask me anything about crops, soil, disease, weather, or best practices for your farm. 🌾" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "Best crop for black soil in May?",
    "How to treat early blight?",
    "When should I irrigate wheat?",
    "What fertilizer for rice tillering?",
  ];

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are Farmify AI, an expert agricultural assistant for Indian farmers. You give practical, concise advice on crops, soil health, disease treatment, irrigation, fertilizers, and weather-based farming decisions. Focus on crops common to India. Keep answers clear and actionable. Use emojis sparingly for readability.",
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "Connection error. Please check your network and try again." }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="view-root chatbot-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">AI Chatbot</h1>
          <p className="view-sub">Ask anything about your farm — powered by Claude AI.</p>
        </div>
        <div className="ai-badge">⚡ Claude AI</div>
      </div>

      <div className="chat-layout">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble-wrap ${m.role}`}>
              {m.role === "assistant" && <div className="chat-avatar">🌾</div>}
              <div className={`chat-bubble ${m.role}`}>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-avatar">🌾</div>
              <div className="chat-bubble assistant typing">
                <span className="dot-1">●</span>
                <span className="dot-2">●</span>
                <span className="dot-3">●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="suggestion-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Ask about crops, disease, soil, weather…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            disabled={loading}
          />
          <button className="chat-send" onClick={() => send(input)} disabled={loading || !input.trim()}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [active, setActive] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);

  const views: Record<Section, JSX.Element> = {
    overview: <Overview />,
    crops: <MyCrops />,
    disease: <DiseaseDetection />,
    weather: <Weather />,
    scheduler: <Scheduler />,
    chatbot: <AIChatbot />,
  };

  return (
    <div className="dash-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg:      #090f0a;
          --bg2:     #0e1a10;
          --bg3:     #111f13;
          --bg4:     #152018;
          --green:   #4caf6e;
          --gdim:    #2d7a47;
          --glo:     rgba(76,175,110,0.12);
          --gmd:     rgba(76,175,110,0.22);
          --amber:   #e8a245;
          --alo:     rgba(232,162,69,0.12);
          --red:     #e05c5c;
          --rlo:     rgba(224,92,92,0.12);
          --cream:   #dde8c8;
          --muted:   #7a9068;
          --border:  rgba(76,175,110,0.15);
          --border2: rgba(76,175,110,0.28);
          --sidebar-w: 240px;
          --sidebar-collapsed: 64px;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        body {
          background: var(--bg);
          color: var(--cream);
          font-family: 'Syne', sans-serif;
          font-weight: 400;
        }

        .dash-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg);
        }

        /* ── SIDEBAR */
        .sidebar {
          width: var(--sidebar-w);
          min-height: 100vh;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: width 0.25s ease;
          flex-shrink: 0;
          position: sticky; top: 0; height: 100vh;
          overflow: hidden;
        }
        .sidebar.collapsed { width: var(--sidebar-collapsed); }

        .sidebar-top {
          padding: 20px 16px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          min-height: 64px;
        }
        .sidebar-logo {
          font-weight: 800; font-size: 16px; color: var(--cream);
          white-space: nowrap; overflow: hidden;
          display: flex; align-items: center; gap: 8px;
        }
        .sidebar-logo em { color: var(--green); font-style: normal; }
        .collapse-btn {
          background: none; border: none; color: var(--muted);
          cursor: pointer; font-size: 14px; padding: 4px;
          flex-shrink: 0; transition: color 0.2s;
        }
        .collapse-btn:hover { color: var(--cream); }

        .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }

        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px;
          cursor: pointer; transition: all 0.18s;
          white-space: nowrap; color: var(--muted);
          font-size: 13px; font-weight: 500;
          border: 1px solid transparent;
          text-decoration: none;
        }
        .nav-item:hover { background: var(--glo); color: var(--cream); }
        .nav-item.active {
          background: var(--glo); color: var(--green);
          border-color: var(--border2);
        }
        .nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
        .nav-label { overflow: hidden; }

        .sidebar-bottom {
          padding: 12px 8px;
          border-top: 1px solid var(--border);
        }
        .user-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          overflow: hidden;
        }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--gmd); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--green); flex-shrink: 0;
        }
        .user-name { font-size: 13px; font-weight: 600; color: var(--cream); white-space: nowrap; overflow: hidden; }
        .user-role { font-size: 11px; color: var(--muted); }

        /* ── MAIN */
        .main {
          flex: 1; overflow-y: auto;
          background: var(--bg);
          min-width: 0;
        }

        /* top bar */
        .topbar {
          height: 64px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; background: var(--bg); position: sticky; top: 0; z-index: 10;
        }
        .topbar-left { font-size: 13px; color: var(--muted); }
        .topbar-left strong { color: var(--cream); font-weight: 600; }
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-icon-btn {
          width: 36px; height: 36px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 15px; color: var(--muted);
          transition: all 0.2s;
        }
        .topbar-icon-btn:hover { border-color: var(--border2); color: var(--cream); }
        .notif-dot {
          position: relative;
        }
        .notif-dot::after {
          content: ''; position: absolute; top: 6px; right: 6px;
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--amber);
        }

        /* ── VIEWS */
        .view-root { padding: 32px; display: flex; flex-direction: column; gap: 24px; }
        .chatbot-root { height: calc(100vh - 64px); overflow: hidden; padding-bottom: 0; }

        .view-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .view-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: var(--cream); line-height: 1.1;
        }
        .view-sub { font-size: 14px; color: var(--muted); margin-top: 4px; }
        .view-date { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--muted); padding-top: 6px; }
        .location-tag { font-size: 13px; color: var(--muted); padding-top: 6px; }
        .ai-badge {
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
          color: var(--green); background: var(--glo);
          border: 1px solid var(--border2); border-radius: 100px;
          padding: 5px 12px; letter-spacing: 0.06em;
        }

        /* ── STAT CARDS */
        .stats-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; }
        .stat-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; padding: 18px 16px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: var(--border2); }
        .stat-icon { font-size: 20px; margin-bottom: 8px; }
        .stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 700; color: var(--cream);
        }
        .stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .stat-delta { font-size: 11px; margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
        .stat-delta.green { color: var(--green); }
        .stat-delta.amber { color: var(--amber); }

        /* ── CHARTS */
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        .chart-box {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .chart-box.wide {}
        .chart-box-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .chart-box-title { font-size: 13px; font-weight: 600; color: var(--cream); }
        .chart-box-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }

        .yield-chart { display: flex; align-items: flex-end; gap: 6px; height: 100px; }
        .yield-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .yield-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
        .yield-bar { width: 100%; background: linear-gradient(to top, var(--gdim), var(--green)); border-radius: 3px 3px 0 0; transition: opacity 0.2s; }
        .yield-month { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); }

        .donut-wrap { position: relative; width: 120px; height: 120px; margin: 0 auto 16px; }
        .donut-svg { width: 120px; height: 120px; transform: rotate(-90deg); }
        .donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .donut-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--cream); }
        .donut-lbl { font-size: 10px; color: var(--muted); }
        .donut-legend { display: flex; flex-direction: column; gap: 8px; }
        .legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-lbl { flex: 1; }
        .legend-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--cream); }

        /* ── BOTTOM ROW */
        .bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .alert-box, .recent-tasks-box {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .alert-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px; border-radius: 10px; margin-bottom: 8px;
        }
        .alert-row.amber { background: var(--alo); border: 1px solid rgba(232,162,69,0.2); }
        .alert-row.red { background: var(--rlo); border: 1px solid rgba(224,92,92,0.2); }
        .alert-row-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .alert-row-title { font-size: 13px; font-weight: 600; color: var(--cream); }
        .alert-row-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .task-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border);
        }
        .task-row:last-child { border-bottom: none; }
        .task-row.done { opacity: 0.45; }
        .task-check { font-size: 14px; color: var(--green); flex-shrink: 0; margin-top: 1px; }
        .task-title { font-size: 13px; color: var(--cream); }
        .task-time { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

        /* ── CROPS TABLE */
        .crops-table { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .crops-thead {
          display: grid; grid-template-columns: 1.2fr 1fr 0.8fr 1fr 1.2fr 0.8fr 1fr;
          background: var(--bg3); padding: 12px 20px;
          border-bottom: 1px solid var(--border);
        }
        .crops-th { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; }
        .crops-row {
          display: grid; grid-template-columns: 1.2fr 1fr 0.8fr 1fr 1.2fr 0.8fr 1fr;
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: background 0.15s; align-items: center;
        }
        .crops-row:last-child { border-bottom: none; }
        .crops-row:hover { background: var(--bg3); }
        .crops-row.selected { background: var(--glo); border-color: var(--border2); }
        .crops-td { font-size: 13px; color: var(--cream); display: flex; align-items: center; gap: 6px; }
        .crop-name { font-weight: 600; }
        .muted { color: var(--muted) !important; }
        .stage-pill {
          font-size: 11px; background: var(--glo); color: var(--green);
          border: 1px solid var(--border2); padding: 2px 8px; border-radius: 100px;
        }
        .health-bar-wrap { width: 60px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .health-bar { height: 100%; border-radius: 2px; transition: width 0.3s; }
        .health-num { font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .status-dot.good { background: var(--green); }
        .status-dot.warn { background: var(--amber); }
        .status-dot.bad { background: var(--red); }
        .crop-detail {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 16px; padding: 24px;
        }
        .crop-detail-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin: 16px 0; }
        .crop-detail-cell { background: var(--bg3); border-radius: 10px; padding: 12px 16px; }
        .crop-detail-lbl { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
        .crop-detail-val { font-size: 15px; font-weight: 600; color: var(--cream); }
        .crop-actions { display: flex; gap: 10px; flex-wrap: wrap; }

        /* ── ACTION BUTTONS */
        .action-btn {
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          padding: 9px 18px; border-radius: 9px;
          border: 1px solid var(--border2); color: var(--cream);
          background: var(--bg3); cursor: pointer; transition: all 0.2s;
          white-space: nowrap;
        }
        .action-btn:hover { border-color: var(--green); background: var(--glo); }
        .action-btn.green { background: var(--green); color: #060e07; border-color: var(--green); }
        .action-btn.green:hover { background: #6dd98a; }
        .action-btn.amber { border-color: rgba(232,162,69,0.4); color: var(--amber); }
        .action-btn.amber:hover { background: var(--alo); }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── DISEASE DETECTION */
        .disease-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; flex: 1; }
        .disease-upload-col { display: flex; flex-direction: column; gap: 16px; }
        .disease-result-col {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; overflow-y: auto; min-height: 400px;
        }
        .upload-zone {
          border: 2px dashed var(--border2); border-radius: 16px;
          min-height: 260px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; overflow: hidden;
          background: var(--bg2);
        }
        .upload-zone:hover { border-color: var(--green); background: var(--glo); }
        .upload-zone.has-file { border-style: solid; padding: 0; }
        .upload-preview { width: 100%; height: 260px; object-fit: cover; }
        .upload-placeholder { text-align: center; padding: 32px; }
        .upload-icon { font-size: 48px; margin-bottom: 12px; }
        .upload-text { font-size: 15px; font-weight: 600; color: var(--cream); margin-bottom: 6px; }
        .upload-sub { font-size: 13px; color: var(--muted); }
        .upload-actions { display: flex; gap: 10px; }
        .disease-tips {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 18px;
        }
        .tips-title { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 10px; }
        .tip-row { font-size: 13px; color: var(--muted); display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
        .tip-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); flex-shrink: 0; margin-top: 6px; }

        .result-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 48px; text-align: center; }
        .result-empty-title { font-size: 16px; font-weight: 600; color: var(--cream); margin-bottom: 6px; }
        .result-empty-sub { font-size: 13px; color: var(--muted); }
        .spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid var(--border); border-top-color: var(--green);
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .result-card { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .result-header { display: flex; align-items: center; justify-content: space-between; }
        .result-badge { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 100px; }
        .result-badge.red { background: var(--rlo); color: var(--red); border: 1px solid rgba(224,92,92,0.3); }
        .result-conf { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--green); }
        .result-disease-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: var(--cream); }
        .result-disease-sci { font-size: 13px; color: var(--muted); font-style: italic; margin-top: -8px; }
        .result-section-title { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; border-top: 1px solid var(--border); padding-top: 14px; }
        .result-symptoms { display: flex; flex-direction: column; gap: 6px; }
        .symptom-row { font-size: 13px; color: var(--muted); display: flex; gap: 8px; }
        .treatment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .treatment-card { background: var(--bg3); border-radius: 12px; padding: 14px; }
        .treatment-icon { font-size: 20px; margin-bottom: 6px; }
        .treatment-title { font-size: 12px; font-weight: 700; color: var(--green); margin-bottom: 4px; }
        .treatment-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }
        .result-actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }

        /* ── WEATHER */
        .weather-hero {
          display: grid; grid-template-columns: 240px 1fr;
          gap: 20px; background: var(--bg2); border: 1px solid var(--border);
          border-radius: 20px; padding: 28px; align-items: center;
        }
        .weather-main { text-align: center; border-right: 1px solid var(--border); padding-right: 28px; }
        .weather-icon-big { font-size: 56px; margin-bottom: 8px; }
        .weather-temp { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 700; color: var(--cream); line-height: 1; }
        .weather-condition { font-size: 15px; color: var(--muted); margin-top: 4px; }
        .weather-feels { font-size: 12px; color: var(--muted); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
        .weather-metrics { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
        .weather-metric-card { background: var(--bg3); border-radius: 12px; padding: 14px; }
        .wm-icon { font-size: 18px; margin-bottom: 4px; }
        .wm-lbl { font-size: 11px; color: var(--muted); margin-bottom: 2px; }
        .wm-val { font-size: 13px; font-weight: 600; color: var(--cream); }

        .forecast-section { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
        .forecast-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 8px; }
        .forecast-card {
          background: var(--bg3); border-radius: 12px; padding: 14px 8px;
          text-align: center; display: flex; flex-direction: column; gap: 6px; align-items: center;
        }
        .fc-day { font-size: 11px; font-weight: 600; color: var(--muted); }
        .fc-icon { font-size: 24px; }
        .fc-high { font-size: 15px; font-weight: 700; color: var(--cream); }
        .fc-low { font-size: 12px; color: var(--muted); }
        .fc-rain-wrap { width: 100%; display: flex; flex-direction: column; gap: 3px; align-items: center; }
        .fc-rain-bar { width: 100%; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .fc-rain-fill { height: 100%; background: #5ba8e8; border-radius: 2px; }
        .fc-rain-pct { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #5ba8e8; }

        .advisory-section { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
        .advisory-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .advisory-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; border-radius: 12px;
        }
        .advisory-card.amber { background: var(--alo); border: 1px solid rgba(232,162,69,0.2); }
        .advisory-card.red { background: var(--rlo); border: 1px solid rgba(224,92,92,0.2); }
        .advisory-card.green { background: var(--glo); border: 1px solid rgba(76,175,110,0.2); }
        .advisory-icon { font-size: 22px; flex-shrink: 0; }
        .advisory-title { font-size: 13px; font-weight: 600; color: var(--cream); margin-bottom: 4px; }
        .advisory-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

        /* ── SCHEDULER */
        .scheduler-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
        .task-list-col { display: flex; flex-direction: column; gap: 8px; }
        .add-task-row { display: flex; gap: 8px; }
        .task-input {
          flex: 1; background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 9px; padding: 10px 14px; font-size: 13px;
          color: var(--cream); font-family: 'Syne', sans-serif; outline: none;
          transition: border-color 0.2s;
        }
        .task-input:focus { border-color: var(--green); }
        .task-input::placeholder { color: var(--muted); }
        .tasks-section-label { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 8px; padding: 0 4px; }
        .sched-task-row {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.18s;
        }
        .sched-task-row:hover { border-color: var(--border2); }
        .sched-task-row.done { opacity: 0.45; }
        .sched-check { font-size: 14px; color: var(--green); flex-shrink: 0; }
        .sched-check.done { color: var(--muted); }
        .task-type-icon { font-size: 16px; flex-shrink: 0; }
        .sched-task-body { flex: 1; }
        .sched-task-title { font-size: 13px; color: var(--cream); }
        .sched-task-title.done { text-decoration: line-through; color: var(--muted); }
        .sched-task-time { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

        .calendar-col {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px; position: sticky; top: 80px;
        }
        .mini-cal { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; margin-bottom: 4px; }
        .cal-head { font-size: 10px; color: var(--muted); text-align: center; font-weight: 600; padding: 4px 0; }
        .cal-day {
          font-size: 12px; color: var(--muted); text-align: center;
          padding: 6px 4px; border-radius: 6px; cursor: pointer;
          position: relative; transition: all 0.15s;
        }
        .cal-day:hover { background: var(--glo); color: var(--cream); }
        .cal-day.today { background: var(--green); color: #060e07; font-weight: 700; border-radius: 6px; }
        .cal-day.has-task { color: var(--cream); }
        .cal-dot {
          position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%; background: var(--amber);
        }
        .cal-day.today .cal-dot { background: #060e07; }
        .reminder-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--border);
        }
        .reminder-row:last-child { border-bottom: none; }
        .reminder-icon { font-size: 16px; }
        .reminder-text { flex: 1; font-size: 12px; color: var(--cream); }
        .reminder-when { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

        /* ── CHATBOT */
        .chat-layout { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
        .chat-messages {
          flex: 1; overflow-y: auto; display: flex; flex-direction: column;
          gap: 16px; padding: 16px 0 8px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
        .chat-bubble-wrap { display: flex; align-items: flex-end; gap: 10px; }
        .chat-bubble-wrap.user { flex-direction: row-reverse; }
        .chat-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: var(--glo);
          border: 1px solid var(--border2); display: flex; align-items: center;
          justify-content: center; font-size: 14px; flex-shrink: 0;
        }
        .chat-bubble {
          max-width: 70%; padding: 12px 16px; border-radius: 16px;
          font-size: 14px; line-height: 1.6; white-space: pre-wrap;
        }
        .chat-bubble.assistant {
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--cream); border-bottom-left-radius: 4px;
        }
        .chat-bubble.user {
          background: var(--green); color: #060e07; font-weight: 500;
          border-bottom-right-radius: 4px;
        }
        .chat-bubble.typing { display: flex; align-items: center; gap: 4px; padding: 14px 18px; }
        .dot-1,.dot-2,.dot-3 { font-size: 10px; color: var(--muted); animation: bounce 1.2s infinite; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }

        .chat-suggestions { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 0; }
        .suggestion-chip {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 100px; padding: 7px 14px; font-size: 12px;
          color: var(--muted); cursor: pointer; transition: all 0.18s;
          font-family: 'Syne', sans-serif;
        }
        .suggestion-chip:hover { border-color: var(--green); color: var(--cream); background: var(--glo); }

        .chat-input-row {
          display: flex; gap: 10px; padding: 16px 0 24px;
          border-top: 1px solid var(--border); margin-top: 4px;
        }
        .chat-input {
          flex: 1; background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 12px; padding: 12px 18px; font-size: 14px;
          color: var(--cream); font-family: 'Syne', sans-serif; outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus { border-color: var(--green); }
        .chat-input::placeholder { color: var(--muted); }
        .chat-input:disabled { opacity: 0.5; }
        .chat-send {
          width: 46px; height: 46px; border-radius: 12px;
          background: var(--green); color: #060e07; font-size: 18px; font-weight: 700;
          border: none; cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .chat-send:hover:not(:disabled) { background: #6dd98a; }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── RESPONSIVE */
        @media (max-width: 1280px) {
          .stats-grid { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 900px) {
          .charts-row { grid-template-columns: 1fr; }
          .bottom-row { grid-template-columns: 1fr; }
          .disease-layout { grid-template-columns: 1fr; }
          .scheduler-layout { grid-template-columns: 1fr; }
          .weather-hero { grid-template-columns: 1fr; }
          .weather-main { border-right: none; border-bottom: 1px solid var(--border); padding-right: 0; padding-bottom: 20px; }
          .forecast-grid { grid-template-columns: repeat(4,1fr); }
          .advisory-grid { grid-template-columns: 1fr; }
          .crops-thead,.crops-row { grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr; }
          .crops-td:nth-child(2),.crops-th:nth-child(2) { display: none; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr); }
          .view-root { padding: 16px; }
          .forecast-grid { grid-template-columns: repeat(3,1fr); }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-top">
          {!collapsed && <div className="sidebar-logo">🌾 Farmify<em>AI</em></div>}
          <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => setActive(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-row">
            <div className="user-avatar">AA</div>
            {!collapsed && (
              <div>
                <div className="user-name">Aashu</div>
                <div className="user-role">Farmer</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <strong>{NAV_ITEMS.find(n => n.id === active)?.label}</strong>
            <span> · Farmify AI</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-icon-btn notif-dot" title="Notifications">🔔</div>
            <div className="topbar-icon-btn" title="Settings">⚙️</div>
            <div className="user-avatar" style={{width:36,height:36,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--green)",background:"var(--glo)",border:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%"}}>AA</div>
          </div>
        </div>

        {/* Active view */}
        {views[active]}
      </div>
    </div>
  );
}