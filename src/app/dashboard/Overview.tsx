"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Crop {
  _id: string;
  name: string;
  field: string;
  health: number;
  status: "good" | "warn" | "bad";
  stage: string;
  daysLeft: number;
  area?: string;
  soilType?: string;
  irrigationType?: string;
  notes?: string;
  createdAt?: string;
}

interface Task {
  _id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  crop?: string;
  field?: string;
  isRecommendation?: boolean;
}

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

const TYPE_ICONS: Record<string, string> = {
  irrigation: "💧", fertilizer: "🌿", spray: "🧪",
  harvest: "🌾", soil: "🪱", pruning: "✂️", other: "📌",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_H = 100; // fixed pixel height for the bar chart

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday    = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const isTomorrow = (iso: string) => { const t = new Date(); t.setDate(t.getDate()+1); return new Date(iso).toDateString() === t.toDateString(); };
const isOverdue  = (iso: string) => new Date(iso) < new Date(new Date().setHours(0,0,0,0));
const formatTime = (time: string) => { const [h,m] = time.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };
const dateLabel  = (iso: string) => {
  if (isToday(iso))    return "Today";
  if (isTomorrow(iso)) return "Tomorrow";
  if (isOverdue(iso))  return "Overdue";
  return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 48, r = 10 }: { h?: number; r?: number }) {
  return (
    <div style={{
      height: h, borderRadius: r, flexShrink: 0,
      background: "linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%)",
      backgroundSize: "200% 100%", animation: "ovShimmer 1.4s infinite",
    }} />
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 60, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  const last = pts.split(" ").at(-1)!.split(",");
  return (
    <svg width={w} height={h} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
type RGB = [number, number, number];

async function generateFarmPDF(crops: Crop[], tasks: Task[], userName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W  = 210, MARGIN = 16, COL_W = PAGE_W - MARGIN * 2;
  const GREEN:   RGB = [52,168,83];
  const DARK:    RGB = [9,15,10];
  const MUTED:   RGB = [120,140,110];
  const CREAM:   RGB = [220,232,200];
  const AMBER:   RGB = [220,150,50];
  const RED_C:   RGB = [210,80,80];
  const BG_CARD: RGB = [18,35,22];

  // ── typed helpers so TypeScript never sees a spread ──────────────────────
  const fc = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const tc = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const dc = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);

  const completedTasks = tasks.filter(t => t.done);
  const pendingTasks   = tasks.filter(t => !t.done);
  const avgHealth      = crops.length ? Math.round(crops.reduce((s,c) => s+c.health,0)/crops.length) : 0;

  let y = 0;
  const newPage = () => { doc.addPage(); fc(DARK); doc.rect(0,0,PAGE_W,297,"F"); y = 16; };
  const checkBreak = (n: number) => { if (y+n > 280) newPage(); };
  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); } catch { return iso; } };
  const statusLabel = (s: string) => s==="good"?"Healthy":s==="warn"?"Monitor":"Action Needed";
  const statusColor = (s: string): RGB => s==="good"?GREEN:s==="warn"?AMBER:RED_C;

  // PAGE 1 – Cover
  fc(DARK); doc.rect(0,0,PAGE_W,297,"F");
  fc(GREEN); doc.rect(0,0,PAGE_W,3,"F");
  y = 32;
  fc(BG_CARD); doc.roundedRect(MARGIN,y,COL_W,56,4,4,"F");
  tc(GREEN); doc.setFontSize(28); doc.setFont("helvetica","bold"); doc.text("Farmify AI",MARGIN+10,y+22);
  tc(MUTED); doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.text("Farm Management Report",MARGIN+10,y+33);
  tc(CREAM); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text(userName,MARGIN+10,y+46);
  tc(MUTED); doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}`,MARGIN+10,y+53);
  y += 70;

  // Summary cards
  tc(MUTED); doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.text("FARM SUMMARY",MARGIN,y); y+=6;
  const cardW=(COL_W-9)/4;
  ([{label:"Total Crops",value:String(crops.length),color:GREEN},
   {label:"Avg Health",value:`${avgHealth}%`,color:(avgHealth>75?GREEN:avgHealth>50?AMBER:RED_C) as RGB},
   {label:"Tasks Done",value:String(completedTasks.length),color:GREEN},
   {label:"Tasks Pending",value:String(pendingTasks.length),color:(pendingTasks.length>0?AMBER:GREEN) as RGB},
  ] as {label:string;value:string;color:RGB}[]).forEach((item,i) => {
    const cx=MARGIN+i*(cardW+3);
    fc(BG_CARD); doc.roundedRect(cx,y,cardW,26,3,3,"F");
    fc(item.color); doc.roundedRect(cx,y,cardW,3,3,3,"F"); doc.rect(cx,y+1,cardW,2,"F");
    tc(item.color); doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.text(item.value,cx+cardW/2,y+16,{align:"center"});
    tc(MUTED); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(item.label,cx+cardW/2,y+23,{align:"center"});
  });
  y+=36;

  const healthy=crops.filter(c=>c.status==="good").length, monitor=crops.filter(c=>c.status==="warn").length, critical=crops.filter(c=>c.status==="bad").length;
  fc(BG_CARD); doc.roundedRect(MARGIN,y,COL_W,28,3,3,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(8); tc(MUTED); doc.text("CROP HEALTH OVERVIEW",MARGIN+6,y+8);
  ([{label:`${healthy} Healthy`,color:GREEN},{label:`${monitor} Monitor`,color:AMBER},{label:`${critical} Action Needed`,color:RED_C}] as {label:string;color:RGB}[])
    .forEach((item,i) => { const hx=MARGIN+6+i*60; fc(item.color); doc.circle(hx,y+18,2.5,"F"); tc(CREAM); doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(item.label,hx+5,y+20); });

  // PAGE 2 – Crops
  newPage();
  fc(GREEN); doc.roundedRect(MARGIN,y,4,10,2,2,"F");
  tc(GREEN); doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.text("My Crops",MARGIN+8,y+8);
  tc(MUTED); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(`${crops.length} crop${crops.length!==1?"s":""} tracked`,MARGIN+8,y+15); y+=22;
  if (crops.length===0) { tc(MUTED); doc.setFontSize(10); doc.text("No crops recorded yet.",MARGIN,y+8); y+=16; }
  else crops.forEach((crop) => {
    checkBreak(42);
    const sc = statusColor(crop.status);
    fc(BG_CARD); doc.roundedRect(MARGIN,y,COL_W,38,3,3,"F");
    fc(sc); doc.roundedRect(MARGIN,y,3,38,2,2,"F"); doc.rect(MARGIN+1,y,2,38,"F");
    tc(CREAM); doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.text(crop.name||"—",MARGIN+8,y+9);
    tc(MUTED); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(`${crop.field||"—"}  ·  ${crop.area||"—"}`,MARGIN+8,y+16);
    doc.setFillColor(30,55,36); doc.roundedRect(MARGIN+8,y+19,36,7,2,2,"F");
    tc(GREEN); doc.setFontSize(7); doc.text(crop.stage||"—",MARGIN+26,y+24,{align:"center"});
    const bX=MARGIN+50,bY=y+20,bW=60,hPct=Math.min(100,Math.max(0,crop.health||0));
    const hCol: RGB = hPct>80?GREEN:hPct>60?AMBER:RED_C;
    doc.setFillColor(30,50,35); doc.roundedRect(bX,bY,bW,5,2,2,"F");
    fc(hCol); doc.roundedRect(bX,bY,(bW*hPct)/100,5,2,2,"F");
    tc(hCol); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text(`${hPct}%`,bX+bW+3,bY+5);
    doc.setTextColor(...statusColor(crop.status)); doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.text(statusLabel(crop.status),MARGIN+8,y+33);
    doc.setTextColor(...MUTED); doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.text(`${crop.daysLeft??"—"} days to harvest`,MARGIN+60,y+33);
    doc.text(`Soil: ${crop.soilType||"—"}  ·  Irrig: ${crop.irrigationType||"—"}`,MARGIN+118,y+9);
    if(crop.createdAt){doc.setFontSize(7);doc.text(`Added: ${fmtDate(crop.createdAt)}`,MARGIN+118,y+16);}
    if(crop.notes){doc.setTextColor(...MUTED);doc.setFontSize(7);doc.text(`Note: ${crop.notes.length>58?crop.notes.slice(0,58)+"…":crop.notes}`,MARGIN+8,y+36);}
    y+=43;
  });

  // PAGE 3 – Completed Tasks
  newPage();
  doc.setFillColor(...GREEN); doc.roundedRect(MARGIN,y,4,10,2,2,"F");
  doc.setTextColor(...GREEN); doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.text("Completed Tasks",MARGIN+8,y+8);
  doc.setTextColor(...MUTED); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(`${completedTasks.length} completed`,MARGIN+8,y+15); y+=22;
  const TYPE_LABELS:Record<string,string>={irrigation:"Water",fertilizer:"Fertilize",spray:"Spray",harvest:"Harvest",soil:"Soil",pruning:"Pruning",other:"Task"};
  const P_COLORS:Record<string,[number,number,number]>={high:RED_C,medium:AMBER,low:GREEN};
  if (completedTasks.length===0) { doc.setTextColor(...MUTED); doc.setFontSize(10); doc.text("No completed tasks yet.",MARGIN,y+8); y+=16; }
  else completedTasks.sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).forEach((task) => {
    checkBreak(26);
    doc.setFillColor(...BG_CARD); doc.roundedRect(MARGIN,y,COL_W,22,3,3,"F");
    doc.setFillColor(...GREEN); doc.circle(MARGIN+9,y+11,4,"F");
    doc.setTextColor(...DARK); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("✓",MARGIN+7,y+13);
    doc.setTextColor(...MUTED); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(task.title||"—",MARGIN+17,y+9);
    doc.setFillColor(30,55,36); doc.roundedRect(MARGIN+17,y+11,28,6,2,2,"F");
    doc.setTextColor(...GREEN); doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.text(TYPE_LABELS[task.type]||"Task",MARGIN+31,y+15.5,{align:"center"});
    doc.setTextColor(...MUTED); doc.setFontSize(8); doc.text(fmtDate(task.date),MARGIN+50,y+16);
    if(task.crop||task.field) doc.text([task.crop,task.field].filter(Boolean).join(" · "),MARGIN+90,y+16);
    const pCol=P_COLORS[task.priority]||MUTED as any; doc.setFillColor(...pCol); doc.circle(PAGE_W-MARGIN-8,y+11,2.5,"F");
    doc.setTextColor(...pCol); doc.setFontSize(7); doc.text((task.priority||"").toUpperCase(),PAGE_W-MARGIN-20,y+13);
    if(task.isRecommendation){doc.setFillColor(30,55,36);doc.roundedRect(PAGE_W-MARGIN-18,y+3,12,6,2,2,"F");doc.setTextColor(...GREEN);doc.setFontSize(6);doc.text("AI",PAGE_W-MARGIN-12,y+7.5,{align:"center"});}
    y+=26;
  });

  // PAGE 4 – Pending Tasks
  newPage();
  doc.setFillColor(...AMBER); doc.roundedRect(MARGIN,y,4,10,2,2,"F");
  doc.setTextColor(...AMBER); doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.text("Pending Tasks",MARGIN+8,y+8);
  doc.setTextColor(...MUTED); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(`${pendingTasks.length} remaining`,MARGIN+8,y+15); y+=22;
  if (pendingTasks.length===0) {
    doc.setFillColor(...BG_CARD); doc.roundedRect(MARGIN,y,COL_W,22,3,3,"F");
    doc.setTextColor(...GREEN); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("All tasks completed! Great work.",MARGIN+COL_W/2,y+13,{align:"center"}); y+=28;
  } else pendingTasks.sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime()).forEach((task) => {
    checkBreak(30);
    const overdue=new Date(task.date)<new Date(new Date().setHours(0,0,0,0));
    doc.setFillColor(...BG_CARD); doc.roundedRect(MARGIN,y,COL_W,26,3,3,"F");
    doc.setFillColor(...(overdue?RED_C:AMBER)); doc.roundedRect(MARGIN,y,3,26,2,2,"F"); doc.rect(MARGIN+1,y,2,26,"F");
    doc.setDrawColor(...MUTED); doc.setLineWidth(0.5); doc.circle(MARGIN+9,y+13,4,"S");
    doc.setTextColor(...CREAM); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text(task.title||"—",MARGIN+17,y+10);
    if(overdue){doc.setFillColor(...RED_C);doc.roundedRect(MARGIN+17,y+12,20,6,2,2,"F");doc.setTextColor(255,255,255);doc.setFontSize(6.5);doc.setFont("helvetica","bold");doc.text("OVERDUE",MARGIN+27,y+16.5,{align:"center"});}
    doc.setTextColor(...(overdue?RED_C:MUTED)); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text(fmtDate(task.date)+"  "+(task.time||""), overdue?MARGIN+42:MARGIN+17, y+21);
    if(task.crop||task.field) { doc.setTextColor(...MUTED); doc.setFontSize(8); doc.text([task.crop,task.field].filter(Boolean).join(" · "),MARGIN+90,y+21); }
    const pCol=P_COLORS[task.priority]||MUTED as any; doc.setFillColor(...pCol); doc.circle(PAGE_W-MARGIN-8,y+13,2.5,"F");
    doc.setTextColor(...pCol); doc.setFontSize(7); doc.text((task.priority||"").toUpperCase(),PAGE_W-MARGIN-20,y+15);
    y+=30;
  });

  // Footer on every page
  const total=(doc as any).internal.getNumberOfPages();
  for (let p=1;p<=total;p++) {
    doc.setPage(p);
    doc.setFillColor(...BG_CARD); doc.rect(0,286,PAGE_W,11,"F");
    doc.setFillColor(...GREEN); doc.rect(0,286,PAGE_W,0.5,"F");
    doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text("Farmify AI — Farm Management Report",MARGIN,292);
    doc.text(`Page ${p} of ${total}`,PAGE_W-MARGIN,292,{align:"right"});
    doc.text(new Date().toLocaleDateString("en-IN"),PAGE_W/2,292,{align:"center"});
  }

  doc.save(`Farmify-Report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Overview() {
  const [crops, setCrops]       = useState<Crop[]>([]);
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [loading, setLoading]   = useState(true);
  const [userName, setUserName] = useState("Farmer");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exporting, setExporting]     = useState(false);
  const [exportMsg, setExportMsg]     = useState<{type:"success"|"error"; text:string} | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cropsRes, tasksRes] = await Promise.all([
        api().get("/crops"),
        api().get("/tasks"),
      ]);
      setCrops(cropsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error("Overview fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.name) setUserName(user.name.split(" ")[0]);
  }, [fetchData]);

  // ── PDF download ────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setExporting(true);
    setExportMsg(null);
    try {
      await generateFarmPDF(crops, tasks, userName);
      setExportMsg({ type:"success", text:`Downloaded — ${crops.length} crops & ${tasks.filter(t=>t.done).length} completed tasks` });
      setTimeout(() => setExportMsg(null), 4000);
    } catch (err) {
      setExportMsg({ type:"error", text:"Failed to generate PDF. Try again." });
    } finally {
      setExporting(false);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const avgHealth      = crops.length ? Math.round(crops.reduce((s,c)=>s+c.health,0)/crops.length) : 0;
  const healthyCrops   = crops.filter(c=>c.status==="good").length;
  const warnCrops      = crops.filter(c=>c.status==="warn").length;
  const badCrops       = crops.filter(c=>c.status==="bad").length;
  const pendingTasks   = tasks.filter(t=>!t.done);
  const completedTasks = tasks.filter(t=>t.done);
  const overdueTasks   = tasks.filter(t=>!t.done && isOverdue(t.date));
  const todayTasks     = tasks.filter(t=>isToday(t.date)).sort((a,b)=>a.time.localeCompare(b.time));
  const urgentToday    = todayTasks.filter(t=>!t.done && t.priority==="high").length;
  const completionRate = tasks.length ? Math.round((completedTasks.length/tasks.length)*100) : 0;

  // ── Health trend — fixed pixel heights ──────────────────────────────────
  // Each bar height in px (out of CHART_H=100px)
  const currentMonth = new Date().getMonth();
  const yieldPx = MONTHS.map((_, i) => {
    if (avgHealth === 0) return 0;
    const base = avgHealth;
    const offsets = [0,4,-2,6,1,9,5,12,8,14,11,16];
    const raw = base + offsets[i] - 8;
    // future months slightly dimmed / shorter
    const scaled = i > currentMonth ? raw * 0.7 : raw;
    // Normalise to max CHART_H px: map [20,100] → [12, CHART_H]
    return Math.round(((Math.min(100, Math.max(20, scaled)) - 20) / 80) * (CHART_H - 12) + 12);
  });

  // ── Donut ────────────────────────────────────────────────────────────────
  const total   = crops.length || 1;
  const CIRCUM  = 2 * Math.PI * 44;
  const hArc    = (healthyCrops/total)*CIRCUM;
  const wArc    = (warnCrops/total)*CIRCUM;
  const bArc    = (badCrops/total)*CIRCUM;

  // ── Alerts ───────────────────────────────────────────────────────────────
  const alerts: {icon:string;title:string;sub:string;color:"amber"|"red"|"green"}[] = [];
  overdueTasks.slice(0,2).forEach(t => alerts.push({icon:TYPE_ICONS[t.type]||"📌",title:`Overdue: ${t.title}`,sub:t.crop?`${t.crop}${t.field?" · "+t.field:""}`:t.field||"—",color:"red"}));
  crops.filter(c=>c.status==="bad").slice(0,2).forEach(c => alerts.push({icon:"🦠",title:`Action needed — ${c.name}`,sub:`${c.field} · Health: ${c.health}% · ${c.stage}`,color:"red"}));
  crops.filter(c=>c.status==="warn").slice(0,1).forEach(c => alerts.push({icon:"⚠️",title:`Monitor — ${c.name}`,sub:`${c.field} · Health: ${c.health}% · ${c.daysLeft}d to harvest`,color:"amber"}));
  crops.filter(c=>c.daysLeft<=7&&c.daysLeft>0).slice(0,1).forEach(c => alerts.push({icon:"🌾",title:`Harvest soon — ${c.name}`,sub:`${c.field} · ${c.daysLeft} day${c.daysLeft!==1?"s":""} remaining`,color:"amber"}));
  if (alerts.length===0 && !loading) alerts.push({icon:"✅",title:"All crops and tasks looking good!",sub:"No urgent issues detected on your farm",color:"green"});

  const hour = currentTime.getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  return (
    <div className="view-root">
      <style>{`
        @keyframes ovShimmer { to { background-position: -200% 0; } }
        @keyframes ovFadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ovPulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ovBarGrow { from{height:0} to{height:var(--bar-h)} }

        .ov-fade   { animation: ovFadeUp 0.35s ease both; }
        .ov-fade-1 { animation-delay:0.05s }
        .ov-fade-2 { animation-delay:0.10s }
        .ov-fade-3 { animation-delay:0.15s }
        .ov-fade-4 { animation-delay:0.20s }
        .ov-fade-5 { animation-delay:0.25s }
        .ov-fade-6 { animation-delay:0.30s }

        /* Stat cards */
        .ov-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; }
        .ov-stat {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:14px; padding:18px 16px;
          transition:border-color 0.2s,transform 0.2s;
        }
        .ov-stat:hover { border-color:var(--border2); transform:translateY(-2px); }
        .ov-stat-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
        .ov-stat-icon { font-size:20px; }
        .ov-stat-val { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:700; color:var(--cream); line-height:1; }
        .ov-stat-lbl { font-size:11px; color:var(--muted); margin-top:3px; }
        .ov-stat-delta { font-size:11px; margin-top:6px; font-family:'JetBrains Mono',monospace; }
        .ov-stat-delta.green { color:var(--green); }
        .ov-stat-delta.amber { color:var(--amber); }
        .ov-stat-delta.red   { color:var(--red);   }

        /* Charts */
        .ov-charts { display:grid; grid-template-columns:2fr 1fr; gap:16px; }
        .ov-box { background:var(--bg2); border:1px solid var(--border); border-radius:16px; padding:20px; }
        .ov-box-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
        .ov-box-title  { font-size:13px; font-weight:600; color:var(--cream); }
        .ov-box-tag    { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--muted); background:var(--bg3); border:1px solid var(--border); border-radius:6px; padding:2px 8px; }

        /* Fixed-height bar chart */
        .ov-yield-outer {
          position:relative;
          height:${CHART_H}px;
          display:flex; align-items:flex-end; gap:4px;
        }
        .ov-yield-col  { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; height:100%; justify-content:flex-end; }
        .ov-yield-bar  { width:100%; border-radius:3px 3px 0 0; transition:height 0.6s ease; }
        .ov-yield-month { font-family:'JetBrains Mono',monospace; font-size:9px; color:var(--muted); white-space:nowrap; }
        .ov-yield-month.cur { color:var(--green); font-weight:700; }

        /* Donut */
        .ov-donut-wrap   { position:relative; width:110px; height:110px; margin:0 auto 14px; }
        .ov-donut-svg    { width:110px; height:110px; transform:rotate(-90deg); }
        .ov-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .ov-donut-val    { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:700; color:var(--cream); }
        .ov-donut-lbl    { font-size:10px; color:var(--muted); }
        .ov-legend       { display:flex; flex-direction:column; gap:8px; }
        .ov-legend-row   { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); }
        .ov-legend-dot   { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .ov-legend-lbl   { flex:1; }
        .ov-legend-val   { font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--cream); }
        .ov-legend-bar-wrap { width:50px; height:3px; background:var(--border); border-radius:2px; overflow:hidden; }
        .ov-legend-bar   { height:100%; border-radius:2px; }

        /* Bottom row */
        .ov-bottom { display:grid; grid-template-columns:1fr 1fr; gap:16px; }

        /* Alerts */
        .ov-alert-row { display:flex; align-items:flex-start; gap:12px; padding:12px; border-radius:10px; margin-bottom:8px; transition:transform 0.18s; }
        .ov-alert-row:hover { transform:translateX(3px); }
        .ov-alert-row:last-child { margin-bottom:0; }
        .ov-alert-row.amber { background:var(--alo); border:1px solid rgba(232,162,69,0.2); }
        .ov-alert-row.red   { background:var(--rlo); border:1px solid rgba(224,92,92,0.2); }
        .ov-alert-row.green { background:var(--glo); border:1px solid rgba(76,175,110,0.2); }
        .ov-alert-icon  { font-size:16px; flex-shrink:0; margin-top:1px; }
        .ov-alert-title { font-size:13px; font-weight:600; color:var(--cream); }
        .ov-alert-sub   { font-size:12px; color:var(--muted); margin-top:2px; }

        /* Tasks */
        .ov-task-row { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid var(--border); }
        .ov-task-row:last-child { border-bottom:none; padding-bottom:0; }
        .ov-task-row.done { opacity:0.4; }
        .ov-task-check { font-size:13px; flex-shrink:0; margin-top:1px; }
        .ov-task-check.done { color:var(--green); }
        .ov-task-check.todo { color:var(--muted); }
        .ov-task-title { font-size:13px; color:var(--cream); line-height:1.4; }
        .ov-task-title.done { text-decoration:line-through; color:var(--muted); }
        .ov-task-meta { display:flex; align-items:center; gap:8px; margin-top:3px; flex-wrap:wrap; }
        .ov-task-time { font-size:11px; color:var(--muted); font-family:'JetBrains Mono',monospace; }
        .ov-task-time.overdue { color:var(--red); }
        .ov-priority-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; margin-top:5px; }

        /* Completion ring */
        .ov-ring-wrap { display:flex; align-items:center; gap:16px; padding:12px; background:var(--bg3); border-radius:12px; margin-bottom:16px; }
        .ov-ring-val  { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:700; color:var(--cream); }
        .ov-ring-lbl  { font-size:11px; color:var(--muted); margin-top:2px; }

        /* Export button + message */
        .ov-export-btn {
          display:flex; align-items:center; gap:8px;
          background:var(--bg3); border:1px solid var(--border2);
          color:var(--cream); border-radius:9px; padding:8px 16px;
          font-size:12px; font-weight:600; font-family:'Syne',sans-serif;
          cursor:pointer; transition:all 0.2s; white-space:nowrap;
        }
        .ov-export-btn:hover:not(:disabled) { background:var(--glo); border-color:var(--green); color:var(--green); }
        .ov-export-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .ov-export-msg {
          font-size:11px; border-radius:7px; padding:6px 12px;
          font-family:'JetBrains Mono',monospace;
          animation:ovFadeUp 0.3s ease;
        }
        .ov-export-msg.success { background:var(--glo); color:var(--green); border:1px solid rgba(76,175,110,0.25); }
        .ov-export-msg.error   { background:var(--rlo); color:var(--red);   border:1px solid rgba(224,92,92,0.25); }

        /* Misc */
        .ov-live      { display:flex; align-items:center; gap:5px; }
        .ov-live-dot  { width:6px; height:6px; border-radius:50%; background:var(--green); animation:ovPulse 2s infinite; }
        .ov-live-lbl  { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--green); }
        .ov-refresh   { background:none; border:1px solid var(--border); color:var(--muted); border-radius:8px; padding:5px 10px; font-size:12px; cursor:pointer; font-family:'Syne',sans-serif; transition:all 0.2s; }
        .ov-refresh:hover { border-color:var(--border2); color:var(--cream); }
        .ov-empty     { text-align:center; padding:24px; color:var(--muted); font-size:13px; }

        @media(max-width:1280px) { .ov-stats { grid-template-columns:repeat(3,1fr); } }
        @media(max-width:900px)  { .ov-charts,.ov-bottom { grid-template-columns:1fr; } }
        @media(max-width:640px)  { .ov-stats { grid-template-columns:repeat(2,1fr); } }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header ov-fade">
        <div>
          <h1 className="view-title">{greeting}, {userName} 👋</h1>
          <p className="view-sub">Here's what's happening on your farm today.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div className="ov-live">
            <div className="ov-live-dot" />
            <span className="ov-live-lbl">LIVE</span>
          </div>
          <div className="view-date">
            {currentTime.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
            {" · "}{currentTime.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
          </div>
          <button className="ov-refresh" onClick={fetchData}>↻ Refresh</button>
          {/* ── PDF download button ── */}
          <button className="ov-export-btn" onClick={handleDownloadPDF} disabled={exporting || loading}>
            {exporting ? "⏳ Building…" : "⬇ PDF Report"}
          </button>
        </div>
      </div>

      {/* Export feedback */}
      {exportMsg && (
        <div className={`ov-export-msg ${exportMsg.type}`}>
          {exportMsg.type==="success" ? "✅" : "⚠️"} {exportMsg.text}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="ov-stats">
        {loading ? Array(6).fill(0).map((_,i) => (
          <div key={i} className={`ov-stat ov-fade ov-fade-${(i%6)+1}`}><Skeleton h={70} /></div>
        )) : ([
          { icon:"🌾", label:"Active Crops",      value:crops.length,            delta:crops.length>0?`${healthyCrops} healthy`:"No crops yet",         color:crops.length>0?"green":"amber", spark:null },
          { icon:"🌱", label:"Avg Soil Health",    value:`${avgHealth}%`,          delta:avgHealth>80?"▲ Excellent":avgHealth>60?"▲ Good":avgHealth>0?"▼ Needs attention":"No data", color:avgHealth>80?"green":avgHealth>60?"amber":"red", spark:crops.map(c=>c.health) },
          { icon:"⚠️", label:"Disease Alerts",     value:badCrops+warnCrops,       delta:badCrops>0?`${badCrops} critical`:warnCrops>0?`${warnCrops} to monitor`:"All clear", color:badCrops>0?"red":warnCrops>0?"amber":"green", spark:null },
          { icon:"📅", label:"Pending Tasks",      value:pendingTasks.length,      delta:overdueTasks.length>0?`${overdueTasks.length} overdue`:urgentToday>0?`${urgentToday} urgent today`:"On schedule", color:overdueTasks.length>0?"red":urgentToday>0?"amber":"green", spark:null },
          { icon:"✅", label:"Tasks Done",         value:completedTasks.length,    delta:tasks.length>0?`${completionRate}% completion`:"No tasks yet", color:completionRate>70?"green":completionRate>40?"amber":"red", spark:null },
          { icon:"🌡️", label:"Crops Near Harvest", value:crops.filter(c=>c.daysLeft<=14&&c.daysLeft>0).length, delta:crops.filter(c=>c.daysLeft<=7&&c.daysLeft>0).length>0?`${crops.filter(c=>c.daysLeft<=7&&c.daysLeft>0).length} within 7 days`:"None imminent", color:crops.filter(c=>c.daysLeft<=7).length>0?"amber":"green", spark:null },
        ] as any[]).map((s,i) => (
          <div key={s.label} className={`ov-stat ov-fade ov-fade-${i+1}`}>
            <div className="ov-stat-top">
              <span className="ov-stat-icon">{s.icon}</span>
              {s.spark && s.spark.length>1 && <Sparkline data={s.spark} color="var(--green)" />}
            </div>
            <div className="ov-stat-val">{s.value}</div>
            <div className="ov-stat-lbl">{s.label}</div>
            <div className={`ov-stat-delta ${s.color}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="ov-charts ov-fade ov-fade-3">

        {/* Health Trend — fixed pixel heights */}
        <div className="ov-box">
          <div className="ov-box-header">
            <span className="ov-box-title">Health Trend — {new Date().getFullYear()}</span>
            <span className="ov-box-tag">avg health %</span>
          </div>
          {loading ? <Skeleton h={CHART_H} /> : (
            <>
              <div className="ov-yield-outer">
                {yieldPx.map((barH, i) => {
                  const isCur    = i === currentMonth;
                  const isFuture = i > currentMonth;
                  const barColor = barH === 0 ? "var(--border)"
                    : isCur  ? "linear-gradient(to top, #2d7a47, #6dd98a)"
                    : isFuture ? "linear-gradient(to top, #1a3d22, #2d5c36)"
                    : barH > 70 ? "linear-gradient(to top, #2d7a47, #4caf6e)"
                    : barH > 45 ? "linear-gradient(to top, #b07a20, #e8a245)"
                    : "linear-gradient(to top, #a03030, #e05c5c)";
                  return (
                    <div key={i} className="ov-yield-col">
                      <div
                        className="ov-yield-bar"
                        style={{
                          height: barH,
                          background: barColor,
                          opacity: isFuture ? 0.35 : isCur ? 1 : 0.72,
                          boxShadow: isCur ? "0 0 10px rgba(76,175,110,0.5)" : "none",
                          minHeight: barH > 0 ? 3 : 0,
                        }}
                      />
                      <div className={`ov-yield-month ${isCur?"cur":""}`}>{MONTHS[i]}</div>
                    </div>
                  );
                })}
              </div>
              {crops.length===0 && (
                <div className="ov-empty" style={{marginTop:8,fontSize:12}}>Add crops to see health trends</div>
              )}
            </>
          )}
        </div>

        {/* Crop Health Donut */}
        <div className="ov-box">
          <div className="ov-box-header">
            <span className="ov-box-title">Crop Health</span>
            <span className="ov-box-tag">{crops.length} total</span>
          </div>
          {loading ? (
            <><Skeleton h={110} r={55} /><div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>{[1,2,3].map(i=><Skeleton key={i} h={16}/>)}</div></>
          ) : crops.length===0 ? (
            <div className="ov-empty" style={{padding:"32px 0"}}>
              <div style={{fontSize:36,marginBottom:8,opacity:0.3}}>🌱</div>
              Add crops to see health breakdown
            </div>
          ) : (
            <>
              <div className="ov-donut-wrap">
                <svg viewBox="0 0 120 120" className="ov-donut-svg">
                  <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(76,175,110,0.08)" strokeWidth="12" />
                  {healthyCrops>0 && <circle cx="60" cy="60" r="44" fill="none" stroke="#4caf6e" strokeWidth="12" strokeDasharray={`${hArc} ${CIRCUM-hArc}`} strokeDashoffset="0" strokeLinecap="round" />}
                  {warnCrops>0   && <circle cx="60" cy="60" r="44" fill="none" stroke="#e8a245" strokeWidth="12" strokeDasharray={`${wArc} ${CIRCUM-wArc}`} strokeDashoffset={-hArc} strokeLinecap="round" />}
                  {badCrops>0    && <circle cx="60" cy="60" r="44" fill="none" stroke="#e05c5c" strokeWidth="12" strokeDasharray={`${bArc} ${CIRCUM-bArc}`} strokeDashoffset={-(hArc+wArc)} strokeLinecap="round" />}
                </svg>
                <div className="ov-donut-center">
                  <span className="ov-donut-val">{avgHealth}%</span>
                  <span className="ov-donut-lbl">avg health</span>
                </div>
              </div>
              <div className="ov-legend">
                {[{color:"#4caf6e",label:"Healthy",count:healthyCrops},{color:"#e8a245",label:"Monitor",count:warnCrops},{color:"#e05c5c",label:"Action Needed",count:badCrops}].map(row=>(
                  <div key={row.label} className="ov-legend-row">
                    <span className="ov-legend-dot" style={{background:row.color}} />
                    <span className="ov-legend-lbl">{row.label}</span>
                    <div className="ov-legend-bar-wrap">
                      <div className="ov-legend-bar" style={{width:`${crops.length>0?(row.count/crops.length)*100:0}%`,background:row.color}} />
                    </div>
                    <span className="ov-legend-val">{row.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="ov-bottom ov-fade ov-fade-4">

        {/* Active Alerts */}
        <div className="ov-box">
          <div className="ov-box-header">
            <span className="ov-box-title">Active Alerts</span>
            {!loading && <span className="ov-box-tag">{alerts.filter(a=>a.color==="red").length} critical</span>}
          </div>
          {loading ? <div style={{display:"flex",flexDirection:"column",gap:8}}>{[1,2,3].map(i=><Skeleton key={i} h={52}/>)}</div> : (
            alerts.slice(0,4).map((a,i) => (
              <div key={i} className={`ov-alert-row ${a.color}`}>
                <span className="ov-alert-icon">{a.icon}</span>
                <div>
                  <div className="ov-alert-title">{a.title}</div>
                  <div className="ov-alert-sub">{a.sub}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Today's Tasks */}
        <div className="ov-box">
          <div className="ov-box-header">
            <span className="ov-box-title">Today's Tasks</span>
            {!loading && <span className="ov-box-tag">{todayTasks.filter(t=>t.done).length}/{todayTasks.length} done</span>}
          </div>
          {!loading && tasks.length>0 && (
            <div className="ov-ring-wrap">
              <svg width="44" height="44" style={{flexShrink:0,transform:"rotate(-90deg)"}}>
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--green)" strokeWidth="4"
                  strokeDasharray={`${(completionRate/100)*2*Math.PI*18} ${2*Math.PI*18}`}
                  strokeLinecap="round" style={{transition:"stroke-dasharray 0.6s ease"}} />
              </svg>
              <div>
                <div className="ov-ring-val">{completionRate}%</div>
                <div className="ov-ring-lbl">{completedTasks.length} of {tasks.length} tasks completed</div>
              </div>
            </div>
          )}
          {loading ? <div style={{display:"flex",flexDirection:"column",gap:8}}>{[1,2,3,4].map(i=><Skeleton key={i} h={44}/>)}</div>
          : todayTasks.length===0 ? (
            <div className="ov-empty">
              <div style={{fontSize:28,marginBottom:6,opacity:0.35}}>📅</div>
              No tasks scheduled for today
            </div>
          ) : (
            todayTasks.slice(0,5).map(t => {
              const pColors:Record<string,string>={high:"var(--red)",medium:"var(--amber)",low:"var(--green)"};
              const od=isOverdue(t.date)&&!t.done;
              return (
                <div key={t._id} className={`ov-task-row ${t.done?"done":""}`}>
                  <span className={`ov-task-check ${t.done?"done":"todo"}`}>{t.done?"✓":"○"}</span>
                  <span className="ov-priority-dot" style={{background:pColors[t.priority]}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div className={`ov-task-title ${t.done?"done":""}`}>{TYPE_ICONS[t.type]||"📌"} {t.title}</div>
                    <div className="ov-task-meta">
                      <span className={`ov-task-time ${od?"overdue":""}`}>{od?"⚠ ":""}{dateLabel(t.date)} · {formatTime(t.time)}</span>
                      {t.crop && <span className="ov-task-time">🌾 {t.crop}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {!loading && todayTasks.length>5 && (
            <div style={{fontSize:12,color:"var(--muted)",marginTop:10,textAlign:"center"}}>+{todayTasks.length-5} more tasks today</div>
          )}
        </div>

      </div>
    </div>
  );
}