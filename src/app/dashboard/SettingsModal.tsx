"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SettingsState {
  // Notifications
  emailAlerts: boolean;
  smsAlerts: boolean;
  diseaseAlerts: boolean;
  weatherAlerts: boolean;
  taskReminders: boolean;
  reminderMinutes: number;

  // Display
  language: string;
  units: "metric" | "imperial";
  currency: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

  // Farm
  farmSize: string;
  farmSizeUnit: "acres" | "hectares" | "bigha";
  primaryCrop: string;
  soilType: string;
  irrigationType: string;

  // Privacy
  shareData: boolean;
  analytics: boolean;
}

const DEFAULTS: SettingsState = {
  emailAlerts: true,
  smsAlerts: false,
  diseaseAlerts: true,
  weatherAlerts: true,
  taskReminders: true,
  reminderMinutes: 30,
  language: "en",
  units: "metric",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  farmSize: "",
  farmSizeUnit: "acres",
  primaryCrop: "",
  soilType: "",
  irrigationType: "",
  shareData: false,
  analytics: true,
};

const STORAGE_KEY = "farmify_settings";

interface Props {
  onClose: () => void;
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 100,
        background: on ? "var(--green)" : "var(--bg4)",
        border: `1px solid ${on ? "var(--green)" : "var(--border2)"}`,
        cursor: "pointer", position: "relative",
        transition: "all 0.22s", flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: on ? 22 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "#060e07" : "var(--muted)",
        transition: "left 0.22s",
        display: "block",
      }} />
    </button>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="s-select"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<"notifications" | "display" | "farm" | "privacy">("notifications");
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    setDirty(true);
    setSaved(false);
  };

  const TABS = [
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "display",       label: "Display",       icon: "🎨" },
    { id: "farm",          label: "Farm Setup",    icon: "🌾" },
    { id: "privacy",       label: "Privacy",       icon: "🔒" },
  ] as const;

  return (
    <>
      <style>{`
        .s-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(6,14,7,0.88);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: sFadeIn 0.2s ease;
        }
        @keyframes sFadeIn { from{opacity:0} to{opacity:1} }

        .s-modal {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 24px; width: 100%; max-width: 640px;
          max-height: 90vh; display: flex; flex-direction: column;
          animation: sSlideUp 0.25s ease;
          overflow: hidden;
        }
        @keyframes sSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Header */
        .s-header {
          padding: 28px 32px 20px;
          display: flex; align-items: flex-start; justify-content: space-between;
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .s-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700; color: var(--cream);
        }
        .s-subtitle { font-size: 13px; color: var(--muted); margin-top: 3px; }
        .s-close {
          background: none; border: 1px solid var(--border);
          color: var(--muted); width: 34px; height: 34px;
          border-radius: 9px; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .s-close:hover { border-color: var(--border2); color: var(--cream); }

        /* Layout */
        .s-layout {
          display: flex; flex: 1; min-height: 0; overflow: hidden;
        }

        /* Sidebar tabs */
        .s-tabs {
          width: 160px; flex-shrink: 0;
          border-right: 1px solid var(--border);
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 2px;
          background: var(--bg3);
        }
        .s-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: var(--muted);
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.18s; background: none;
          font-family: 'Syne', sans-serif; text-align: left;
          white-space: nowrap;
        }
        .s-tab:hover { color: var(--cream); background: var(--glo); }
        .s-tab.active {
          color: var(--green); background: var(--glo);
          border-color: var(--border2);
        }
        .s-tab-icon { font-size: 15px; flex-shrink: 0; }

        /* Content */
        .s-content {
          flex: 1; overflow-y: auto; padding: 24px 28px;
          display: flex; flex-direction: column; gap: 20px;
        }
        .s-content::-webkit-scrollbar { width: 4px; }
        .s-content::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        /* Section */
        .s-section-title {
          font-size: 11px; font-weight: 700; color: var(--muted);
          letter-spacing: 0.1em; text-transform: uppercase;
          padding-bottom: 8px; border-bottom: 1px solid var(--border);
        }

        /* Row */
        .s-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 4px 0;
        }
        .s-row-left { flex: 1; min-width: 0; }
        .s-row-label { font-size: 14px; font-weight: 600; color: var(--cream); }
        .s-row-desc { font-size: 12px; color: var(--muted); margin-top: 2px; }

        /* Inputs */
        .s-select {
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 9px; padding: 9px 12px;
          font-size: 13px; color: var(--cream);
          font-family: 'Syne', sans-serif;
          outline: none; cursor: pointer;
          transition: border-color 0.2s; min-width: 140px;
        }
        .s-select:focus { border-color: var(--green); }
        .s-select option { background: #111f13; }

        .s-input {
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 9px; padding: 9px 12px;
          font-size: 13px; color: var(--cream);
          font-family: 'Syne', sans-serif; outline: none;
          transition: border-color 0.2s; width: 100%;
        }
        .s-input:focus { border-color: var(--green); }
        .s-input::placeholder { color: var(--muted); }

        .s-input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .s-number-wrap { display: flex; align-items: center; gap: 8px; }
        .s-number-btn {
          width: 30px; height: 30px; border-radius: 7px;
          border: 1px solid var(--border2); background: var(--bg3);
          color: var(--cream); font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s; flex-shrink: 0;
        }
        .s-number-btn:hover { border-color: var(--green); background: var(--glo); }
        .s-number-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px; color: var(--cream);
          min-width: 40px; text-align: center;
        }

        /* Divider */
        .s-divider { height: 1px; background: var(--border); }

        /* Radio group */
        .s-radio-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .s-radio-btn {
          padding: 7px 16px; border-radius: 9px;
          border: 1px solid var(--border); background: var(--bg3);
          font-size: 12px; font-weight: 600; color: var(--muted);
          cursor: pointer; transition: all 0.18s; font-family: 'Syne', sans-serif;
        }
        .s-radio-btn:hover { border-color: var(--border2); color: var(--cream); }
        .s-radio-btn.active {
          background: var(--glo); color: var(--green);
          border-color: var(--border2);
        }

        /* Privacy warning */
        .s-warning {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--alo); border: 1px solid rgba(232,162,69,0.2);
          border-radius: 10px; padding: 12px 14px;
          font-size: 12px; color: var(--amber); line-height: 1.5;
        }

        /* Footer */
        .s-footer {
          padding: 16px 28px; border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-shrink: 0; background: var(--bg2);
        }
        .s-saved {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--green);
          font-family: 'JetBrains Mono', monospace;
          animation: sFadeIn 0.3s ease;
        }
        .s-footer-btns { display: flex; gap: 10px; }

        /* Info chip */
        .s-chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; color: var(--muted);
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 6px; padding: 2px 8px;
        }
      `}</style>

      <div className="s-overlay" onClick={onClose}>
        <div className="s-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="s-header">
            <div>
              <div className="s-title">Settings</div>
              <div className="s-subtitle">Manage your preferences and farm configuration.</div>
            </div>
            <button className="s-close" onClick={onClose}>✕</button>
          </div>

          {/* Body */}
          <div className="s-layout">

            {/* Sidebar */}
            <div className="s-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`s-tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <span className="s-tab-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="s-content">

              {/* ── NOTIFICATIONS ── */}
              {tab === "notifications" && (
                <>
                  <div className="s-section-title">Alert Channels</div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Email Alerts</div>
                      <div className="s-row-desc">Receive alerts and summaries via email</div>
                    </div>
                    <Toggle on={settings.emailAlerts} onChange={v => update("emailAlerts", v)} />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">SMS Alerts</div>
                      <div className="s-row-desc">Get critical alerts as text messages</div>
                    </div>
                    <Toggle on={settings.smsAlerts} onChange={v => update("smsAlerts", v)} />
                  </div>

                  <div className="s-divider" />
                  <div className="s-section-title">Alert Types</div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Disease Detection Alerts</div>
                      <div className="s-row-desc">Notify when AI detects crop disease</div>
                    </div>
                    <Toggle on={settings.diseaseAlerts} onChange={v => update("diseaseAlerts", v)} />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Weather Warnings</div>
                      <div className="s-row-desc">Alerts for frost, heat waves, heavy rain</div>
                    </div>
                    <Toggle on={settings.weatherAlerts} onChange={v => update("weatherAlerts", v)} />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Task Reminders</div>
                      <div className="s-row-desc">Reminders before scheduled tasks</div>
                    </div>
                    <Toggle on={settings.taskReminders} onChange={v => update("taskReminders", v)} />
                  </div>

                  {settings.taskReminders && (
                    <>
                      <div className="s-divider" />
                      <div className="s-section-title">Reminder Timing</div>
                      <div className="s-row">
                        <div className="s-row-left">
                          <div className="s-row-label">Remind me before</div>
                          <div className="s-row-desc">Minutes before task starts</div>
                        </div>
                        <div className="s-number-wrap">
                          <button
                            className="s-number-btn"
                            onClick={() => update("reminderMinutes", Math.max(5, settings.reminderMinutes - 5))}
                          >−</button>
                          <div className="s-number-val">{settings.reminderMinutes}m</div>
                          <button
                            className="s-number-btn"
                            onClick={() => update("reminderMinutes", Math.min(120, settings.reminderMinutes + 5))}
                          >+</button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── DISPLAY ── */}
              {tab === "display" && (
                <>
                  <div className="s-section-title">Language & Region</div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Language</div>
                      <div className="s-row-desc">App display language</div>
                    </div>
                    <Select
                      value={settings.language}
                      onChange={v => update("language", v)}
                      options={[
                        { value: "en",  label: "English" },
                        { value: "hi",  label: "हिंदी (Hindi)" },
                        { value: "mr",  label: "मराठी (Marathi)" },
                        { value: "gu",  label: "ગુજરાતી (Gujarati)" },
                        { value: "pa",  label: "ਪੰਜਾਬੀ (Punjabi)" },
                        { value: "te",  label: "తెలుగు (Telugu)" },
                        { value: "ta",  label: "தமிழ் (Tamil)" },
                        { value: "kn",  label: "ಕನ್ನಡ (Kannada)" },
                      ]}
                    />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Currency</div>
                      <div className="s-row-desc">Used in revenue and cost estimates</div>
                    </div>
                    <Select
                      value={settings.currency}
                      onChange={v => update("currency", v)}
                      options={[
                        { value: "INR", label: "₹ INR" },
                        { value: "USD", label: "$ USD" },
                        { value: "EUR", label: "€ EUR" },
                      ]}
                    />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Date Format</div>
                      <div className="s-row-desc">How dates are displayed across the app</div>
                    </div>
                    <Select
                      value={settings.dateFormat}
                      onChange={v => update("dateFormat", v as any)}
                      options={[
                        { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                        { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                        { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                      ]}
                    />
                  </div>

                  <div className="s-divider" />
                  <div className="s-section-title">Units</div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Measurement System</div>
                      <div className="s-row-desc">Used for temperature, rainfall, wind</div>
                    </div>
                    <div className="s-radio-group">
                      {(["metric", "imperial"] as const).map(u => (
                        <button
                          key={u}
                          className={`s-radio-btn ${settings.units === u ? "active" : ""}`}
                          onClick={() => update("units", u)}
                        >
                          {u === "metric" ? "Metric (°C, mm)" : "Imperial (°F, in)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── FARM SETUP ── */}
              {tab === "farm" && (
                <>
                  <div className="s-section-title">Farm Details</div>

                  <div className="s-input-row">
                    <div>
                      <div className="s-row-label" style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Farm Size</div>
                      <input
                        className="s-input"
                        type="number"
                        placeholder="e.g. 5"
                        value={settings.farmSize}
                        onChange={e => update("farmSize", e.target.value)}
                        min="0"
                      />
                    </div>
                    <div>
                      <div className="s-row-label" style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Unit</div>
                      <Select
                        value={settings.farmSizeUnit}
                        onChange={v => update("farmSizeUnit", v as any)}
                        options={[
                          { value: "acres",    label: "Acres" },
                          { value: "hectares", label: "Hectares" },
                          { value: "bigha",    label: "Bigha" },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="s-row-label" style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Primary Crop</div>
                    <Select
                      value={settings.primaryCrop}
                      onChange={v => update("primaryCrop", v)}
                      options={[
                        { value: "",        label: "Select crop…" },
                        { value: "wheat",   label: "🌾 Wheat" },
                        { value: "rice",    label: "🌾 Rice / Paddy" },
                        { value: "cotton",  label: "🪴 Cotton" },
                        { value: "soybean", label: "🫘 Soybean" },
                        { value: "maize",   label: "🌽 Maize / Corn" },
                        { value: "sugarcane", label: "🎋 Sugarcane" },
                        { value: "tomato",  label: "🍅 Tomato" },
                        { value: "onion",   label: "🧅 Onion" },
                        { value: "potato",  label: "🥔 Potato" },
                        { value: "mango",   label: "🥭 Mango" },
                        { value: "other",   label: "Other" },
                      ]}
                    />
                  </div>

                  <div className="s-divider" />
                  <div className="s-section-title">Soil & Irrigation</div>

                  <div className="s-input-row">
                    <div>
                      <div className="s-row-label" style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Soil Type</div>
                      <Select
                        value={settings.soilType}
                        onChange={v => update("soilType", v)}
                        options={[
                          { value: "",          label: "Select type…" },
                          { value: "black",     label: "Black (Regur)" },
                          { value: "red",       label: "Red & Laterite" },
                          { value: "alluvial",  label: "Alluvial" },
                          { value: "sandy",     label: "Sandy" },
                          { value: "loamy",     label: "Loamy" },
                          { value: "clay",      label: "Clay" },
                          { value: "saline",    label: "Saline / Alkaline" },
                        ]}
                      />
                    </div>
                    <div>
                      <div className="s-row-label" style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Irrigation Type</div>
                      <Select
                        value={settings.irrigationType}
                        onChange={v => update("irrigationType", v)}
                        options={[
                          { value: "",          label: "Select type…" },
                          { value: "drip",      label: "Drip Irrigation" },
                          { value: "sprinkler", label: "Sprinkler" },
                          { value: "flood",     label: "Flood / Surface" },
                          { value: "furrow",    label: "Furrow" },
                          { value: "rainfed",   label: "Rainfed only" },
                        ]}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--glo)", border: "1px solid var(--border2)",
                      borderRadius: 10, padding: "12px 14px",
                      fontSize: 12, color: "var(--muted)", lineHeight: 1.6,
                    }}
                  >
                    💡 These details help the AI Chatbot give more accurate recommendations tailored to your farm.
                  </div>
                </>
              )}

              {/* ── PRIVACY ── */}
              {tab === "privacy" && (
                <>
                  <div className="s-section-title">Data & Privacy</div>

                  <div className="s-warning">
                    <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
                    <span>Farmify AI uses your farm data only to improve your experience. We never sell personal data to third parties.</span>
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Share Farm Data</div>
                      <div className="s-row-desc">Anonymously contribute data to improve AI crop models</div>
                    </div>
                    <Toggle on={settings.shareData} onChange={v => update("shareData", v)} />
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Usage Analytics</div>
                      <div className="s-row-desc">Help us improve the app with anonymous usage stats</div>
                    </div>
                    <Toggle on={settings.analytics} onChange={v => update("analytics", v)} />
                  </div>

                  <div className="s-divider" />
                  <div className="s-section-title">Account Data</div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label">Export My Data</div>
                      <div className="s-row-desc">Download all your farm data as JSON</div>
                    </div>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const data = {
                          settings,
                          exportedAt: new Date().toISOString(),
                          user: JSON.parse(localStorage.getItem("user") || "{}"),
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = "farmify-data.json"; a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      ⬇ Export
                    </button>
                  </div>

                  <div className="s-row">
                    <div className="s-row-left">
                      <div className="s-row-label" style={{color:"var(--red)"}}>Delete Account</div>
                      <div className="s-row-desc">Permanently remove all your data. Cannot be undone.</div>
                    </div>
                    <button
                      className="action-btn amber"
                      onClick={() => {
                        if (confirm("Are you sure? This will permanently delete your account and all farm data.")) {
                          localStorage.clear();
                          window.location.href = "/login";
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>

          {/* Footer */}
          <div className="s-footer">
            <div>
              {saved && (
                <div className="s-saved">✓ Settings saved</div>
              )}
              {!saved && dirty && (
                <div style={{fontSize:12, color:"var(--amber)", fontFamily:"'JetBrains Mono',monospace"}}>
                  Unsaved changes
                </div>
              )}
              {!saved && !dirty && (
                <div style={{fontSize:12, color:"var(--muted)"}}>
                  Settings are saved locally on this device.
                </div>
              )}
            </div>
            <div className="s-footer-btns">
              <button className="action-btn" onClick={handleReset}>Reset Defaults</button>
              <button className="action-btn green" onClick={handleSave}>Save Settings</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}