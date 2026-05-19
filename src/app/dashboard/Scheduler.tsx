"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Task {
  _id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  field: string;
  crop: string;
  notes: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  isRecommendation: boolean;
}

interface Recommendation {
  title: string;
  type: string;
  priority: string;
  date: string;
  time: string;
  crop: string;
  field: string;
  reason: string;
  isRecommendation: boolean;
}

interface FormState {
  title: string;
  type: string;
  date: string;
  time: string;
  field: string;
  crop: string;
  notes: string;
  priority: "low" | "medium" | "high";
}

const EMPTY_FORM: FormState = {
  title: "", type: "other", date: "", time: "08:00",
  field: "", crop: "", notes: "", priority: "medium",
};

const TYPE_ICONS: Record<string, string> = {
  irrigation: "💧", fertilizer: "🌿", spray: "🧪",
  harvest: "🌾", soil: "🪱", pruning: "✂️", other: "📌",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--red)", medium: "var(--amber)", low: "var(--green)",
};

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

const isTomorrow = (iso: string) => {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return new Date(iso).toDateString() === t.toDateString();
};

const dateLabel = (iso: string) => {
  if (isToday(iso)) return "Today";
  if (isTomorrow(iso)) return "Tomorrow";
  return formatDate(iso);
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Scheduler() {
  const [tasks, setTasks]                   = useState<Task[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [modalOpen, setModalOpen]           = useState(false);
  const [editTarget, setEditTarget]         = useState<Task | null>(null);
  const [form, setForm]                     = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState("");
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading]       = useState(false);
  const [recsError, setRecsError]           = useState("");
  const [activeTab, setActiveTab]           = useState<"upcoming" | "done" | "irrigation">("upcoming");
  const [calMonth, setCalMonth]             = useState(new Date());
  const [selectedDay, setSelectedDay]       = useState<Date | null>(null);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api().get("/tasks");
      setTasks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Fetch AI recommendations ───────────────────────────────────────────────
  const fetchRecommendations = async () => {
    setRecsLoading(true);
    setRecsError("");
    try {
      let url = "/tasks/recommendations";
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        ).catch(() => null);
        if (pos) url += `?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`;
      }
      const res = await api().get(url);
      setRecommendations(res.data.recommendations || []);
    } catch (err: any) {
      setRecsError(err.response?.data?.message || "Failed to get recommendations");
    } finally {
      setRecsLoading(false);
    }
  };

  // ── Add recommendation as task ─────────────────────────────────────────────
  const addRecommendationAsTask = async (rec: Recommendation) => {
    try {
      const res = await api().post("/tasks", {
        title: rec.title,
        type: rec.type,
        date: rec.date,
        time: rec.time,
        crop: rec.crop,
        field: rec.field,
        notes: rec.reason,
        priority: rec.priority,
        isRecommendation: true,
      });
      setTasks(prev => [...prev, res.data]);
      setRecommendations(prev => prev.filter(r => r.title !== rec.title));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add task");
    }
  };

  // ── Save (add/edit) ────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api().put(`/tasks/${editTarget._id}`, form);
        setTasks(prev => prev.map(t => t._id === editTarget._id ? res.data : t));
      } else {
        const res = await api().post("/tasks", form);
        setTasks(prev => [...prev, res.data]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle done ────────────────────────────────────────────────────────────
  const toggleDone = async (task: Task) => {
    try {
      const res = await api().put(`/tasks/${task._id}`, { done: !task.done });
      setTasks(prev => prev.map(t => t._id === task._id ? res.data : t));
    } catch { /* silent */ }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api().delete(`/tasks/${deleteId}`);
      setTasks(prev => prev.filter(t => t._id !== deleteId));
      setDeleteId(null);
    } catch { /* silent */ } finally {
      setDeleting(false);
    }
  };

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openAdd = (date?: Date) => {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTarget(task);
    setForm({
      title: task.title, type: task.type,
      date: task.date.split("T")[0], time: task.time,
      field: task.field, crop: task.crop,
      notes: task.notes, priority: task.priority,
    });
    setFormError("");
    setModalOpen(true);
  };

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const taskDatesInMonth = new Set(
    tasks.map(t => new Date(t.date).toDateString())
  );

  const tasksOnDay = (d: Date) =>
    tasks.filter(t => new Date(t.date).toDateString() === d.toDateString());

  // ── Filtered tasks ─────────────────────────────────────────────────────────
  const upcoming = tasks
    .filter(t => !t.done && new Date(t.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const overdue = tasks
    .filter(t => !t.done && new Date(t.date) < new Date(new Date().setHours(0,0,0,0)));

  const done = tasks.filter(t => t.done)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const irrigationTasks = tasks.filter(t => t.type === "irrigation" && !t.done);

  const selectedDayTasks = selectedDay ? tasksOnDay(selectedDay) : [];

  return (
    <div className="view-root">
      <style>{`
        /* ── Tabs ── */
        .sched-tabs {
          display: flex; gap: 4px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 4px; width: fit-content;
        }
        .sched-tab {
          padding: 8px 18px; border-radius: 9px; font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.18s;
          color: var(--muted); border: 1px solid transparent;
          font-family: 'Syne', sans-serif; background: none;
        }
        .sched-tab.active {
          background: var(--glo); color: var(--green);
          border-color: var(--border2);
        }
        .sched-tab:hover:not(.active) { color: var(--cream); }

        /* ── Layout ── */
        .sched-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px; align-items: start;
        }
        .sched-left { display: flex; flex-direction: column; gap: 16px; }
        .sched-right { display: flex; flex-direction: column; gap: 16px; }

        /* ── Task card ── */
        .task-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 18px;
          display: flex; align-items: flex-start; gap: 14px;
          transition: border-color 0.18s; cursor: pointer;
        }
        .task-card:hover { border-color: var(--border2); }
        .task-card.done-card { opacity: 0.5; }

        .task-check-btn {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid var(--border2); background: none;
          cursor: pointer; flex-shrink: 0; margin-top: 1px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: var(--green); transition: all 0.2s;
        }
        .task-check-btn:hover { border-color: var(--green); background: var(--glo); }
        .task-check-btn.checked { background: var(--green); border-color: var(--green); color: #060e07; }

        .task-body { flex: 1; min-width: 0; }
        .task-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
        .task-title-text { font-size: 14px; font-weight: 600; color: var(--cream); }
        .task-title-text.strikethrough { text-decoration: line-through; color: var(--muted); }

        .task-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .task-meta-item { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono', monospace; }

        .task-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .task-icon-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid var(--border); background: none;
          cursor: pointer; font-size: 12px; color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
        }
        .task-icon-btn:hover { border-color: var(--border2); color: var(--cream); }

        .priority-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .rec-badge {
          font-size: 10px; background: var(--glo); color: var(--green);
          border: 1px solid var(--border2); border-radius: 100px;
          padding: 1px 7px; font-family: 'JetBrains Mono', monospace;
        }

        /* ── Section labels ── */
        .section-label {
          font-size: 11px; font-weight: 700; color: var(--muted);
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0 2px; margin-bottom: 4px;
          display: flex; align-items: center; gap: 8px;
        }
        .section-label-count {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 100px; padding: 1px 8px;
          font-size: 10px; color: var(--muted);
        }

        /* ── Overdue banner ── */
        .overdue-banner {
          background: var(--rlo); border: 1px solid rgba(224,92,92,0.25);
          border-radius: 12px; padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: var(--red);
        }

        /* ── Calendar ── */
        .cal-box {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
        }
        .cal-nav {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .cal-nav-btn {
          background: none; border: 1px solid var(--border);
          color: var(--muted); width: 28px; height: 28px;
          border-radius: 7px; cursor: pointer; font-size: 13px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
        }
        .cal-nav-btn:hover { border-color: var(--border2); color: var(--cream); }
        .cal-month-label { font-size: 13px; font-weight: 600; color: var(--cream); }
        .mini-cal { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
        .cal-head { font-size: 10px; color: var(--muted); text-align: center; font-weight: 600; padding: 4px 0; }
        .cal-day-btn {
          font-size: 12px; color: var(--muted); text-align: center;
          padding: 6px 2px; border-radius: 6px; cursor: pointer;
          position: relative; transition: all 0.15s;
          border: 1px solid transparent; background: none;
          font-family: 'Syne', sans-serif;
        }
        .cal-day-btn:hover { background: var(--glo); color: var(--cream); }
        .cal-day-btn.today { background: var(--green); color: #060e07; font-weight: 700; }
        .cal-day-btn.has-task { color: var(--cream); }
        .cal-day-btn.selected { border-color: var(--green); background: var(--glo); color: var(--green); }
        .cal-dot { position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: var(--amber); }
        .cal-day-btn.today .cal-dot { background: #060e07; }

        .cal-day-tasks { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
        .cal-day-task {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--muted); padding: 6px 10px;
          background: var(--bg3); border-radius: 8px;
        }

        /* ── Recommendations ── */
        .rec-box {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px;
          display: flex; flex-direction: column; gap: 12px;
        }
        .rec-header { display: flex; align-items: center; justify-content: space-between; }
        .rec-card {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px;
          display: flex; flex-direction: column; gap: 8px;
          transition: border-color 0.18s;
        }
        .rec-card:hover { border-color: var(--border2); }
        .rec-card-header { display: flex; align-items: center; gap: 8px; }
        .rec-card-title { font-size: 13px; font-weight: 600; color: var(--cream); flex: 1; }
        .rec-reason { font-size: 12px; color: var(--muted); line-height: 1.5; }
        .rec-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .rec-meta { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
        .rec-add-btn {
          font-size: 11px; padding: 4px 12px; border-radius: 7px;
          background: var(--green); color: #060e07; border: none;
          cursor: pointer; font-weight: 700; font-family: 'Syne', sans-serif;
          transition: all 0.18s; white-space: nowrap;
        }
        .rec-add-btn:hover { background: #6dd98a; }

        /* ── Irrigation schedule ── */
        .irrigation-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
        }
        .irrigation-card {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px;
        }
        .irr-icon { font-size: 22px; margin-bottom: 8px; }
        .irr-title { font-size: 13px; font-weight: 600; color: var(--cream); margin-bottom: 4px; }
        .irr-meta { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
        .irr-empty {
          text-align: center; padding: 32px;
          font-size: 13px; color: var(--muted);
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(6,14,7,0.85); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal-box {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 20px; width: 100%; max-width: 520px;
          max-height: 90vh; overflow-y: auto; padding: 32px;
          display: flex; flex-direction: column; gap: 24px;
          animation: slideUp 0.22s ease;
        }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal-header { display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; color: var(--cream); }
        .modal-close { background: none; border: 1px solid var(--border); color: var(--muted); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .modal-close:hover { border-color: var(--border2); color: var(--cream); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-size: 11px; font-weight: 600; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .form-input, .form-select, .form-textarea {
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 9px; padding: 10px 14px; font-size: 13px;
          font-family: 'Syne', sans-serif; color: var(--cream); outline: none;
          transition: border-color 0.2s; width: 100%;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--green); }
        .form-input::placeholder, .form-textarea::placeholder { color: var(--muted); }
        .form-select { appearance: none; cursor: pointer; }
        .form-select option { background: var(--bg2); }
        .form-textarea { resize: vertical; min-height: 64px; line-height: 1.5; }
        .form-error { display: flex; align-items: center; gap: 8px; background: var(--rlo); border: 1px solid rgba(224,92,92,0.25); border-radius: 9px; padding: 10px 14px; font-size: 13px; color: var(--red); }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }

        /* ── Confirm ── */
        .confirm-box { background: var(--bg2); border: 1px solid rgba(224,92,92,0.3); border-radius: 16px; padding: 28px; max-width: 360px; width: 100%; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.22s ease; }
        .confirm-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--red); }
        .confirm-desc { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; }

        /* ── Skeleton ── */
        .skeleton-row { height: 72px; border-radius: 12px; background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; margin-bottom: 8px; }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* ── Empty ── */
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 12px; background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; }
        .empty-icon { font-size: 44px; opacity: 0.35; }
        .empty-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: var(--cream); }
        .empty-sub { font-size: 13px; color: var(--muted); max-width: 240px; line-height: 1.6; }

        @media (max-width: 900px) {
          .sched-layout { grid-template-columns: 1fr; }
          .irrigation-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Scheduler</h1>
          <p className="view-sub">Plan tasks, get AI recommendations, and manage irrigation schedules.</p>
        </div>
        <button className="action-btn green" onClick={() => openAdd()}>+ Add Task</button>
      </div>

      {/* ── Tabs ── */}
      <div className="sched-tabs">
        {[
          { id: "upcoming", label: `Upcoming (${upcoming.length})` },
          { id: "done",     label: `Completed (${done.length})` },
          { id: "irrigation", label: `💧 Irrigation (${irrigationTasks.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            className={`sched-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sched-layout">
        {/* ── LEFT: Task list ── */}
        <div className="sched-left">

          {/* Error */}
          {error && (
            <div style={{ background:"var(--rlo)", border:"1px solid rgba(224,92,92,0.25)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"var(--red)" }}>
              ⚠️ {error}
            </div>
          )}

          {/* Skeleton */}
          {loading && [1,2,3].map(i => <div key={i} className="skeleton-row" />)}

          {/* ── UPCOMING TAB ── */}
          {!loading && activeTab === "upcoming" && (
            <>
              {/* Overdue */}
              {overdue.length > 0 && (
                <>
                  <div className="section-label" style={{color:"var(--red)"}}>
                    ⚠️ Overdue
                    <span className="section-label-count">{overdue.length}</span>
                  </div>
                  {overdue.map(task => (
                    <TaskCard key={task._id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </>
              )}

              {/* Today */}
              {upcoming.filter(t => isToday(t.date)).length > 0 && (
                <>
                  <div className="section-label">
                    Today
                    <span className="section-label-count">{upcoming.filter(t => isToday(t.date)).length}</span>
                  </div>
                  {upcoming.filter(t => isToday(t.date)).map(task => (
                    <TaskCard key={task._id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </>
              )}

              {/* Tomorrow */}
              {upcoming.filter(t => isTomorrow(t.date)).length > 0 && (
                <>
                  <div className="section-label">
                    Tomorrow
                    <span className="section-label-count">{upcoming.filter(t => isTomorrow(t.date)).length}</span>
                  </div>
                  {upcoming.filter(t => isTomorrow(t.date)).map(task => (
                    <TaskCard key={task._id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </>
              )}

              {/* This week */}
              {upcoming.filter(t => !isToday(t.date) && !isTomorrow(t.date)).length > 0 && (
                <>
                  <div className="section-label">
                    Upcoming
                    <span className="section-label-count">{upcoming.filter(t => !isToday(t.date) && !isTomorrow(t.date)).length}</span>
                  </div>
                  {upcoming.filter(t => !isToday(t.date) && !isTomorrow(t.date)).map(task => (
                    <TaskCard key={task._id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={setDeleteId} />
                  ))}
                </>
              )}

              {/* Empty */}
              {upcoming.length === 0 && overdue.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <div className="empty-title">No upcoming tasks</div>
                  <p className="empty-sub">Add a task or get AI recommendations based on your crops and weather.</p>
                  <button className="action-btn green" onClick={() => openAdd()}>+ Add Task</button>
                </div>
              )}
            </>
          )}

          {/* ── DONE TAB ── */}
          {!loading && activeTab === "done" && (
            <>
              {done.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="empty-title">No completed tasks yet</div>
                  <p className="empty-sub">Complete tasks to see them here.</p>
                </div>
              ) : (
                done.map(task => (
                  <TaskCard key={task._id} task={task} onToggle={toggleDone} onEdit={openEdit} onDelete={setDeleteId} />
                ))
              )}
            </>
          )}

          {/* ── IRRIGATION TAB ── */}
          {!loading && activeTab === "irrigation" && (
            <>
              <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:16, padding:20 }}>
                <div className="chart-box-title" style={{marginBottom:16}}>Irrigation Schedule</div>
                {irrigationTasks.length === 0 ? (
                  <div className="irr-empty">
                    <div style={{fontSize:40, marginBottom:12}}>💧</div>
                    <div style={{fontSize:14, fontWeight:600, color:"var(--cream)", marginBottom:6}}>No irrigation tasks scheduled</div>
                    <p style={{fontSize:13, color:"var(--muted)", marginBottom:16}}>Add irrigation tasks or get AI recommendations based on your crops.</p>
                    <button className="action-btn green" onClick={() => openAdd()}>+ Add Irrigation Task</button>
                  </div>
                ) : (
                  <div className="irrigation-grid">
                    {irrigationTasks.map(task => (
                      <div key={task._id} className="irrigation-card">
                        <div className="irr-icon">💧</div>
                        <div className="irr-title">{task.title}</div>
                        <div className="irr-meta" style={{marginBottom:6}}>
                          {dateLabel(task.date)} · {formatTime(task.time)}
                          {task.field && ` · ${task.field}`}
                          {task.crop && ` · ${task.crop}`}
                        </div>
                        {task.notes && (
                          <div style={{fontSize:12, color:"var(--muted)", lineHeight:1.5}}>{task.notes}</div>
                        )}
                        <div style={{marginTop:10, display:"flex", gap:8}}>
                          <button className="rec-add-btn" style={{background:"var(--glo)", color:"var(--green)"}} onClick={() => toggleDone(task)}>
                            ✓ Mark Done
                          </button>
                          <button className="task-icon-btn" onClick={() => openEdit(task)}>✏️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: Calendar + Recommendations ── */}
        <div className="sched-right">

          {/* Calendar */}
          <div className="cal-box">
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>‹</button>
              <div className="cal-month-label">
                {calMonth.toLocaleDateString("en-IN", { month:"long", year:"numeric" })}
              </div>
              <button className="cal-nav-btn" onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>›</button>
            </div>

            <div className="mini-cal">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className="cal-head">{d}</div>
              ))}
              {Array(firstDayOfMonth(calMonth.getFullYear(), calMonth.getMonth())).fill(null).map((_, i) => (
                <div key={`b${i}`} />
              ))}
              {Array(daysInMonth(calMonth.getFullYear(), calMonth.getMonth())).fill(null).map((_, i) => {
                const day = i + 1;
                const d   = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
                const hasTasks = taskDatesInMonth.has(d.toDateString());
                const isTod = d.toDateString() === new Date().toDateString();
                const isSel = selectedDay?.toDateString() === d.toDateString();
                return (
                  <button
                    key={day}
                    className={`cal-day-btn ${isTod ? "today" : ""} ${hasTasks ? "has-task" : ""} ${isSel ? "selected" : ""}`}
                    onClick={() => setSelectedDay(isSel ? null : d)}
                  >
                    {day}
                    {hasTasks && <span className="cal-dot" />}
                  </button>
                );
              })}
            </div>

            {/* Selected day tasks */}
            {selectedDay && (
              <div className="cal-day-tasks">
                <div style={{fontSize:12, fontWeight:600, color:"var(--muted)", marginBottom:4}}>
                  {selectedDay.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
                </div>
                {selectedDayTasks.length === 0 ? (
                  <div style={{fontSize:12, color:"var(--muted)", textAlign:"center", padding:"8px 0"}}>
                    No tasks — <button style={{background:"none", border:"none", color:"var(--green)", cursor:"pointer", fontSize:12}} onClick={() => openAdd(selectedDay)}>Add one</button>
                  </div>
                ) : (
                  selectedDayTasks.map(t => (
                    <div key={t._id} className="cal-day-task">
                      <span>{TYPE_ICONS[t.type] || "📌"}</span>
                      <span style={{flex:1, fontSize:12, color: t.done ? "var(--muted)" : "var(--cream)", textDecoration: t.done ? "line-through" : "none"}}>
                        {t.title}
                      </span>
                      <span style={{fontSize:11, color:"var(--muted)", fontFamily:"'JetBrains Mono',monospace"}}>
                        {formatTime(t.time)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="rec-box">
            <div className="rec-header">
              <div className="chart-box-title">⚡ AI Recommendations</div>
              <button
                className="action-btn"
                style={{padding:"6px 14px", fontSize:12}}
                onClick={fetchRecommendations}
                disabled={recsLoading}
              >
                {recsLoading ? "Loading…" : "↻ Generate"}
              </button>
            </div>

            {recsError && (
              <div style={{fontSize:12, color:"var(--red)", background:"var(--rlo)", borderRadius:8, padding:"8px 12px"}}>
                ⚠️ {recsError}
              </div>
            )}

            {!recsLoading && recommendations.length === 0 && !recsError && (
              <div style={{textAlign:"center", padding:"24px 0", fontSize:13, color:"var(--muted)"}}>
                <div style={{fontSize:32, marginBottom:8, opacity:0.4}}>🤖</div>
                Click "Generate" to get AI-powered task recommendations based on your crops and weather.
              </div>
            )}

            {recsLoading && [1,2,3].map(i => (
              <div key={i} style={{height:80, borderRadius:12, background:"linear-gradient(90deg, var(--bg3) 25%, var(--bg2) 50%, var(--bg3) 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite"}} />
            ))}

            {recommendations.map((rec, i) => (
              <div key={i} className="rec-card">
                <div className="rec-card-header">
                  <span>{TYPE_ICONS[rec.type] || "📌"}</span>
                  <div className="rec-card-title">{rec.title}</div>
                  <span style={{fontSize:10, padding:"2px 8px", borderRadius:100, background: rec.priority === "high" ? "var(--rlo)" : rec.priority === "medium" ? "var(--alo)" : "var(--glo)", color: PRIORITY_COLORS[rec.priority], border:`1px solid ${PRIORITY_COLORS[rec.priority]}40`, whiteSpace:"nowrap"}}>
                    {rec.priority}
                  </span>
                </div>
                {rec.reason && <div className="rec-reason">{rec.reason}</div>}
                <div className="rec-footer">
                  <div className="rec-meta">
                    📅 {dateLabel(rec.date)} · {formatTime(rec.time)}
                    {rec.crop && ` · ${rec.crop}`}
                  </div>
                  <button className="rec-add-btn" onClick={() => addRecommendationAsTask(rec)}>
                    + Add Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editTarget ? "Edit Task" : "Add New Task"}</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSave}>
              {formError && <div className="form-error">⚠️ {formError}</div>}

              <div className="form-group full">
                <label className="form-label">Task Title *</label>
                <input className="form-input" placeholder="e.g. Irrigate Field 1 Wheat" value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {Object.entries(TYPE_ICONS).map(([k, v]) => (
                      <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}>
                    <option value="high">🔴 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={form.time}
                    onChange={e => setForm({...form, time: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Crop (optional)</label>
                  <input className="form-input" placeholder="e.g. Wheat" value={form.crop}
                    onChange={e => setForm({...form, crop: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Field (optional)</label>
                  <input className="form-input" placeholder="e.g. Field 1" value={form.field}
                    onChange={e => setForm({...form, field: e.target.value})} />
                </div>
              </div>

              <div className="form-group full">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any additional notes…" value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})} />
              </div>

              <div className="modal-actions">
                <button type="button" className="action-btn" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="action-btn green" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Delete Task?</div>
            <p className="confirm-desc">
              This will permanently remove <strong style={{color:"var(--cream)"}}>
                {tasks.find(t => t._id === deleteId)?.title}
              </strong>. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="action-btn" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="action-btn amber" onClick={handleDelete} disabled={deleting}
                style={{background:"var(--rlo)", borderColor:"rgba(224,92,92,0.4)"}}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TaskCard sub-component ────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`task-card ${task.done ? "done-card" : ""}`}>
      <button
        className={`task-check-btn ${task.done ? "checked" : ""}`}
        onClick={() => onToggle(task)}
      >
        {task.done ? "✓" : ""}
      </button>

      <div className="task-body">
        <div className="task-title-row">
          <span className={`task-title-text ${task.done ? "strikethrough" : ""}`}>
            {TYPE_ICONS[task.type] || "📌"} {task.title}
          </span>
          {task.isRecommendation && <span className="rec-badge">AI</span>}
          <span className="priority-dot" style={{background: PRIORITY_COLORS[task.priority]}} />
        </div>
        <div className="task-meta">
          <span className="task-meta-item">📅 {dateLabel(task.date)}</span>
          <span className="task-meta-item">🕐 {formatTime(task.time)}</span>
          {task.crop  && <span className="task-meta-item">🌾 {task.crop}</span>}
          {task.field && <span className="task-meta-item">📍 {task.field}</span>}
        </div>
        {task.notes && (
          <div style={{fontSize:12, color:"var(--muted)", marginTop:6, lineHeight:1.5}}>{task.notes}</div>
        )}
      </div>

      <div className="task-actions">
        <button className="task-icon-btn" onClick={() => onEdit(task)} title="Edit">✏️</button>
        <button className="task-icon-btn" onClick={() => onDelete(task._id)} title="Delete">🗑️</button>
      </div>
    </div>
  );
}