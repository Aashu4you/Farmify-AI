"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg:      #090f0a;
          --bg2:     #0e1a10;
          --bg3:     #111f13;
          --green:   #4caf6e;
          --gdim:    #2d7a47;
          --glo:     rgba(76,175,110,0.12);
          --gmd:     rgba(76,175,110,0.22);
          --amber:   #e8a245;
          --red:     #e05c5c;
          --rlo:     rgba(224,92,92,0.12);
          --cream:   #dde8c8;
          --muted:   #7a9068;
          --border:  rgba(76,175,110,0.15);
          --border2: rgba(76,175,110,0.28);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        .root {
          min-height: 100vh;
          background: var(--bg);
          color: var(--cream);
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
        }

        /* Grain overlay */
        .root::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9998; opacity: 0.5;
        }

        /* ── LEFT PANEL */
        .left-panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          bottom: -120px; left: -120px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(76,175,110,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(76,175,110,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .logo {
          display: flex; align-items: center; gap: 10px;
          font-weight: 800; font-size: 20px;
          color: var(--cream); text-decoration: none; letter-spacing: -0.5px;
          position: relative; z-index: 1;
        }
        .logo em { color: var(--green); font-style: normal; }

        .left-content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 32px;
        }

        .left-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.15em;
          color: var(--green); text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
        }
        .left-eyebrow::before {
          content: ''; display: block; width: 24px; height: 1px; background: var(--green);
        }

        .left-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 4vw, 60px);
          font-weight: 700; line-height: 1.0;
          letter-spacing: -0.02em; color: var(--cream);
        }
        .left-heading em { font-style: italic; color: var(--green); }

        .left-sub {
          font-size: 14px; line-height: 1.75;
          color: var(--muted); max-width: 360px;
        }

        .left-stats {
          display: flex; gap: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .left-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 700; color: var(--cream);
        }
        .left-stat-lbl {
          font-size: 11px; color: var(--muted);
          letter-spacing: 0.06em; margin-top: 2px;
        }

        .left-testimonial {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 16px; padding: 24px;
          position: relative; z-index: 1;
        }
        .testi-mark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px; color: var(--green); opacity: 0.4;
          line-height: 0.8; display: block; margin-bottom: 8px;
        }
        .testi-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 16px;
          color: var(--cream); line-height: 1.55; margin-bottom: 16px;
        }
        .testi-author { display: flex; align-items: center; gap: 10px; }
        .testi-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--glo); border: 1px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--green);
        }
        .testi-name { font-size: 13px; font-weight: 700; color: var(--cream); }
        .testi-role { font-size: 11px; color: var(--muted); }

        /* ── RIGHT PANEL (Form) */
        .right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        .form-box {
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column; gap: 32px;
          animation: fadeUp 0.6s ease 0.1s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-header { display: flex; flex-direction: column; gap: 8px; }

        .form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px; font-weight: 700;
          color: var(--cream); line-height: 1.1;
        }

        .form-subtitle { font-size: 14px; color: var(--muted); line-height: 1.6; }
        .form-subtitle a {
          color: var(--green); text-decoration: none;
          border-bottom: 1px solid rgba(76,175,110,0.3);
          transition: border-color 0.2s;
        }
        .form-subtitle a:hover { border-color: var(--green); }

        .form-fields { display: flex; flex-direction: column; gap: 16px; }

        .field-wrap { display: flex; flex-direction: column; gap: 6px; }

        .field-label {
          font-size: 11px; font-weight: 600;
          color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase;
        }

        .field-input-wrap { position: relative; }

        .field-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          font-size: 15px; pointer-events: none; opacity: 0.6;
        }

        .field-input {
          width: 100%;
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 10px; padding: 13px 14px 13px 42px;
          font-size: 14px; font-family: 'Syne', sans-serif;
          color: var(--cream); outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .field-input::placeholder { color: var(--muted); }
        .field-input:focus {
          border-color: var(--green);
          background: var(--bg3);
        }

        .error-box {
          display: flex; align-items: center; gap: 10px;
          background: var(--rlo); border: 1px solid rgba(224,92,92,0.25);
          border-radius: 10px; padding: 12px 16px;
          font-size: 13px; color: var(--red);
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)}
        }

        .form-footer { display: flex; justify-content: flex-end; }
        .forgot-link {
          font-size: 12px; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
          font-family: 'JetBrains Mono', monospace;
        }
        .forgot-link:hover { color: var(--green); }

        .submit-btn {
          width: 100%; padding: 14px;
          background: var(--green); color: #060e07;
          border: none; border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
        }
        .submit-btn:hover:not(:disabled) {
          background: #6dd98a;
          box-shadow: 0 8px 28px rgba(76,175,110,0.3);
          transform: translateY(-1px);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(6,14,7,0.3);
          border-top-color: #060e07;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 12px;
          font-size: 11px; color: var(--muted);
          font-family: 'JetBrains Mono', monospace;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .register-cta {
          text-align: center; font-size: 13px; color: var(--muted);
        }
        .register-cta a {
          color: var(--green); text-decoration: none; font-weight: 600;
          border-bottom: 1px solid rgba(76,175,110,0.3); transition: border-color 0.2s;
        }
        .register-cta a:hover { border-color: var(--green); }

        .badge-row {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          background: var(--glo); border: 1px solid var(--border2);
          border-radius: 10px;
        }
        .badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); animation: blink 2s ease infinite;
          flex-shrink: 0;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .badge-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--green); letter-spacing: 0.06em;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .root { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .right-panel { padding: 32px 24px; }
        }
      `}</style>

      {/* LEFT PANEL */}
      <div className="left-panel">
        <Link href="/" className="logo">🌾 Farmify<em>AI</em></Link>

        <div className="left-content">
          <div className="left-eyebrow">Welcome back</div>
          <h2 className="left-heading">
            Your farm,<br /><em>smarter every day.</em>
          </h2>
          <p className="left-sub">
            Log in to monitor your crops, check live weather, detect disease
            early, and manage your entire farm — all powered by AI.
          </p>
          <div className="left-stats">
            {[["12,400+","Farmers"],["94%","Disease accuracy"],["3.2M","Acres monitored"]].map(([v,l]) => (
              <div key={l}>
                <div className="left-stat-val">{v}</div>
                <div className="left-stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="left-testimonial">
          <span className="testi-mark">"</span>
          <p className="testi-quote">
            Disease detection saved my entire crop last Rabi season. Spotted blight 2 weeks before I would have noticed manually.
          </p>
          <div className="testi-author">
            <div className="testi-avatar">RP</div>
            <div>
              <div className="testi-name">Rajesh Patel</div>
              <div className="testi-role">Wheat Farmer, Punjab</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="form-box">
          <div className="badge-row">
            <span className="badge-dot" />
            <span className="badge-text">Secure · Encrypted · Private</span>
          </div>

          <div className="form-header">
            <h1 className="form-title">Sign in to<br />your farm</h1>
            <p className="form-subtitle">
              Don't have an account?{" "}
              <Link href="/register">Create one free →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-fields">
            {error && (
              <div className="error-box">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="field-wrap">
              <label className="field-label">Email address</label>
              <div className="field-input-wrap">
                <span className="field-icon">✉</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@farm.com"
                  onChange={handleChange}
                  className="field-input"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="field-label">Password</label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
              <div className="field-input-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="field-input"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" /> Signing in…</>
              ) : (
                <>Sign In →</>
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <div className="register-cta">
            New to Farmify?{" "}
            <Link href="/register">Create a free account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}