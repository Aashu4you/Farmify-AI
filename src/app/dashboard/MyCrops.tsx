"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
type CropStatus = "good" | "warn" | "bad";

interface Crop {
  _id: string;
  name: string;
  field: string;
  area: string;
  stage: string;
  health: number;
  baseHealth: number;
  daysLeft: number;
  daysElapsed: number;
  progressPct: number;
  totalGrowthDays: number;
  plantingDate: string;
  soilType: string;
  irrigationType: string;
  notes: string;
  status: CropStatus;
}

interface TimelineStage {
  name: string;
  from: number;
  to: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
  daysUntilStart: number;
}

interface CropTimeline {
  crop: Crop;
  timeline: TimelineStage[];
  nextAction: { action: string; icon: string; urgency: string };
  healthTrend: "improving" | "declining" | "stable";
  harvestDate: string;
}

interface FormState {
  name: string;
  field: string;
  area: string;
  plantingDate: string;
  totalGrowthDays: number;
  health: number;
  soilType: string;
  irrigationType: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "", field: "", area: "",
  plantingDate: new Date().toISOString().split("T")[0],
  totalGrowthDays: 120,
  health: 85,
  soilType: "Loamy",
  irrigationType: "Drip",
  notes: "",
};

// Common crop growth days reference
const CROP_GROWTH_DAYS: Record<string, number> = {
  wheat: 120, rice: 130, maize: 100, corn: 100,
  soybean: 110, cotton: 180, potato: 90, tomato: 80,
  onion: 120, sugarcane: 365, groundnut: 130, barley: 100,
  sorghum: 110, millet: 90, sunflower: 100,
};

const STAGES = ["Germination","Seedling","Vegetative","Tillering","Flowering","Pod Fill","Maturity","Harvesting"];
const SOIL_TYPES = ["Black","Red","Loamy","Sandy","Clay","Alluvial","Other"];
const IRRIGATION_TYPES = ["Drip","Sprinkler","Flood","Rain-fed","Other"];

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const healthColor = (h: number) =>
  h > 80 ? "#4caf6e" : h > 60 ? "#e8a245" : "#e05c5c";

const statusLabel = (s: CropStatus) =>
  s === "good" ? "Healthy" : s === "warn" ? "Monitor" : "Action needed";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ── Component ─────────────────────────────────────────────────────────────────
