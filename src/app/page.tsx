"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "🌿", title: "AI Crop Recommendation", desc: "ML models analyze soil, weather & season data to suggest the highest-yield crop for your field.", tag: "Machine Learning" },
  { icon: "🦠", title: "Disease Detection", desc: "Upload a leaf photo. CNN instantly identifies disease and recommends treatment before it spreads.", tag: "Computer Vision" },
  { icon: "🌦️", title: "Real-Time Weather", desc: "Rain alerts, temperature spikes, and smart irrigation scheduling via OpenWeather API.", tag: "Live Data" },
  { icon: "📅", title: "Smart Scheduler", desc: "Calendar planner with fertilizer reminders, irrigation windows & push notifications.", tag: "Automation" },
  { icon: "🏪", title: "Agri Marketplace", desc: "Sell crops, buy inputs, and connect with verified buyers — all in one place.", tag: "Commerce" },
  { icon: "📡", title: "IoT Dashboard", desc: "Live soil moisture, temperature & water level from ESP32/Arduino sensors or simulated data.", tag: "IoT" },
];

const TESTIMONIALS = [
  { name: "Rajesh Patel", role: "Wheat Farmer, Punjab", quote: "Disease detection saved my entire crop last Rabi season. Spotted blight 2 weeks before I would have noticed manually.", avatar: "RP" },
  { name: "Sunita Devi", role: "Horticulture, Maharashtra", quote: "Smart weather alerts changed how I irrigate. Water usage down 30%, yields up significantly.", avatar: "SD" },
  { name: "Kiran Agrotech", role: "Agribusiness, Karnataka", quote: "Managing 200+ farms on Farmify. The analytics and role-based access are exactly what we needed.", avatar: "KA" },
];

