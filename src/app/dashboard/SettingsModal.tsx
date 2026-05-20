"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SettingsState {
  emailAlerts: boolean;
  smsAlerts: boolean;
  diseaseAlerts: boolean;
  weatherAlerts: boolean;
  taskReminders: boolean;
  reminderMinutes: number;
  language: string;
  units: "metric" | "imperial";
  currency: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  farmSize: string;
  farmSizeUnit: "acres" | "hectares" | "bigha";
  primaryCrop: string;
  soilType: string;
  irrigationType: string;
  shareData: boolean;
  analytics: boolean;
}

const DEFAULTS: SettingsState = {
  emailAlerts: true, smsAlerts: false, diseaseAlerts: true,
  weatherAlerts: true, taskReminders: true, reminderMinutes: 30,
  language: "en", units: "metric", currency: "INR",
  dateFormat: "DD/MM/YYYY", farmSize: "", farmSizeUnit: "acres",
  primaryCrop: "", soilType: "", irrigationType: "",
  shareData: false, analytics: true,
};

const STORAGE_KEY = "farmify_settings";
interface Props { onClose: () => void; }

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 100,
      background: on ? "var(--green)" : "var(--bg4)",
      border: `1px solid ${on ? "var(--green)" : "var(--border2)"}`,
      cursor: "pointer", position: "relative", transition: "all 0.22s", flexShrink: 0, padding: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 22 : 3,
        width: 16, height: 16, borderRadius: "50%",
        background: on ? "#060e07" : "var(--muted)",
        transition: "left 0.22s", display: "block",
      }} />
    </button>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────