export default function MyCrops() {
  const [crops, setCrops]           = useState<Crop[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [selected, setSelected]     = useState<string | null>(null);
  const [timeline, setTimeline]     = useState<CropTimeline | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Crop | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  // ── Fetch crops ────────────────────────────────────────────────────────────
  const fetchCrops = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api().get("/crops");
      setCrops(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCrops(); }, [fetchCrops]);

  // ── Fetch timeline when crop selected ─────────────────────────────────────
  const fetchTimeline = useCallback(async (cropId: string) => {
    setTimelineLoading(true);
    try {
      const res = await api().get(`/crops/${cropId}/timeline`);
      setTimeline(res.data);
      // Update health in list if it changed from decay
      setCrops(prev => prev.map(c =>
        c._id === cropId ? { ...c, health: res.data.crop.health } : c
      ));
    } catch (err: any) {
      console.error("Timeline fetch error:", err.message);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const handleRowClick = (cropId: string) => {
    if (selected === cropId) {
      setSelected(null);
      setTimeline(null);
    } else {
      setSelected(cropId);
      fetchTimeline(cropId);
    }
  };

  // ── Auto-suggest totalGrowthDays based on crop name ───────────────────────
  const handleCropNameChange = (name: string) => {
    const key = name.toLowerCase().trim();
    const suggested = CROP_GROWTH_DAYS[key];
    setForm(prev => ({
      ...prev,
      name,
      ...(suggested ? { totalGrowthDays: suggested } : {}),
    }));
  };

  // ── Open Add modal ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  // ── Open Edit modal ────────────────────────────────────────────────────────
  const openEdit = (crop: Crop, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(crop);
    setForm({
      name:            crop.name,
      field:           crop.field,
      area:            crop.area,
      plantingDate:    new Date(crop.plantingDate).toISOString().split("T")[0],
      totalGrowthDays: crop.totalGrowthDays,
      health:          crop.health,
      soilType:        crop.soilType,
      irrigationType:  crop.irrigationType,
      notes:           crop.notes,
    });
    setFormError("");
    setModalOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      if (editTarget) {
        const res = await api().put(`/crops/${editTarget._id}`, form);
        setCrops(prev => prev.map(c => c._id === editTarget._id ? res.data : c));
        if (selected === editTarget._id) fetchTimeline(editTarget._id);
      } else {
        const res = await api().post("/crops", form);
        setCrops(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save crop");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api().delete(`/crops/${deleteId}`);
      setCrops(prev => prev.filter(c => c._id !== deleteId));
      if (selected === deleteId) { setSelected(null); setTimeline(null); }
      setDeleteId(null);
    } catch { /* silent */ } finally {
      setDeleting(false);
    }
  };

  const urgencyColor = (u: string) =>
    u === "high" ? "var(--red)" : u === "medium" ? "var(--amber)" : "var(--green)";

  const trendIcon = (t: string) =>
    t === "improving" ? "↑" : t === "declining" ? "↓" : "→";

  const trendColor = (t: string) =>
    t === "improving" ? "var(--green)" : t === "declining" ? "var(--red)" : "var(--amber)";

  return (
    <div className="view-root">
      <style>{`
        /* ── Timeline panel ── */
        .timeline-panel {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 20px; padding: 28px;
          display: flex; flex-direction: column; gap: 24px;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .timeline-top {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        .tl-stat {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px;
        }
        .tl-stat-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        .tl-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--cream); }
        .tl-stat-sub { font-size: 11px; color: var(--muted); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }

        /* Progress bar */
        .progress-section { display: flex; flex-direction: column; gap: 10px; }
        .progress-bar-wrap {
          height: 8px; background: var(--border);
          border-radius: 4px; overflow: hidden; position: relative;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 4px;
          background: linear-gradient(to right, var(--gdim), var(--green));
          transition: width 0.6s ease;
        }

        /* Stage timeline */
        .stage-timeline {
          display: flex; align-items: flex-start;
          gap: 0; overflow-x: auto;
          padding-bottom: 8px;
        }
        .stage-timeline::-webkit-scrollbar { height: 3px; }
        .stage-timeline::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        .stage-item {
          display: flex; flex-direction: column; align-items: center;
          flex: 1; min-width: 80px; position: relative;
        }
        .stage-item::before {
          content: ''; position: absolute;
          top: 9px; left: calc(-50%);
          width: 100%; height: 2px;
          background: var(--border);
          z-index: 0;
        }
        .stage-item:first-child::before { display: none; }
        .stage-item.completed::before { background: var(--green); }
        .stage-item.active::before { background: linear-gradient(to right, var(--green), var(--border)); }

        .stage-dot {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid var(--border2);
          background: var(--bg3);
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; z-index: 1; flex-shrink: 0;
          transition: all 0.2s;
        }
        .stage-dot.completed { background: var(--green); border-color: var(--green); color: #060e07; }
        .stage-dot.active {
          background: var(--green); border-color: var(--green);
          box-shadow: 0 0 0 4px rgba(76,175,110,0.2);
          width: 22px; height: 22px;
        }
        .stage-dot.upcoming { background: var(--bg3); border-color: var(--border); }

        .stage-name {
          font-size: 10px; color: var(--muted); margin-top: 6px;
          text-align: center; line-height: 1.3;
        }
        .stage-name.active { color: var(--green); font-weight: 700; }
        .stage-name.completed { color: var(--muted); }

        .stage-date {
          font-size: 9px; color: var(--muted);
          font-family: 'JetBrains Mono', monospace;
          margin-top: 2px; text-align: center;
        }
        .stage-date.active { color: var(--amber); }

        /* Next action */
        .next-action-box {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px; border-radius: 14px;
          border: 1px solid var(--border2);
        }
        .next-action-icon { font-size: 24px; flex-shrink: 0; }
        .next-action-label { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
        .next-action-text { font-size: 14px; font-weight: 600; color: var(--cream); }

        /* Harvest countdown */
        .harvest-ring-wrap {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .harvest-ring { position: relative; width: 80px; height: 80px; }
        .harvest-ring svg { width: 80px; height: 80px; transform: rotate(-90deg); }
        .harvest-ring-center {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .harvest-ring-days { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; color: var(--cream); line-height: 1; }
        .harvest-ring-label { font-size: 9px; color: var(--muted); }

        /* Health trend */
        .health-trend-row {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px 16px;
        }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(6,14,7,0.85); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 24px; animation: fadeIn2 0.18s ease; }
        @keyframes fadeIn2 { from{opacity:0} to{opacity:1} }
        .modal-box { background: var(--bg2); border: 1px solid var(--border2); border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 24px; animation: slideUp 0.22s ease; }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--cream); }
        .modal-close { background: none; border: 1px solid var(--border); color: var(--muted); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { border-color: var(--border2); color: var(--cream); }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .form-input, .form-select, .form-textarea { background: var(--bg3); border: 1px solid var(--border2); border-radius: 9px; padding: 10px 14px; font-size: 13px; font-family: 'Syne', sans-serif; color: var(--cream); outline: none; transition: border-color 0.2s; width: 100%; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--green); }
        .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); }
        .form-select { appearance: none; cursor: pointer; }
        .form-select option { background: var(--bg2); }
        .form-textarea { resize: vertical; min-height: 64px; line-height: 1.5; }
        .form-error { display: flex; align-items: center; gap: 8px; background: var(--rlo); border: 1px solid rgba(224,92,92,0.25); border-radius: 9px; padding: 10px 14px; font-size: 13px; color: var(--red); }
        .form-hint { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .range-row { display: flex; align-items: center; gap: 10px; }
        .range-input { flex: 1; accent-color: var(--green); cursor: pointer; }
        .range-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; min-width: 36px; text-align: right; }

        /* Confirm */
        .confirm-box { background: var(--bg2); border: 1px solid rgba(224,92,92,0.3); border-radius: 16px; padding: 28px; max-width: 380px; width: 100%; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.22s ease; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--red); }
        .confirm-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; }

        /* Skeleton */
        .skeleton-row { height: 52px; border-radius: 8px; background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 2px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Empty */
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; text-align: center; gap: 16px; }
        .empty-icon { font-size: 52px; opacity: 0.4; }
        .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--cream); }
        .empty-sub { font-size: 14px; color: var(--muted); max-width: 280px; line-height: 1.6; }

        /* Summary pills */
        .crops-summary { display: flex; gap: 16px; flex-wrap: wrap; }
        .summary-pill { display: flex; align-items: center; gap: 8px; background: var(--bg2); border: 1px solid var(--border); border-radius: 100px; padding: 6px 14px; font-size: 12px; color: var(--muted); }
        .summary-dot { width: 7px; height: 7px; border-radius: 50%; }

        @media (max-width: 900px) {
          .timeline-top { grid-template-columns: 1fr 1fr; }
          .stage-timeline { gap: 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">My Crops</h1>
          <p className="view-sub">Track active crops — stages, health, and timelines update automatically.</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="action-btn" onClick={fetchCrops}>↻ Refresh</button>
          <button className="action-btn green" onClick={openAdd}>+ Add Crop</button>
        </div>
      </div>

      {/* ── Summary pills ── */}
      {!loading && crops.length > 0 && (
        <div className="crops-summary">
          <div className="summary-pill"><span className="summary-dot" style={{background:"var(--green)"}} />{crops.filter(c=>c.status==="good").length} Healthy</div>
          <div className="summary-pill"><span className="summary-dot" style={{background:"var(--amber)"}} />{crops.filter(c=>c.status==="warn").length} Monitor</div>
          <div className="summary-pill"><span className="summary-dot" style={{background:"var(--red)"}} />{crops.filter(c=>c.status==="bad").length} Action needed</div>
          <div className="summary-pill"><span>🌾</span> {crops.length} total crops</div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{background:"var(--rlo)",border:"1px solid rgba(224,92,92,0.25)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"var(--red)",display:"flex",gap:8}}>
          ⚠️ {error}
          <button onClick={fetchCrops} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>Retry</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="crops-table">
        <div className="crops-thead" style={{gridTemplateColumns:"1.4fr 1fr 0.8fr 1fr 1.4fr 0.7fr 1fr 0.7fr 100px"}}>
          {["Crop","Field","Area","Stage","Health","Progress","Status","Days Left","Actions"].map(h => (
            <div key={h} className="crops-th">{h}</div>
          ))}
        </div>

        {loading && (
          <div style={{padding:"12px 20px",display:"flex",flexDirection:"column",gap:8}}>
            {[1,2,3].map(i => <div key={i} className="skeleton-row" />)}
          </div>
        )}

        {!loading && crops.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <div className="empty-title">No crops yet</div>
            <p className="empty-sub">Add your first crop to start tracking growth stages, health, and harvest timelines automatically.</p>
            <button className="action-btn green" onClick={openAdd}>+ Add Your First Crop</button>
          </div>
        )}

        {!loading && crops.map(c => (
          <div
            key={c._id}
            className={`crops-row ${selected === c._id ? "selected" : ""}`}
            style={{gridTemplateColumns:"1.4fr 1fr 0.8fr 1fr 1.4fr 0.7fr 1fr 0.7fr 100px"}}
            onClick={() => handleRowClick(c._id)}
          >
            <div className="crops-td crop-name">{c.name}</div>
            <div className="crops-td muted">{c.field}</div>
            <div className="crops-td muted">{c.area}</div>
            <div className="crops-td"><span className="stage-pill">{c.stage}</span></div>
            <div className="crops-td" style={{gap:8}}>
              <div className="health-bar-wrap">
                <div className="health-bar" style={{width:`${c.health}%`,background:healthColor(c.health)}} />
              </div>
              <span className="health-num">{c.health}%</span>
            </div>
            <div className="crops-td">
              <div style={{width:"100%",height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${c.progressPct}%`,background:"linear-gradient(to right,var(--gdim),var(--green))",borderRadius:2}} />
              </div>
              <span style={{fontSize:10,color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",marginLeft:4}}>{c.progressPct}%</span>
            </div>
            <div className="crops-td">
              <span className={`status-dot ${c.status}`} />
              <span className="muted" style={{fontSize:12}}>{statusLabel(c.status)}</span>
            </div>
            <div className="crops-td muted" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>
              {c.daysLeft > 0 ? `${c.daysLeft}d` : "Ready"}
            </div>
            <div className="crops-td" style={{gap:6}} onClick={e=>e.stopPropagation()}>
              <button className="action-btn" style={{padding:"5px 10px",fontSize:12}} onClick={e=>openEdit(c,e)}>✏️</button>
              <button className="action-btn amber" style={{padding:"5px 10px",fontSize:12}} onClick={e=>{e.stopPropagation();setDeleteId(c._id);}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Growth Timeline Panel ── */}
      {selected && (
        <div className="timeline-panel">
          {timelineLoading ? (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[1,2,3].map(i => <div key={i} className="skeleton-row" style={{height:64}} />)}
            </div>
          ) : timeline && (
            <>
              {/* Top stats */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div>
                  <div className="chart-box-title" style={{fontSize:18}}>{timeline.crop.name} — Growth Timeline</div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>
                    Planted {formatDate(timeline.crop.plantingDate)} · {timeline.crop.totalGrowthDays} day cycle · Harvest {formatDate(timeline.harvestDate)}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="action-btn" onClick={e=>openEdit(crops.find(c=>c._id===selected)!,e)}>✏️ Edit Crop</button>
                  <button className="action-btn amber" onClick={()=>setDeleteId(selected)}>🗑️ Delete</button>
                </div>
              </div>

              {/* Stat cards row */}
              <div className="timeline-top">
                {/* Days elapsed */}
                <div className="tl-stat">
                  <div className="tl-stat-label">Days Growing</div>
                  <div className="tl-stat-value">{timeline.crop.daysElapsed}</div>
                  <div className="tl-stat-sub">of {timeline.crop.totalGrowthDays} days</div>
                </div>
                {/* Days left */}
                <div className="tl-stat">
                  <div className="tl-stat-label">Days to Harvest</div>
                  <div className="tl-stat-value" style={{color: timeline.crop.daysLeft <= 14 ? "var(--amber)" : "var(--cream)"}}>
                    {timeline.crop.daysLeft > 0 ? timeline.crop.daysLeft : "Ready!"}
                  </div>
                  <div className="tl-stat-sub">{formatDate(timeline.harvestDate)}</div>
                </div>
                {/* Health */}
                <div className="tl-stat">
                  <div className="tl-stat-label">Health Score</div>
                  <div className="tl-stat-value" style={{color:healthColor(timeline.crop.health)}}>
                    {timeline.crop.health}%
                  </div>
                  <div className="tl-stat-sub" style={{color:trendColor(timeline.healthTrend)}}>
                    {trendIcon(timeline.healthTrend)} {timeline.healthTrend}
                  </div>
                </div>
                {/* Current stage */}
                <div className="tl-stat">
                  <div className="tl-stat-label">Current Stage</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--green)",marginTop:2}}>{timeline.crop.stage}</div>
                  <div className="tl-stat-sub">{timeline.crop.progressPct}% of cycle</div>
                </div>
              </div>

              {/* Overall progress bar */}
              <div className="progress-section">
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--muted)"}}>
                  <span>Planted</span>
                  <span style={{color:"var(--green)",fontWeight:600}}>{timeline.crop.progressPct}% Complete</span>
                  <span>Harvest</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{width:`${timeline.crop.progressPct}%`}} />
                </div>
              </div>

              {/* Stage timeline */}
              <div>
                <div className="chart-box-title" style={{marginBottom:16}}>Stage Progression</div>
                <div className="stage-timeline">
                  {timeline.timeline.map((stage, i) => (
                    <div key={i} className={`stage-item ${stage.isCompleted ? "completed" : stage.isActive ? "active" : "upcoming"}`}>
                      <div className={`stage-dot ${stage.isCompleted ? "completed" : stage.isActive ? "active" : "upcoming"}`}>
                        {stage.isCompleted ? "✓" : stage.isActive ? "●" : ""}
                      </div>
                      <div className={`stage-name ${stage.isActive ? "active" : stage.isCompleted ? "completed" : ""}`}>
                        {stage.name}
                      </div>
                      <div className={`stage-date ${stage.isActive ? "active" : ""}`}>
                        {stage.isActive
                          ? "Now"
                          : stage.isCompleted
                            ? new Date(stage.endDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})
                            : stage.daysUntilStart > 0
                              ? `in ${stage.daysUntilStart}d`
                              : new Date(stage.startDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next action + health trend */}
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"stretch"}}>
                <div
                  className="next-action-box"
                  style={{background: timeline.nextAction.urgency === "high" ? "var(--rlo)" : timeline.nextAction.urgency === "medium" ? "var(--alo)" : "var(--glo)"}}
                >
                  <div className="next-action-icon">{timeline.nextAction.icon}</div>
                  <div>
                    <div className="next-action-label">Recommended Next Action</div>
                    <div className="next-action-text">{timeline.nextAction.action}</div>
                    <div style={{fontSize:11,color:urgencyColor(timeline.nextAction.urgency),marginTop:4,fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase"}}>
                      {timeline.nextAction.urgency} priority
                    </div>
                  </div>
                </div>

                {/* Harvest countdown ring */}
                <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:14,padding:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,minWidth:120}}>
                  <div className="harvest-ring">
                    <svg viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(76,175,110,0.1)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="32" fill="none"
                        stroke={timeline.crop.daysLeft <= 14 ? "#e8a245" : "#4caf6e"}
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - timeline.crop.progressPct / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="harvest-ring-center">
                      <div className="harvest-ring-days">{timeline.crop.daysLeft}</div>
                      <div className="harvest-ring-label">days left</div>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}>
                    Harvest<br/>{formatDate(timeline.harvestDate)}
                  </div>
                </div>
              </div>

              {/* Health trend detail */}
              <div className="health-trend-row">
                <span style={{fontSize:18}}>
                  {timeline.healthTrend === "improving" ? "📈" : timeline.healthTrend === "declining" ? "📉" : "➡️"}
                </span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--cream)"}}>
                    Health is {timeline.healthTrend}
                    <span style={{color:trendColor(timeline.healthTrend),marginLeft:8}}>
                      {timeline.crop.health}% current vs {timeline.crop.baseHealth}% at planting
                    </span>
                  </div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>
                    {timeline.healthTrend === "declining"
                      ? "Health decays -1% per day without completed tasks. Complete scheduled tasks to improve it."
                      : timeline.healthTrend === "improving"
                        ? "Great work! Completed tasks are improving your crop health."
                        : "Health is stable. Keep completing tasks to maintain or improve."}
                  </div>
                </div>
              </div>

              {/* Crop details */}
              {timeline.crop.notes && (
                <div style={{background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:12,padding:14}}>
                  <div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>Notes</div>
                  <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>{timeline.crop.notes}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={()=>setModalOpen(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editTarget ? "Edit Crop" : "Add New Crop"}</div>
              <button className="modal-close" onClick={()=>setModalOpen(false)}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSave}>
              {formError && <div className="form-error">⚠️ {formError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Crop Name *</label>
                  <input className="form-input" placeholder="e.g. Wheat" value={form.name}
                    onChange={e=>handleCropNameChange(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Field Name *</label>
                  <input className="form-input" placeholder="e.g. Field 1" value={form.field}
                    onChange={e=>setForm({...form,field:e.target.value})} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Area *</label>
                  <input className="form-input" placeholder="e.g. 2.5 ac" value={form.area}
                    onChange={e=>setForm({...form,area:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Planting Date *</label>
                  <input type="date" className="form-input" value={form.plantingDate}
                    onChange={e=>setForm({...form,plantingDate:e.target.value})} required />
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Total Growth Days * <span style={{color:"var(--muted)",fontWeight:400}}>(auto-filled for common crops)</span></label>
                <input type="number" className="form-input" placeholder="e.g. 120" value={form.totalGrowthDays} min={1} max={500}
                  onChange={e=>setForm({...form,totalGrowthDays:Number(e.target.value)})} required />
                <div className="form-hint">
                  Common: Wheat=120d · Rice=130d · Maize=100d · Potato=90d · Tomato=80d · Cotton=180d
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <select className="form-select" value={form.soilType} onChange={e=>setForm({...form,soilType:e.target.value})}>
                    {SOIL_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Irrigation Type</label>
                  <select className="form-select" value={form.irrigationType} onChange={e=>setForm({...form,irrigationType:e.target.value})}>
                    {IRRIGATION_TYPES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Starting Health Score</label>
                <div className="range-row">
                  <input type="range" min={0} max={100} className="range-input" value={form.health}
                    onChange={e=>setForm({...form,health:Number(e.target.value)})} />
                  <span className="range-val" style={{color:healthColor(form.health)}}>{form.health}%</span>
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any observations or reminders…" value={form.notes}
                  onChange={e=>setForm({...form,notes:e.target.value})} />
              </div>

              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={()=>setModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="action-btn green" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Crop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={()=>setDeleteId(null)}>
          <div className="confirm-box" onClick={e=>e.stopPropagation()}>
            <div className="confirm-title">Delete Crop?</div>
            <p className="confirm-desc">
              This will permanently remove <strong style={{color:"var(--cream)"}}>
                {crops.find(c=>c._id===deleteId)?.name}
              </strong>. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="action-btn" onClick={()=>setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="action-btn amber" onClick={handleDelete} disabled={deleting}
                style={{background:"var(--rlo)",borderColor:"rgba(224,92,92,0.4)"}}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}