const PRICING = [
  { tier: "Starter", price: "Free", period: "", features: ["3 crop profiles", "Weather alerts", "Basic disease scan", "Community support"], cta: "Get Started", highlight: false },
  { tier: "Pro", price: "₹499", period: "/mo", features: ["Unlimited crops", "AI recommendations", "Full disease detection", "Scheduler + alerts", "Marketplace", "Priority support"], cta: "Start Free Trial", highlight: true },
  { tier: "Enterprise", price: "Custom", period: "", features: ["Multi-farm management", "IoT integration", "Custom ML models", "Admin dashboard", "API access", "Dedicated support"], cta: "Contact Us", highlight: false },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg:        #090f0a;
          --bg2:       #0e1a10;
          --bg3:       #111f13;
          --green:     #4caf6e;
          --green-dim: #2d7a47;
          --green-lo:  rgba(76,175,110,0.12);
          --green-md:  rgba(76,175,110,0.22);
          --amber:     #e8a245;
          --amber-lo:  rgba(232,162,69,0.12);
          --cream:     #dde8c8;
          --muted:     #7a9068;
          --border:    rgba(76,175,110,0.16);
          --border2:   rgba(76,175,110,0.28);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .root {
          background: var(--bg);
          color: var(--cream);
          font-family: 'Syne', sans-serif;
          font-weight: 400;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* grain overlay */
        .root::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9998; opacity: 0.5;
        }

        /* ── NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: background 0.3s, border-color 0.3s;
          padding: 0 48px;
        }
        .nav.scrolled {
          background: rgba(9,15,10,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px;
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          font-weight: 800; font-size: 18px;
          color: var(--cream); text-decoration: none; letter-spacing: -0.5px;
        }
        .nav-logo em { color: var(--green); font-style: normal; }
        .nav-links { display: flex; gap: 36px; }
        .nav-links a {
          font-size: 13px; font-weight: 500; letter-spacing: 0.03em;
          color: var(--muted); text-decoration: none; transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--cream); }
        .nav-actions { display: flex; gap: 10px; align-items: center; }
        .btn-ghost {
          font-size: 13px; font-weight: 500; padding: 8px 18px;
          border: 1px solid var(--border2); border-radius: 8px;
          color: var(--green); text-decoration: none; transition: all 0.2s;
        }
        .btn-ghost:hover { background: var(--green-lo); }
        .btn-solid {
          font-size: 13px; font-weight: 600; padding: 8px 20px;
          border-radius: 8px; background: var(--green); color: #060e07;
          text-decoration: none; transition: all 0.2s;
        }
        .btn-solid:hover { background: #6dd98a; box-shadow: 0 0 20px rgba(76,175,110,0.3); }

        /* ── HERO */
        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          max-width: 1280px; margin: 0 auto;
          padding: 120px 48px 80px;
          gap: 72px;
        }
        .hero-left { display: flex; flex-direction: column; gap: 28px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          border: 1px solid var(--border2); background: var(--green-lo);
          width: fit-content;
        }
        .hero-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); animation: blink 2s ease infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .hero-badge span {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.12em;
          color: var(--green); text-transform: uppercase;
        }
        .hero-h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(52px, 5.5vw, 84px);
          font-weight: 700; line-height: 0.95;
          letter-spacing: -0.02em; color: var(--cream);
        }
        .hero-h1 em { font-style: italic; color: var(--green); }
        .hero-sub {
          font-size: 15px; line-height: 1.75;
          color: var(--muted); max-width: 420px;
        }
        .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 10px;
          background: var(--green); color: #060e07;
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700;
          text-decoration: none; transition: all 0.25s;
        }
        .btn-primary:hover { background: #6dd98a; transform: translateY(-2px); box-shadow: 0 12px 32px rgba(76,175,110,0.3); }
        .btn-secondary {
          display: inline-flex; align-items: center;
          padding: 14px 28px; border-radius: 10px;
          border: 1px solid var(--border2); color: var(--cream);
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 600;
          text-decoration: none; transition: all 0.25s;
        }
        .btn-secondary:hover { border-color: var(--green); background: var(--green-lo); }
        .hero-stats {
          display: flex; gap: 32px; padding-top: 8px;
          border-top: 1px solid var(--border);
        }
        .hero-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700; color: var(--cream);
        }
        .hero-stat-lbl { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; margin-top: 2px; }

        /* ── DASHBOARD MOCKUP */
        .dash-wrap { position: relative; }
        .glow-orb {
          position: absolute; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(76,175,110,0.14) 0%, transparent 70%);
          right: -100px; top: -80px; pointer-events: none;
        }
        .dash-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .dash-topbar {
          display: flex; align-items: center; gap: 6px;
          padding: 14px 20px; border-bottom: 1px solid var(--border);
          background: var(--bg3);
        }
        .wdot { width: 10px; height: 10px; border-radius: 50%; }
        .dash-url { margin-left: 10px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }
        .dash-body { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
        .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
        .grid2 { display: grid; grid-template-columns: 3fr 2fr; gap: 8px; }
        .mini {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 12px;
        }
        .mini-icon { font-size: 16px; margin-bottom: 5px; }
        .mini-val { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: var(--cream); }
        .mini-lbl { font-size: 10px; color: var(--muted); margin-top: 1px; }
        .mini-delta { font-size: 10px; color: var(--green); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
        .chart-lbl { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.08em; }
        .bars { display: flex; align-items: flex-end; gap: 3px; height: 48px; }
        .bar { flex: 1; border-radius: 2px 2px 0 0; background: linear-gradient(to top, var(--green-dim), var(--green)); }
        .alert-strip {
          display: flex; align-items: center; gap: 10px;
          background: var(--amber-lo); border: 1px solid rgba(232,162,69,0.25);
          border-radius: 10px; padding: 10px 14px;
        }
        .alert-strip .alert-body .t { font-size: 11px; font-weight: 600; color: var(--amber); }
        .alert-strip .alert-body .s { font-size: 10px; color: var(--muted); margin-top: 1px; }

        /* ── SECTION SHARED */
        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.15em;
          color: var(--green); text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }
        .eyebrow::before { content: ''; display: block; width: 24px; height: 1px; background: var(--green); }
        .section-h {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(34px, 3.8vw, 54px);
          font-weight: 700; line-height: 1.05;
          letter-spacing: -0.02em; color: var(--cream);
        }
        .section-h em { font-style: italic; color: var(--green); }

        /* ── FEATURES */
        .feat-section { padding: 120px 48px; max-width: 1280px; margin: 0 auto; }
        .feat-top {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 48px; align-items: end; margin-bottom: 56px;
        }
        .feat-desc { font-size: 15px; color: var(--muted); line-height: 1.75; max-width: 380px; }
        /* Grid with hairline dividers */
        .feat-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
          gap: 1px;
        }
        .feat-cell {
          background: var(--bg); padding: 36px 30px;
          display: flex; flex-direction: column; gap: 12px;
          position: relative; transition: background 0.25s; cursor: default;
        }
        .feat-cell::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(76,175,110,0.1) 0%, transparent 70%);
          opacity: 0; transition: opacity 0.3s;
        }
        .feat-cell:hover { background: var(--bg2); }
        .feat-cell:hover::after { opacity: 1; }
        .feat-icon { font-size: 26px; }
        .feat-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px; letter-spacing: 0.12em;
          color: var(--green); text-transform: uppercase;
        }
        .feat-title { font-size: 16px; font-weight: 700; color: var(--cream); }
        .feat-desc-text { font-size: 13px; color: var(--muted); line-height: 1.65; }

        /* ── HOW IT WORKS */
        .how-section { padding: 120px 48px; background: var(--bg2); }
        .how-inner { max-width: 1280px; margin: 0 auto; }
        .how-steps {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 48px; margin-top: 56px; position: relative;
        }
        .how-steps::before {
          content: ''; position: absolute;
          top: 27px; left: calc(16.67% + 12px); right: calc(16.67% + 12px);
          height: 1px;
          background: linear-gradient(to right, var(--green), rgba(76,175,110,0.3), var(--green));
        }
        .how-step {}
        .how-num {
          width: 54px; height: 54px; border-radius: 50%;
          border: 1px solid var(--green); background: var(--bg2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: var(--green);
          margin-bottom: 24px; position: relative; z-index: 1;
        }
        .how-title { font-size: 17px; font-weight: 700; color: var(--cream); margin-bottom: 10px; }
        .how-desc { font-size: 14px; color: var(--muted); line-height: 1.7; }

        /* ── TESTIMONIALS */
        .testi-section { padding: 120px 48px; max-width: 1280px; margin: 0 auto; }
        /* Asymmetric grid: big card left, 2 stacked right */
        .testi-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 16px; margin-top: 56px;
        }
        .testi-right { display: flex; flex-direction: column; gap: 16px; }
        .testi-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 20px; padding: 36px;
          display: flex; flex-direction: column; justify-content: space-between;
          gap: 24px; transition: border-color 0.25s; height: 100%;
        }
        .testi-card:hover { border-color: var(--border2); }
        .testi-mark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 56px; color: var(--green); opacity: 0.3;
          line-height: 0.8; display: block; margin-bottom: 4px;
        }
        .testi-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; color: var(--cream); line-height: 1.55;
        }
        .testi-quote.big { font-size: 22px; }
        .testi-quote.sm { font-size: 18px; }
        .testi-author { display: flex; align-items: center; gap: 12px; }
        .testi-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--green-lo); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--green);
          flex-shrink: 0;
        }
        .testi-name { font-size: 13px; font-weight: 700; color: var(--cream); }
        .testi-role { font-size: 12px; color: var(--muted); }

        /* ── PRICING */
        .price-section { padding: 120px 48px; background: var(--bg2); }
        .price-inner { max-width: 1280px; margin: 0 auto; }
        .price-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 16px; margin-top: 56px;
        }
        .price-card {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 20px; padding: 40px 36px;
          display: flex; flex-direction: column; gap: 24px;
          transition: all 0.25s; position: relative; overflow: hidden;
        }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.hot { border-color: var(--green); background: var(--bg2); }
        .price-card.hot::before {
          content: 'Most Popular';
          position: absolute; top: 0; right: 0;
          background: var(--green); color: #060e07;
          font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 6px 16px; border-bottom-left-radius: 12px;
        }
        .price-tier { font-size: 12px; font-weight: 600; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .price-amount {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px; font-weight: 700; color: var(--cream);
          line-height: 1; display: flex; align-items: baseline; gap: 4px;
        }
        .price-period { font-family: 'Syne', sans-serif; font-size: 16px; color: var(--muted); }
        .price-divider { height: 1px; background: var(--border); }
        .price-feats { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .price-feat { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
        .check { color: var(--green); flex-shrink: 0; }
        .price-cta {
          display: block; text-align: center; text-decoration: none;
          padding: 14px; border-radius: 10px;
          font-size: 14px; font-weight: 700; transition: all 0.2s;
        }
        .cta-fill { background: var(--green); color: #060e07; }
        .cta-fill:hover { background: #6dd98a; }
        .cta-line { border: 1px solid var(--border2); color: var(--cream); }
        .cta-line:hover { border-color: var(--green); background: var(--green-lo); }

        /* ── CTA BAND */
        .band-wrap { padding: 80px 48px; max-width: 1280px; margin: 0 auto; }
        .band {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 24px; overflow: hidden;
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: 56px; padding: 64px 72px;
          position: relative;
        }
        .band::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: linear-gradient(to bottom, var(--green), transparent);
        }
        .band-glow {
          position: absolute; right: -80px; top: -80px;
          width: 360px; height: 360px; border-radius: 50%;
          background: radial-gradient(circle, rgba(76,175,110,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .band-h {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(30px, 3vw, 46px);
          font-weight: 700; color: var(--cream); line-height: 1.1; margin-bottom: 10px;
        }
        .band-h em { font-style: italic; color: var(--green); }
        .band-sub { font-size: 15px; color: var(--muted); }
        .band-btns { display: flex; flex-direction: column; gap: 10px; min-width: 210px; }

        /* ── FOOTER */
        .footer { border-top: 1px solid var(--border); padding: 64px 48px 40px; }
        .footer-inner { max-width: 1280px; margin: 0 auto; }
        .footer-top {
          display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 48px; margin-bottom: 48px;
        }
        .footer-logo { font-weight: 800; font-size: 17px; color: var(--cream); text-decoration: none; display: block; margin-bottom: 14px; }
        .footer-logo em { color: var(--green); font-style: normal; }
        .footer-tagline { font-size: 13px; color: var(--muted); line-height: 1.65; max-width: 230px; }
        .footer-col h4 { font-size: 11px; font-weight: 700; color: var(--cream); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 18px; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col ul a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-col ul a:hover { color: var(--cream); }
        .footer-bottom {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 28px; border-top: 1px solid var(--border);
        }
        .footer-copy { font-size: 12px; color: var(--muted); }
        .footer-ver { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--green); }

        /* ── ANIMATIONS */
        @keyframes fadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .a1 { animation: fadeUp 0.7s ease 0.1s both; }
        .a2 { animation: fadeUp 0.7s ease 0.25s both; }
        .a3 { animation: fadeUp 0.7s ease 0.4s both; }
        .a4 { animation: fadeUp 0.7s ease 0.55s both; }
        .a5 { animation: fadeUp 0.7s ease 0.7s both; }
        .a6 { animation: fadeUp 0.7s ease 0.85s both; }

        /* ── RESPONSIVE */
        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; padding: 100px 24px 64px; gap: 48px; }
          .feat-top { grid-template-columns: 1fr; }
          .feat-grid { grid-template-columns: 1fr 1fr; }
          .how-steps { grid-template-columns: 1fr; }
          .how-steps::before { display: none; }
          .testi-grid { grid-template-columns: 1fr; }
          .price-grid { grid-template-columns: 1fr; }
          .band { grid-template-columns: 1fr; padding: 48px; }
          .footer-top { grid-template-columns: 1fr 1fr; }
          .nav, .feat-section, .testi-section, .band-wrap, .footer { padding-left: 24px; padding-right: 24px; }
          .how-section, .price-section { padding-left: 24px; padding-right: 24px; }
        }
        @media (max-width: 640px) {
          .feat-grid { grid-template-columns: 1fr; }
          .grid4 { grid-template-columns: 1fr 1fr; }
          .hero-h1 { font-size: 44px; }
          .hero-stats { flex-wrap: wrap; gap: 20px; }
          .nav-links, .nav-actions { display: none; }
          .footer-top { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">🌾 Farmify<em>AI</em></Link>
          <div className="nav-links">
            {["Features","How It Works","Pricing","About"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`}>{l}</a>
            ))}
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">Log In</Link>
            <Link href="/register" className="btn-solid">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge a1">
            <span className="hero-badge-dot" />
            <span>Now with AI Disease Detection</span>
          </div>
          <h1 className="hero-h1 a2">
            The smart way<br />to <em>farm India.</em>
          </h1>
          <p className="hero-sub a3">
            Farmify AI brings machine learning, real-time weather, CNN disease
            detection, and IoT monitoring into one platform — built for Indian
            farmers and agribusinesses.
          </p>
          <div className="hero-ctas a4">
            <Link href="/register" className="btn-primary">Start for Free →</Link>
            <a href="#features" className="btn-secondary">See Features</a>
          </div>
          <div className="hero-stats a5">
            {[["12,400+","Farmers"],["94%","Yield boost"],["3.2M","Acres monitored"]].map(([v,l]) => (
              <div key={l}>
                <div className="hero-stat-val">{v}</div>
                <div className="hero-stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="dash-wrap a6">
          <div className="glow-orb" />
          <div className="dash-card">
            <div className="dash-topbar">
              <span className="wdot" style={{background:"#ff5f57"}} />
              <span className="wdot" style={{background:"#febc2e"}} />
              <span className="wdot" style={{background:"#28c840"}} />
              <span className="dash-url">farmify.ai / dashboard</span>
            </div>
            <div className="dash-body">
              <div className="grid4">
                {[
                  {icon:"🌾",val:"8",lbl:"Active Crops",d:"+2 this month"},
                  {icon:"🌱",val:"87%",lbl:"Soil Health",d:"▲ Optimal"},
                  {icon:"🛡️",val:"0",lbl:"Alerts",d:"All clear"},
                  {icon:"📈",val:"₹2.4L",lbl:"Revenue",d:"+18% YoY"},
                ].map(c => (
                  <div key={c.lbl} className="mini">
                    <div className="mini-icon">{c.icon}</div>
                    <div className="mini-val">{c.val}</div>
                    <div className="mini-lbl">{c.lbl}</div>
                    <div className="mini-delta">{c.d}</div>
                  </div>
                ))}
              </div>
              <div className="grid2">
                <div className="mini">
                  <div className="chart-lbl">YIELD FORECAST — 30 DAYS</div>
                  <div className="bars">
                    {[40,55,48,70,62,80,74,90,84,96].map((h,i) => (
                      <div key={i} className="bar" style={{height:`${h}%`,opacity:0.4+i*0.06}} />
                    ))}
                  </div>
                </div>
                <div className="mini" style={{display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div className="chart-lbl">WEATHER TODAY</div>
                  <div style={{fontSize:28}}>⛅</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:"var(--cream)"}}>28°C</div>
                  <div className="mini-lbl">Partly cloudy</div>
                  <div className="mini-delta">Rain: Wednesday</div>
                </div>
              </div>
              <div className="alert-strip">
                <span style={{fontSize:18}}>⚠️</span>
                <div className="alert-body">
                  <div className="t">Soil moisture below 40% — Field 3</div>
                  <div className="s">Irrigation recommended before 6 PM today</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="feat-section">
        <div className="feat-top">
          <div>
            <div className="eyebrow">Platform Capabilities</div>
            <h2 className="section-h">Everything a modern<br /><em>farm needs</em></h2>
          </div>
          <p className="feat-desc">
            From AI-powered crop recommendations to real-time IoT sensor data —
            Farmify AI is the operating system for the modern Indian farm.
          </p>
        </div>
        <div className="feat-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feat-cell">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-tag">{f.tag}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc-text">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="how-section">
        <div className="how-inner">
          <div className="eyebrow">Simple Onboarding</div>
          <h2 className="section-h">Up and running <em>in minutes</em></h2>
          <div className="how-steps">
            {[
              {n:"01",t:"Create Your Farm Profile",d:"Add your fields, crop types, soil data, and location. Takes under 3 minutes."},
              {n:"02",t:"Get AI-Driven Insights",d:"Our models analyze your data and surface actionable recommendations every single day."},
              {n:"03",t:"Monitor & Act",d:"Track health, schedule tasks, detect disease early, and sell what you grow."},
            ].map(s => (
              <div key={s.n} className="how-step">
                <div className="how-num">{s.n}</div>
                <div className="how-title">{s.t}</div>
                <div className="how-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testi-section">
        <div className="eyebrow">Farmer Stories</div>
        <h2 className="section-h">Trusted by farmers <em>across India</em></h2>
        <div className="testi-grid">
          {/* Big card */}
          <div className="testi-card">
            <div>
              <span className="testi-mark">"</span>
              <p className="testi-quote big">{TESTIMONIALS[0].quote}</p>
            </div>
            <div className="testi-author">
              <div className="testi-avatar">{TESTIMONIALS[0].avatar}</div>
              <div>
                <div className="testi-name">{TESTIMONIALS[0].name}</div>
                <div className="testi-role">{TESTIMONIALS[0].role}</div>
              </div>
            </div>
          </div>
          {/* Two stacked */}
          <div className="testi-right">
            {TESTIMONIALS.slice(1).map(t => (
              <div key={t.name} className="testi-card">
                <div>
                  <span className="testi-mark" style={{fontSize:40}}>"</span>
                  <p className="testi-quote sm">{t.quote}</p>
                </div>
                <div className="testi-author">
                  <div className="testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="price-section">
        <div className="price-inner">
          <div className="eyebrow">Pricing</div>
          <h2 className="section-h">Simple plans. <em>Real results.</em></h2>
          <div className="price-grid">
            {PRICING.map(p => (
              <div key={p.tier} className={`price-card ${p.highlight ? "hot" : ""}`}>
                <div>
                  <div className="price-tier">{p.tier}</div>
                  <div className="price-amount">{p.price}<span className="price-period">{p.period}</span></div>
                </div>
                <div className="price-divider" />
                <div className="price-feats">
                  {p.features.map(f => (
                    <div key={f} className="price-feat"><span className="check">✓</span>{f}</div>
                  ))}
                </div>
                <Link href="/register" className={`price-cta ${p.highlight ? "cta-fill" : "cta-line"}`}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <div className="band-wrap">
        <div className="band">
          <div className="band-glow" />
          <div>
            <h2 className="band-h">Ready to farm <em>smarter?</em></h2>
            <p className="band-sub">Join thousands of farmers protecting crops and maximising yields with Farmify AI.</p>
          </div>
          <div className="band-btns">
            <Link href="/register" className="btn-primary" style={{justifyContent:"center"}}>Get Started — Free</Link>
            <Link href="/login" className="btn-secondary" style={{justifyContent:"center"}}>Sign In</Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <Link href="/" className="footer-logo">🌾 Farmify<em>AI</em></Link>
              <p className="footer-tagline">Smart agriculture management for farmers, agribusinesses, and crop advisors across India.</p>
            </div>
            {[
              {h:"Platform",links:["Dashboard","Crop Recommendations","Disease Detection","Marketplace","IoT Dashboard"]},
              {h:"Company",links:["About","Blog","Careers","Contact"]},
              {h:"Legal",links:["Privacy Policy","Terms of Service","Cookie Policy"]},
            ].map(col => (
              <div key={col.h} className="footer-col">
                <h4>{col.h}</h4>
                <ul>{col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2025 Farmify AI. Built with ❤️ for Indian agriculture.</span>
            <span className="footer-ver">v1.0.0 — FARMIFY-AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}