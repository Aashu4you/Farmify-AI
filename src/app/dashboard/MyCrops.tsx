"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type CropStatus = "good" | "warn" | "bad";

interface Crop {
  _id: string;
  name: string;
  field: string;
  area: string;
  stage: string;
  health: number;
  daysLeft: number;
  soilType: string;
  irrigationType: string;
  notes: string;
  status: CropStatus;
  createdAt: string;
}

interface FormState {
  name: string;
  field: string;
  area: string;
  stage: string;
  health: number;
  daysLeft: number;
  soilType: string;
  irrigationType: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  field: "",
  area: "",
  stage: "Germination",
  health: 85,
  daysLeft: 60,
  soilType: "Loamy",
  irrigationType: "Drip",
  notes: "",
};

const STAGES = ["Germination","Seedling","Vegetative","Tillering","Flowering","Pod Fill","Boll Dev.","Maturity","Harvesting"];
const SOIL_TYPES = ["Black","Red","Loamy","Sandy","Clay","Alluvial","Other"];
const IRRIGATION_TYPES = ["Drip","Sprinkler","Flood","Rain-fed","Other"];

// ─── API helper ───────────────────────────────────────────────────────────────

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Crop | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch
  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError("");
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

  // ── Open Add modal
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  // ── Open Edit modal
  const openEdit = (crop: Crop, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTarget(crop);
    setForm({
      name: crop.name,
      field: crop.field,
      area: crop.area,
      stage: crop.stage,
      health: crop.health,
      daysLeft: crop.daysLeft,
      soilType: crop.soilType,
      irrigationType: crop.irrigationType,
      notes: crop.notes,
    });
    setFormError("");
    setModalOpen(true);
  };

  // ── Save (add or edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api().put(`/crops/${editTarget._id}`, form);
        setCrops(prev => prev.map(c => c._id === editTarget._id ? res.data : c));
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

  // ── Delete
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api().delete(`/crops/${deleteId}`);
      setCrops(prev => prev.filter(c => c._id !== deleteId));
      if (selected === deleteId) setSelected(null);
      setDeleteId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const selectedCrop = crops.find(c => c._id === selected);

  const healthColor = (h: number) =>
    h > 80 ? "#4caf6e" : h > 60 ? "#e8a245" : "#e05c5c";

  const statusLabel = (s: CropStatus) =>
    s === "good" ? "Healthy" : s === "warn" ? "Monitor" : "Action needed";

  return (
    <div className="view-root">
      {/* ── Styles ── */}
      <style>{`
        /* Modal overlay */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(6,14,7,0.85);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .modal-box {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 20px; width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          padding: 32px;
          display: flex; flex-direction: column; gap: 24px;
          animation: slideUp 0.22s ease;
        }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }

        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 700; color: var(--cream);
        }
        .modal-close {
          background: none; border: 1px solid var(--border);
          color: var(--muted); width: 32px; height: 32px;
          border-radius: 8px; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .modal-close:hover { border-color: var(--border2); color: var(--cream); }

        .modal-form { display: flex; flex-direction: column; gap: 16px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }

        .form-label {
          font-size: 11px; font-weight: 600; color: var(--muted);
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .form-input, .form-select, .form-textarea {
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 9px; padding: 10px 14px;
          font-size: 13px; font-family: 'Syne', sans-serif;
          color: var(--cream); outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: var(--green);
        }
        .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); }
        .form-select { appearance: none; cursor: pointer; }
        .form-select option { background: var(--bg2); }
        .form-textarea { resize: vertical; min-height: 72px; line-height: 1.5; }

        .range-wrap { display: flex; flex-direction: column; gap: 6px; }
        .range-row { display: flex; align-items: center; gap: 10px; }
        .range-input {
          flex: 1; accent-color: var(--green);
          height: 4px; cursor: pointer;
        }
        .range-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; min-width: 36px; text-align: right;
        }

        .form-error {
          display: flex; align-items: center; gap: 8px;
          background: var(--rlo); border: 1px solid rgba(224,92,92,0.25);
          border-radius: 9px; padding: 10px 14px;
          font-size: 13px; color: var(--red);
        }

        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

        /* Delete confirm */
        .confirm-box {
          background: var(--bg2); border: 1px solid rgba(224,92,92,0.3);
          border-radius: 16px; padding: 28px;
          max-width: 380px; width: 100%;
          display: flex; flex-direction: column; gap: 16px;
          animation: slideUp 0.22s ease;
        }
        .confirm-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 700; color: var(--red);
        }
        .confirm-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; }

        /* Skeleton loader */
        .skeleton-row {
          height: 52px; border-radius: 8px;
          background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          margin-bottom: 2px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Empty state */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 64px 24px; text-align: center;
          gap: 16px;
        }
        .empty-icon { font-size: 52px; opacity: 0.4; }
        .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: var(--cream); }
        .empty-sub { font-size: 14px; color: var(--muted); max-width: 280px; line-height: 1.6; }

        /* Summary bar */
        .crops-summary {
          display: flex; gap: 16px; flex-wrap: wrap;
        }
        .summary-pill {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 100px; padding: 6px 14px;
          font-size: 12px; color: var(--muted);
        }
        .summary-dot { width: 7px; height: 7px; border-radius: 50%; }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">My Crops</h1>
          <p className="view-sub">Track all active crops and field conditions.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="action-btn" onClick={fetchCrops} title="Refresh">↻ Refresh</button>
          <button className="action-btn green" onClick={openAdd}>+ Add Crop</button>
        </div>
      </div>

      {/* ── Summary pills ── */}
      {!loading && crops.length > 0 && (
        <div className="crops-summary">
          <div className="summary-pill">
            <span className="summary-dot" style={{ background: "var(--green)" }} />
            {crops.filter(c => c.status === "good").length} Healthy
          </div>
          <div className="summary-pill">
            <span className="summary-dot" style={{ background: "var(--amber)" }} />
            {crops.filter(c => c.status === "warn").length} Monitor
          </div>
          <div className="summary-pill">
            <span className="summary-dot" style={{ background: "var(--red)" }} />
            {crops.filter(c => c.status === "bad").length} Action needed
          </div>
          <div className="summary-pill">
            <span>🌾</span> {crops.length} total crops
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: "var(--rlo)", border: "1px solid rgba(224,92,92,0.25)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--red)", display: "flex", gap: 8 }}>
          ⚠️ {error}
          <button onClick={fetchCrops} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>Retry</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="crops-table">
        <div className="crops-thead" style={{ gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 1.4fr 0.8fr 1fr 100px" }}>
          {["Crop","Field","Area","Stage","Health","Days Left","Status","Actions"].map(h => (
            <div key={h} className="crops-th">{h}</div>
          ))}
        </div>

        {/* Skeleton */}
        {loading && (
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton-row" />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && crops.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <div className="empty-title">No crops yet</div>
            <p className="empty-sub">Add your first crop to start tracking health, stages, and harvest timelines.</p>
            <button className="action-btn green" onClick={openAdd}>+ Add Your First Crop</button>
          </div>
        )}

        {/* Rows */}
        {!loading && crops.map(c => (
          <div
            key={c._id}
            className={`crops-row ${selected === c._id ? "selected" : ""}`}
            style={{ gridTemplateColumns: "1.4fr 1fr 0.8fr 1fr 1.4fr 0.8fr 1fr 100px" }}
            onClick={() => setSelected(selected === c._id ? null : c._id)}
          >
            <div className="crops-td crop-name">{c.name}</div>
            <div className="crops-td muted">{c.field}</div>
            <div className="crops-td muted">{c.area}</div>
            <div className="crops-td">
              <span className="stage-pill">{c.stage}</span>
            </div>
            <div className="crops-td" style={{ gap: 8 }}>
              <div className="health-bar-wrap">
                <div className="health-bar" style={{ width: `${c.health}%`, background: healthColor(c.health) }} />
              </div>
              <span className="health-num">{c.health}%</span>
            </div>
            <div className="crops-td muted">{c.daysLeft}d</div>
            <div className="crops-td">
              <span className={`status-dot ${c.status}`} />
              <span className="muted" style={{ fontSize: 12 }}>{statusLabel(c.status)}</span>
            </div>
            <div className="crops-td" style={{ gap: 6 }} onClick={e => e.stopPropagation()}>
              <button
                className="action-btn"
                style={{ padding: "5px 10px", fontSize: 12 }}
                onClick={e => openEdit(c, e)}
                title="Edit"
              >✏️</button>
              <button
                className="action-btn amber"
                style={{ padding: "5px 10px", fontSize: 12 }}
                onClick={e => { e.stopPropagation(); setDeleteId(c._id); }}
                title="Delete"
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Expanded detail panel ── */}
      {selectedCrop && (
        <div className="crop-detail" style={{ animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="chart-box-title">{selectedCrop.name} — {selectedCrop.field} Detail</div>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="crop-detail-grid">
            {[
              ["Crop Name", selectedCrop.name],
              ["Field", selectedCrop.field],
              ["Area", selectedCrop.area],
              ["Growth Stage", selectedCrop.stage],
              ["Health Score", `${selectedCrop.health}%`],
              ["Days to Harvest", `${selectedCrop.daysLeft} days`],
              ["Soil Type", selectedCrop.soilType],
              ["Irrigation", selectedCrop.irrigationType],
              ["Status", statusLabel(selectedCrop.status)],
            ].map(([l, v]) => (
              <div key={l} className="crop-detail-cell">
                <div className="crop-detail-lbl">{l}</div>
                <div className="crop-detail-val">{v}</div>
              </div>
            ))}
            {selectedCrop.notes && (
              <div className="crop-detail-cell" style={{ gridColumn: "1 / -1" }}>
                <div className="crop-detail-lbl">Notes</div>
                <div className="crop-detail-val" style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)", lineHeight: 1.6 }}>{selectedCrop.notes}</div>
              </div>
            )}
          </div>
          <div className="crop-actions" style={{ marginTop: 16 }}>
            <button className="action-btn" onClick={e => openEdit(selectedCrop, e)}>✏️ Edit Crop</button>
            <button className="action-btn amber" onClick={() => setDeleteId(selectedCrop._id)}>🗑️ Delete Crop</button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {editTarget ? "Edit Crop" : "Add New Crop"}
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSave}>
              {formError && (
                <div className="form-error">⚠️ {formError}</div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Crop Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Wheat"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Field Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Field 1"
                    value={form.field}
                    onChange={e => setForm({ ...form, field: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Area *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 2.5 ac"
                    value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Days to Harvest *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={form.daysLeft}
                    min={0}
                    onChange={e => setForm({ ...form, daysLeft: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Growth Stage *</label>
                  <select
                    className="form-select"
                    value={form.stage}
                    onChange={e => setForm({ ...form, stage: e.target.value })}
                  >
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Soil Type</label>
                  <select
                    className="form-select"
                    value={form.soilType}
                    onChange={e => setForm({ ...form, soilType: e.target.value })}
                  >
                    {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Irrigation Type</label>
                  <select
                    className="form-select"
                    value={form.irrigationType}
                    onChange={e => setForm({ ...form, irrigationType: e.target.value })}
                  >
                    {IRRIGATION_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <div className="range-wrap">
                    <label className="form-label">Health Score</label>
                    <div className="range-row">
                      <input
                        type="range" min={0} max={100}
                        className="range-input"
                        value={form.health}
                        onChange={e => setForm({ ...form, health: Number(e.target.value) })}
                      />
                      <span className="range-val" style={{ color: healthColor(form.health) }}>
                        {form.health}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Any observations, issues, or reminders…"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn green" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Crop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Delete Crop?</div>
            <p className="confirm-desc">
              This will permanently remove <strong style={{ color: "var(--cream)" }}>
                {crops.find(c => c._id === deleteId)?.name}
              </strong> from your farm. This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="action-btn" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                className="action-btn amber"
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: "var(--rlo)", borderColor: "rgba(224,92,92,0.4)" }}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}