function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="s-select">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── PDF Generator (pure client-side, no backend) ──────────────────────────────
async function generateFarmPDF(crops: any[], tasks: any[], userName: string) {
  // Dynamically import jsPDF so it's only loaded when needed
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W   = 210;
  const MARGIN   = 16;
  const COL_W    = PAGE_W - MARGIN * 2;
  const GREEN    = [52, 168, 83]   as [number, number, number];
  const DARK     = [15, 30, 18]    as [number, number, number];
  const MUTED    = [120, 140, 110] as [number, number, number];
  const CREAM    = [220, 232, 200] as [number, number, number];
  const AMBER    = [220, 150, 50]  as [number, number, number];
  const RED_C    = [210, 80, 80]   as [number, number, number];
  const BG_CARD  = [18, 35, 22]    as [number, number, number];
  const BG_PAGE  = [9, 15, 10]     as [number, number, number];

  const completedTasks = tasks.filter((t: any) => t.done);
  const pendingTasks   = tasks.filter((t: any) => !t.done);
  const avgHealth      = crops.length
    ? Math.round(crops.reduce((s: number, c: any) => s + (c.health || 0), 0) / crops.length)
    : 0;

  let y = 0; // cursor

  // ── helpers ──────────────────────────────────────────────────────────────
  const newPage = () => {
    doc.addPage();
    // dark background on every page
    doc.setFillColor(...BG_PAGE);
    doc.rect(0, 0, PAGE_W, 297, "F");
    y = 16;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > 280) newPage();
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  };

  const statusLabel = (s: string) =>
    s === "good" ? "Healthy" : s === "warn" ? "Monitor" : "Action Needed";

  const statusColor = (s: string): [number, number, number] =>
    s === "good" ? GREEN : s === "warn" ? AMBER : RED_C;

  // ── PAGE 1: Cover ─────────────────────────────────────────────────────────
  doc.setFillColor(...BG_PAGE);
  doc.rect(0, 0, PAGE_W, 297, "F");

  // Green accent bar top
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PAGE_W, 3, "F");

  // Logo area
  y = 32;
  doc.setFillColor(...BG_CARD);
  doc.roundedRect(MARGIN, y, COL_W, 56, 4, 4, "F");

  doc.setTextColor(...GREEN);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("Farmify AI", MARGIN + 10, y + 22);

  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Farm Management Report", MARGIN + 10, y + 33);

  doc.setTextColor(...CREAM);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(userName, MARGIN + 10, y + 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}`, MARGIN + 10, y + 53);

  // ── Summary cards ──────────────────────────────────────────────────────
  y += 70;
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("FARM SUMMARY", MARGIN, y);
  y += 6;

  const summaryItems = [
    { label: "Total Crops",      value: String(crops.length),          color: GREEN },
    { label: "Avg Health",       value: `${avgHealth}%`,               color: avgHealth > 75 ? GREEN : avgHealth > 50 ? AMBER : RED_C },
    { label: "Tasks Done",       value: String(completedTasks.length), color: GREEN },
    { label: "Tasks Pending",    value: String(pendingTasks.length),   color: pendingTasks.length > 0 ? AMBER : GREEN },
  ];

  const cardW = (COL_W - 9) / 4;
  summaryItems.forEach((item, i) => {
    const cx = MARGIN + i * (cardW + 3);
    doc.setFillColor(...BG_CARD);
    doc.roundedRect(cx, y, cardW, 26, 3, 3, "F");
    // colored top strip
    doc.setFillColor(...item.color);
    doc.roundedRect(cx, y, cardW, 3, 3, 3, "F");
    doc.rect(cx, y + 1, cardW, 2, "F"); // flatten bottom of strip

    doc.setTextColor(...item.color);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, cx + cardW / 2, y + 16, { align: "center" });

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(item.label, cx + cardW / 2, y + 23, { align: "center" });
  });

  // ── Crop health breakdown ──────────────────────────────────────────────
  y += 36;
  const healthy  = crops.filter((c: any) => c.status === "good").length;
  const monitor  = crops.filter((c: any) => c.status === "warn").length;
  const critical = crops.filter((c: any) => c.status === "bad").length;

  doc.setFillColor(...BG_CARD);
  doc.roundedRect(MARGIN, y, COL_W, 28, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("CROP HEALTH OVERVIEW", MARGIN + 6, y + 8);

  const healthItems = [
    { label: `${healthy} Healthy`,      color: GREEN },
    { label: `${monitor} Monitor`,      color: AMBER },
    { label: `${critical} Action Needed`, color: RED_C },
  ];
  healthItems.forEach((item, i) => {
    const hx = MARGIN + 6 + i * 60;
    doc.setFillColor(...item.color);
    doc.circle(hx, y + 18, 2.5, "F");
    doc.setTextColor(...CREAM);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(item.label, hx + 5, y + 20);
  });

  // ── PAGE 2: Crops ─────────────────────────────────────────────────────────
  newPage();

  // Section heading
  doc.setFillColor(...GREEN);
  doc.roundedRect(MARGIN, y, 4, 10, 2, 2, "F");
  doc.setTextColor(...GREEN);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("My Crops", MARGIN + 8, y + 8);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${crops.length} crop${crops.length !== 1 ? "s" : ""} tracked`, MARGIN + 8, y + 15);
  y += 22;

  if (crops.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text("No crops recorded yet.", MARGIN, y + 8);
    y += 16;
  } else {
    crops.forEach((crop: any) => {
      checkPageBreak(42);

      // Card background
      doc.setFillColor(...BG_CARD);
      doc.roundedRect(MARGIN, y, COL_W, 38, 3, 3, "F");

      // Status colour strip on left
      doc.setFillColor(...statusColor(crop.status));
      doc.roundedRect(MARGIN, y, 3, 38, 2, 2, "F");
      doc.rect(MARGIN + 1, y, 2, 38, "F");

      // Crop name + field
      doc.setTextColor(...CREAM);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(crop.name || "—", MARGIN + 8, y + 9);

      doc.setTextColor(...MUTED);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${crop.field || "—"}  ·  ${crop.area || "—"}`, MARGIN + 8, y + 16);

      // Stage pill
      doc.setFillColor(30, 55, 36);
      doc.roundedRect(MARGIN + 8, y + 19, 36, 7, 2, 2, "F");
      doc.setTextColor(...GREEN);
      doc.setFontSize(7);
      doc.text(crop.stage || "—", MARGIN + 26, y + 24, { align: "center" });

      // Health bar
      const barX  = MARGIN + 50;
      const barY  = y + 20;
      const barW  = 60;
      doc.setFillColor(30, 50, 35);
      doc.roundedRect(barX, barY, barW, 5, 2, 2, "F");
      const hPct  = Math.min(100, Math.max(0, crop.health || 0));
      const hColor: [number,number,number] = hPct > 80 ? GREEN : hPct > 60 ? AMBER : RED_C;
      doc.setFillColor(...hColor);
      doc.roundedRect(barX, barY, (barW * hPct) / 100, 5, 2, 2, "F");
      doc.setTextColor(...hColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${hPct}%`, barX + barW + 3, barY + 5);

      // Status label
      const sColor = statusColor(crop.status);
      doc.setTextColor(...sColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(statusLabel(crop.status), MARGIN + 8, y + 33);

      // Days to harvest
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`${crop.daysLeft ?? "—"} days to harvest`, MARGIN + 60, y + 33);

      // Soil / Irrigation
      doc.text(`Soil: ${crop.soilType || "—"}  ·  Irrigation: ${crop.irrigationType || "—"}`, MARGIN + 118, y + 9);

      // Added date
      if (crop.createdAt) {
        doc.setFontSize(7);
        doc.text(`Added: ${fmtDate(crop.createdAt)}`, MARGIN + 118, y + 16);
      }

      // Notes
      if (crop.notes) {
        doc.setTextColor(...MUTED);
        doc.setFontSize(7);
        const truncated = crop.notes.length > 60 ? crop.notes.slice(0, 60) + "…" : crop.notes;
        doc.text(`Note: ${truncated}`, MARGIN + 8, y + 36);
      }

      y += 43;
    });
  }

  // ── PAGE 3: Completed Tasks ───────────────────────────────────────────────
  newPage();

  doc.setFillColor(...GREEN);
  doc.roundedRect(MARGIN, y, 4, 10, 2, 2, "F");
  doc.setTextColor(...GREEN);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Completed Tasks", MARGIN + 8, y + 8);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${completedTasks.length} task${completedTasks.length !== 1 ? "s" : ""} completed`, MARGIN + 8, y + 15);
  y += 22;

  if (completedTasks.length === 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(10);
    doc.text("No completed tasks yet.", MARGIN, y + 8);
    y += 16;
  } else {
    const TYPE_ICONS: Record<string, string> = {
      irrigation: "Water", fertilizer: "Fertilize", spray: "Spray",
      harvest: "Harvest", soil: "Soil Test", pruning: "Pruning", other: "Task",
    };
    const PRIORITY_COLORS: Record<string, [number,number,number]> = {
      high: RED_C, medium: AMBER, low: GREEN,
    };

    completedTasks
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((task: any) => {
        checkPageBreak(26);

        doc.setFillColor(...BG_CARD);
        doc.roundedRect(MARGIN, y, COL_W, 22, 3, 3, "F");

        // Green check circle
        doc.setFillColor(...GREEN);
        doc.circle(MARGIN + 9, y + 11, 4, "F");
        doc.setTextColor(9, 15, 10);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text("✓", MARGIN + 7, y + 13);

        // Title (strikethrough-style via muted colour)
        doc.setTextColor(...MUTED);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(task.title || "—", MARGIN + 17, y + 9);

        // Type badge
        const typeLabel = TYPE_ICONS[task.type] || "Task";
        doc.setFillColor(30, 55, 36);
        doc.roundedRect(MARGIN + 17, y + 11, 28, 6, 2, 2, "F");
        doc.setTextColor(...GREEN);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(typeLabel, MARGIN + 31, y + 15.5, { align: "center" });

        // Date
        doc.setTextColor(...MUTED);
        doc.setFontSize(8);
        doc.text(fmtDate(task.date), MARGIN + 50, y + 16);

        // Crop / Field
        if (task.crop || task.field) {
          doc.setFontSize(8);
          doc.text([task.crop, task.field].filter(Boolean).join(" · "), MARGIN + 90, y + 16);
        }

        // Priority dot
        const pColor = PRIORITY_COLORS[task.priority] || MUTED;
        doc.setFillColor(...pColor);
        doc.circle(PAGE_W - MARGIN - 8, y + 11, 2.5, "F");
        doc.setTextColor(...pColor);
        doc.setFontSize(7);
        doc.text((task.priority || "").toUpperCase(), PAGE_W - MARGIN - 20, y + 13);

        // AI badge
        if (task.isRecommendation) {
          doc.setFillColor(30, 55, 36);
          doc.roundedRect(PAGE_W - MARGIN - 18, y + 3, 12, 6, 2, 2, "F");
          doc.setTextColor(...GREEN);
          doc.setFontSize(6);
          doc.text("AI", PAGE_W - MARGIN - 12, y + 7.5, { align: "center" });
        }

        y += 26;
      });
  }

  // ── PAGE 4: Pending Tasks ─────────────────────────────────────────────────
  newPage();

  doc.setFillColor(...AMBER);
  doc.roundedRect(MARGIN, y, 4, 10, 2, 2, "F");
  doc.setTextColor(...AMBER);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Pending Tasks", MARGIN + 8, y + 8);
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${pendingTasks.length} task${pendingTasks.length !== 1 ? "s" : ""} remaining`, MARGIN + 8, y + 15);
  y += 22;

  if (pendingTasks.length === 0) {
    doc.setFillColor(...BG_CARD);
    doc.roundedRect(MARGIN, y, COL_W, 22, 3, 3, "F");
    doc.setTextColor(...GREEN);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("All tasks completed! Great work.", MARGIN + COL_W / 2, y + 13, { align: "center" });
    y += 28;
  } else {
    pendingTasks
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach((task: any) => {
        checkPageBreak(30);

        const isOverdue = new Date(task.date) < new Date(new Date().setHours(0,0,0,0));

        doc.setFillColor(...BG_CARD);
        doc.roundedRect(MARGIN, y, COL_W, 26, 3, 3, "F");

        // Left accent: red if overdue, amber otherwise
        doc.setFillColor(...(isOverdue ? RED_C : AMBER));
        doc.roundedRect(MARGIN, y, 3, 26, 2, 2, "F");
        doc.rect(MARGIN + 1, y, 2, 26, "F");

        // Empty circle
        doc.setDrawColor(...MUTED);
        doc.setLineWidth(0.5);
        doc.circle(MARGIN + 9, y + 13, 4, "S");

        // Title
        doc.setTextColor(...CREAM);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(task.title || "—", MARGIN + 17, y + 10);

        // Overdue label
        if (isOverdue) {
          doc.setFillColor(...RED_C);
          doc.roundedRect(MARGIN + 17, y + 12, 20, 6, 2, 2, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6.5);
          doc.setFont("helvetica", "bold");
          doc.text("OVERDUE", MARGIN + 27, y + 16.5, { align: "center" });
          doc.setFont("helvetica", "normal");
        }

        // Date
        doc.setTextColor(...(isOverdue ? RED_C : MUTED));
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const dateX = isOverdue ? MARGIN + 42 : MARGIN + 17;
        doc.text(fmtDate(task.date) + "  " + (task.time || ""), dateX, y + 21);

        // Crop / Field
        if (task.crop || task.field) {
          doc.setTextColor(...MUTED);
          doc.setFontSize(8);
          doc.text([task.crop, task.field].filter(Boolean).join(" · "), MARGIN + 90, y + 21);
        }

        // Priority
        const pColors: Record<string, [number,number,number]> = { high: RED_C, medium: AMBER, low: GREEN };
        const pColor = pColors[task.priority] || MUTED;
        doc.setFillColor(...pColor);
        doc.circle(PAGE_W - MARGIN - 8, y + 13, 2.5, "F");
        doc.setTextColor(...pColor);
        doc.setFontSize(7);
        doc.text((task.priority || "").toUpperCase(), PAGE_W - MARGIN - 20, y + 15);

        y += 30;
      });
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Footer bar
    doc.setFillColor(...BG_CARD);
    doc.rect(0, 286, PAGE_W, 11, "F");
    doc.setFillColor(...GREEN);
    doc.rect(0, 286, PAGE_W, 0.5, "F");

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Farmify AI — Farm Management Report", MARGIN, 292);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, 292, { align: "right" });
    doc.text(new Date().toLocaleDateString("en-IN"), PAGE_W / 2, 292, { align: "center" });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const date = new Date().toISOString().split("T")[0];
  doc.save(`Farmify-Report-${date}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<"notifications" | "display" | "farm" | "privacy">("notifications");
  const [settings, setSettings] = useState<SettingsState>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true); setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => { setSettings(DEFAULTS); setDirty(true); setSaved(false); };

  // ── Export as PDF ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true); setExportError(""); setExportSuccess("");
    try {
      const client = api();
      const [cropsRes, tasksRes] = await Promise.all([
        client.get("/crops"),
        client.get("/tasks"),
      ]);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await generateFarmPDF(cropsRes.data, tasksRes.data, user?.name || "Farmer");
      setExportSuccess(`PDF downloaded — ${cropsRes.data.length} crops & ${tasksRes.data.filter((t:any)=>t.done).length} completed tasks.`);
      setTimeout(() => setExportSuccess(""), 5000);
    } catch (err: any) {
      setExportError(
        err.response?.status === 401
          ? "Session expired. Please log in again."
          : "Failed to fetch data. Make sure the server is running."
      );
    } finally {
      setExporting(false);
    }
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
          background: rgba(6,14,7,0.88); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; animation: sFadeIn 0.2s ease;
        }
        @keyframes sFadeIn { from{opacity:0} to{opacity:1} }
        .s-modal {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 24px; width: 100%; max-width: 640px;
          max-height: 90vh; display: flex; flex-direction: column;
          animation: sSlideUp 0.25s ease; overflow: hidden;
        }
        @keyframes sSlideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .s-header {
          padding: 28px 32px 20px; display: flex; align-items: flex-start;
          justify-content: space-between; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .s-title { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:700; color:var(--cream); }
        .s-subtitle { font-size:13px; color:var(--muted); margin-top:3px; }
        .s-close {
          background:none; border:1px solid var(--border); color:var(--muted);
          width:34px; height:34px; border-radius:9px; cursor:pointer; font-size:16px;
          display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0;
        }
        .s-close:hover { border-color:var(--border2); color:var(--cream); }
        .s-layout { display:flex; flex:1; min-height:0; overflow:hidden; }
        .s-tabs {
          width:160px; flex-shrink:0; border-right:1px solid var(--border);
          padding:16px 10px; display:flex; flex-direction:column; gap:2px; background:var(--bg3);
        }
        .s-tab {
          display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
          font-size:13px; font-weight:500; color:var(--muted); cursor:pointer;
          border:1px solid transparent; transition:all 0.18s; background:none;
          font-family:'Syne',sans-serif; text-align:left; white-space:nowrap;
        }
        .s-tab:hover { color:var(--cream); background:var(--glo); }
        .s-tab.active { color:var(--green); background:var(--glo); border-color:var(--border2); }
        .s-tab-icon { font-size:15px; flex-shrink:0; }
        .s-content {
          flex:1; overflow-y:auto; padding:24px 28px;
          display:flex; flex-direction:column; gap:20px;
        }
        .s-content::-webkit-scrollbar { width:4px; }
        .s-content::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
        .s-section-title {
          font-size:11px; font-weight:700; color:var(--muted);
          letter-spacing:0.1em; text-transform:uppercase;
          padding-bottom:8px; border-bottom:1px solid var(--border);
        }
        .s-row { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:4px 0; }
        .s-row-left { flex:1; min-width:0; }
        .s-row-label { font-size:14px; font-weight:600; color:var(--cream); }
        .s-row-desc { font-size:12px; color:var(--muted); margin-top:2px; }
        .s-select {
          background:var(--bg3); border:1px solid var(--border2); border-radius:9px;
          padding:9px 12px; font-size:13px; color:var(--cream); font-family:'Syne',sans-serif;
          outline:none; cursor:pointer; transition:border-color 0.2s; min-width:140px;
        }
        .s-select:focus { border-color:var(--green); }
        .s-select option { background:#111f13; }
        .s-input {
          background:var(--bg3); border:1px solid var(--border2); border-radius:9px;
          padding:9px 12px; font-size:13px; color:var(--cream); font-family:'Syne',sans-serif;
          outline:none; transition:border-color 0.2s; width:100%;
        }
        .s-input:focus { border-color:var(--green); }
        .s-input::placeholder { color:var(--muted); }
        .s-input-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .s-number-wrap { display:flex; align-items:center; gap:8px; }
        .s-number-btn {
          width:30px; height:30px; border-radius:7px; border:1px solid var(--border2);
          background:var(--bg3); color:var(--cream); font-size:16px; cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:all 0.18s; flex-shrink:0;
        }
        .s-number-btn:hover { border-color:var(--green); background:var(--glo); }
        .s-number-val { font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--cream); min-width:40px; text-align:center; }
        .s-divider { height:1px; background:var(--border); }
        .s-radio-group { display:flex; gap:8px; flex-wrap:wrap; }
        .s-radio-btn {
          padding:7px 16px; border-radius:9px; border:1px solid var(--border);
          background:var(--bg3); font-size:12px; font-weight:600; color:var(--muted);
          cursor:pointer; transition:all 0.18s; font-family:'Syne',sans-serif;
        }
        .s-radio-btn:hover { border-color:var(--border2); color:var(--cream); }
        .s-radio-btn.active { background:var(--glo); color:var(--green); border-color:var(--border2); }
        .s-warning {
          display:flex; gap:10px; align-items:flex-start;
          background:var(--alo); border:1px solid rgba(232,162,69,0.2);
          border-radius:10px; padding:12px 14px; font-size:12px; color:var(--amber); line-height:1.5;
        }

        /* Export card */
        .s-export-card {
          background:var(--bg3); border:1px solid var(--border);
          border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:14px;
        }
        .s-export-header { display:flex; gap:14px; align-items:flex-start; }
        .s-export-icon {
          width:44px; height:44px; border-radius:12px;
          background:var(--glo); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          font-size:20px; flex-shrink:0;
        }
        .s-export-title { font-size:14px; font-weight:700; color:var(--cream); margin-bottom:4px; }
        .s-export-desc { font-size:12px; color:var(--muted); line-height:1.6; }
        .s-export-pages {
          display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
        }
        .s-export-page {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:10px; padding:10px 8px; text-align:center;
        }
        .s-export-page-icon { font-size:18px; margin-bottom:4px; }
        .s-export-page-label { font-size:10px; color:var(--muted); line-height:1.3; }
        .s-export-msg {
          font-size:12px; border-radius:9px; padding:10px 14px;
          display:flex; align-items:center; gap:8px; line-height:1.4;
        }
        .s-export-msg.success { background:var(--glo); color:var(--green); border:1px solid rgba(76,175,110,0.25); }
        .s-export-msg.error   { background:var(--rlo); color:var(--red);   border:1px solid rgba(224,92,92,0.25); }

        .s-footer {
          padding:16px 28px; border-top:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; flex-shrink:0; background:var(--bg2);
        }
        .s-saved { display:flex; align-items:center; gap:6px; font-size:13px; color:var(--green); font-family:'JetBrains Mono',monospace; }
        .s-footer-btns { display:flex; gap:10px; }
      `}</style>

      <div className="s-overlay" onClick={onClose}>
        <div className="s-modal" onClick={e => e.stopPropagation()}>

          <div className="s-header">
            <div>
              <div className="s-title">Settings</div>
              <div className="s-subtitle">Manage your preferences and farm configuration.</div>
            </div>
            <button className="s-close" onClick={onClose}>✕</button>
          </div>

          <div className="s-layout">
            <div className="s-tabs">
              {TABS.map(t => (
                <button key={t.id} className={`s-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                  <span className="s-tab-icon">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            <div className="s-content">

              {/* ── NOTIFICATIONS ── */}
              {tab === "notifications" && (<>
                <div className="s-section-title">Alert Channels</div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Email Alerts</div><div className="s-row-desc">Receive alerts and summaries via email</div></div>
                  <Toggle on={settings.emailAlerts} onChange={v => update("emailAlerts", v)} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">SMS Alerts</div><div className="s-row-desc">Get critical alerts as text messages</div></div>
                  <Toggle on={settings.smsAlerts} onChange={v => update("smsAlerts", v)} />
                </div>
                <div className="s-divider" />
                <div className="s-section-title">Alert Types</div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Disease Detection Alerts</div><div className="s-row-desc">Notify when AI detects crop disease</div></div>
                  <Toggle on={settings.diseaseAlerts} onChange={v => update("diseaseAlerts", v)} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Weather Warnings</div><div className="s-row-desc">Alerts for frost, heat waves, heavy rain</div></div>
                  <Toggle on={settings.weatherAlerts} onChange={v => update("weatherAlerts", v)} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Task Reminders</div><div className="s-row-desc">Reminders before scheduled tasks</div></div>
                  <Toggle on={settings.taskReminders} onChange={v => update("taskReminders", v)} />
                </div>
                {settings.taskReminders && (<>
                  <div className="s-divider" />
                  <div className="s-section-title">Reminder Timing</div>
                  <div className="s-row">
                    <div className="s-row-left"><div className="s-row-label">Remind me before</div><div className="s-row-desc">Minutes before task starts</div></div>
                    <div className="s-number-wrap">
                      <button className="s-number-btn" onClick={() => update("reminderMinutes", Math.max(5, settings.reminderMinutes - 5))}>−</button>
                      <div className="s-number-val">{settings.reminderMinutes}m</div>
                      <button className="s-number-btn" onClick={() => update("reminderMinutes", Math.min(120, settings.reminderMinutes + 5))}>+</button>
                    </div>
                  </div>
                </>)}
              </>)}

              {/* ── DISPLAY ── */}
              {tab === "display" && (<>
                <div className="s-section-title">Language & Region</div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Language</div><div className="s-row-desc">App display language</div></div>
                  <Select value={settings.language} onChange={v => update("language", v)} options={[
                    {value:"en",label:"English"},{value:"hi",label:"हिंदी (Hindi)"},{value:"mr",label:"मराठी (Marathi)"},
                    {value:"gu",label:"ગુજરાતી (Gujarati)"},{value:"pa",label:"ਪੰਜਾਬੀ (Punjabi)"},
                    {value:"te",label:"తెలుగు (Telugu)"},{value:"ta",label:"தமிழ் (Tamil)"},{value:"kn",label:"ಕನ್ನಡ (Kannada)"},
                  ]} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Currency</div><div className="s-row-desc">Used in revenue and cost estimates</div></div>
                  <Select value={settings.currency} onChange={v => update("currency", v)} options={[
                    {value:"INR",label:"₹ INR"},{value:"USD",label:"$ USD"},{value:"EUR",label:"€ EUR"},
                  ]} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Date Format</div><div className="s-row-desc">How dates appear across the app</div></div>
                  <Select value={settings.dateFormat} onChange={v => update("dateFormat", v as any)} options={[
                    {value:"DD/MM/YYYY",label:"DD/MM/YYYY"},{value:"MM/DD/YYYY",label:"MM/DD/YYYY"},{value:"YYYY-MM-DD",label:"YYYY-MM-DD"},
                  ]} />
                </div>
                <div className="s-divider" />
                <div className="s-section-title">Units</div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Measurement System</div><div className="s-row-desc">Used for temperature, rainfall, wind</div></div>
                  <div className="s-radio-group">
                    {(["metric","imperial"] as const).map(u => (
                      <button key={u} className={`s-radio-btn ${settings.units===u?"active":""}`} onClick={() => update("units", u)}>
                        {u==="metric" ? "Metric (°C, mm)" : "Imperial (°F, in)"}
                      </button>
                    ))}
                  </div>
                </div>
              </>)}

              {/* ── FARM SETUP ── */}
              {tab === "farm" && (<>
                <div className="s-section-title">Farm Details</div>
                <div className="s-input-row">
                  <div>
                    <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>Farm Size</div>
                    <input className="s-input" type="number" placeholder="e.g. 5" value={settings.farmSize} onChange={e => update("farmSize", e.target.value)} min="0" />
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>Unit</div>
                    <Select value={settings.farmSizeUnit} onChange={v => update("farmSizeUnit", v as any)} options={[
                      {value:"acres",label:"Acres"},{value:"hectares",label:"Hectares"},{value:"bigha",label:"Bigha"},
                    ]} />
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>Primary Crop</div>
                  <Select value={settings.primaryCrop} onChange={v => update("primaryCrop", v)} options={[
                    {value:"",label:"Select crop…"},{value:"wheat",label:"🌾 Wheat"},{value:"rice",label:"🌾 Rice / Paddy"},
                    {value:"cotton",label:"🪴 Cotton"},{value:"soybean",label:"🫘 Soybean"},{value:"maize",label:"🌽 Maize / Corn"},
                    {value:"sugarcane",label:"🎋 Sugarcane"},{value:"tomato",label:"🍅 Tomato"},{value:"onion",label:"🧅 Onion"},
                    {value:"potato",label:"🥔 Potato"},{value:"mango",label:"🥭 Mango"},{value:"other",label:"Other"},
                  ]} />
                </div>
                <div className="s-divider" />
                <div className="s-section-title">Soil & Irrigation</div>
                <div className="s-input-row">
                  <div>
                    <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>Soil Type</div>
                    <Select value={settings.soilType} onChange={v => update("soilType", v)} options={[
                      {value:"",label:"Select type…"},{value:"black",label:"Black (Regur)"},{value:"red",label:"Red & Laterite"},
                      {value:"alluvial",label:"Alluvial"},{value:"sandy",label:"Sandy"},{value:"loamy",label:"Loamy"},
                      {value:"clay",label:"Clay"},{value:"saline",label:"Saline / Alkaline"},
                    ]} />
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>Irrigation Type</div>
                    <Select value={settings.irrigationType} onChange={v => update("irrigationType", v)} options={[
                      {value:"",label:"Select type…"},{value:"drip",label:"Drip Irrigation"},{value:"sprinkler",label:"Sprinkler"},
                      {value:"flood",label:"Flood / Surface"},{value:"furrow",label:"Furrow"},{value:"rainfed",label:"Rainfed only"},
                    ]} />
                  </div>
                </div>
                <div style={{background:"var(--glo)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                  💡 These details help the AI Chatbot give more accurate recommendations tailored to your farm.
                </div>
              </>)}

              {/* ── PRIVACY ── */}
              {tab === "privacy" && (<>
                <div className="s-section-title">Data & Privacy</div>
                <div className="s-warning">
                  <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
                  <span>Farmify AI uses your farm data only to improve your experience. We never sell personal data to third parties.</span>
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Share Farm Data</div><div className="s-row-desc">Anonymously contribute data to improve AI crop models</div></div>
                  <Toggle on={settings.shareData} onChange={v => update("shareData", v)} />
                </div>
                <div className="s-row">
                  <div className="s-row-left"><div className="s-row-label">Usage Analytics</div><div className="s-row-desc">Help us improve the app with anonymous usage stats</div></div>
                  <Toggle on={settings.analytics} onChange={v => update("analytics", v)} />
                </div>

                <div className="s-divider" />
                <div className="s-section-title">Download Farm Report</div>

                <div className="s-export-card">
                  <div className="s-export-header">
                    <div className="s-export-icon">📄</div>
                    <div>
                      <div className="s-export-title">Farm Report PDF</div>
                      <div className="s-export-desc">
                        A clean, printable PDF report your family, bank, or agronomist can actually read — no tech knowledge needed.
                      </div>
                    </div>
                  </div>

                  {/* Page previews */}
                  <div className="s-export-pages">
                    {[
                      {icon:"📊", label:"Summary & Health Overview"},
                      {icon:"🌾", label:"All Crops with Details"},
                      {icon:"✅", label:"Completed Tasks"},
                      {icon:"📅", label:"Pending & Overdue Tasks"},
                    ].map(p => (
                      <div key={p.label} className="s-export-page">
                        <div className="s-export-page-icon">{p.icon}</div>
                        <div className="s-export-page-label">{p.label}</div>
                      </div>
                    ))}
                  </div>

                  {exportSuccess && <div className="s-export-msg success">✅ {exportSuccess}</div>}
                  {exportError   && <div className="s-export-msg error">⚠️ {exportError}</div>}

                  <button className="action-btn green" style={{alignSelf:"flex-start"}} onClick={handleExport} disabled={exporting}>
                    {exporting ? "⏳ Building PDF…" : "⬇ Download PDF Report"}
                  </button>
                </div>

                <div className="s-divider" />
                <div className="s-section-title">Account</div>
                <div className="s-row">
                  <div className="s-row-left">
                    <div className="s-row-label" style={{color:"var(--red)"}}>Delete Account</div>
                    <div className="s-row-desc">Permanently remove all your data. Cannot be undone.</div>
                  </div>
                  <button className="action-btn amber" onClick={() => {
                    if (confirm("Are you sure? This will permanently delete your account and all farm data.")) {
                      localStorage.clear(); window.location.href = "/login";
                    }
                  }}>Delete</button>
                </div>
              </>)}

            </div>
          </div>

          <div className="s-footer">
            <div>
              {saved && <div className="s-saved">✓ Settings saved</div>}
              {!saved && dirty && <div style={{fontSize:12,color:"var(--amber)",fontFamily:"'JetBrains Mono',monospace"}}>Unsaved changes</div>}
              {!saved && !dirty && <div style={{fontSize:12,color:"var(--muted)"}}>Settings are saved locally on this device.</div>}
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