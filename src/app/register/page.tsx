"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
      const res = await axios.post("http://localhost:5000/api/auth/register", formData);
      console.log(res.data);
      router.push("/login");
    } catch (error: any) {
      console.log(error.response?.data);
      setError(error.response?.data?.message || "Registration failed. Please try again.");
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
          --alo:     rgba(232,162,69,0.12);
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

        .root::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9998; opacity: 0.5;
        }

        /* ── RIGHT PANEL (visual) — flipped vs login */
        .visual-panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          background: var(--bg2);
          border-left: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          order: 2;
        }

        .visual-panel::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(76,175,110,0.1) 0%, transparent 65%);
          pointer-events: none;
        }
        .visual-panel::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -80px;
          width: 300px; height: 300px;
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

        .visual-content {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 32px;
        }

        .eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; letter-spacing: 0.15em;
          color: var(--green); text-transform: uppercase;
          display: flex; align-items: center; gap: 10px;
        }
        .eyebrow::before {
          content: ''; display: block; width: 24px; height: 1px; background: var(--green);
        }

        .visual-heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 3.8vw, 58px);
          font-weight: 700; line-height: 1.0;
          letter-spacing: -0.02em; color: var(--cream);
        }
        .visual-heading em { font-style: italic; color: var(--green); }

        .visual-sub {
          font-size: 14px; line-height: 1.75;
          color: var(--muted); max-width: 360px;
        }

        /* Feature list */
        .feature-list { display: flex; flex-direction: column; gap: 14px; }
        .feature-item {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px; border-radius: 12px;
          background: var(--bg3); border: 1px solid var(--border);
          transition: border-color 0.2s;
        }
        .feature-item:hover { border-color: var(--border2); }
        .feature-emoji { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        .feature-title { font-size: 13px; font-weight: 700; color: var(--cream); margin-bottom: 3px; }
        .feature-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

        .visual-footer {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          background: var(--glo); border: 1px solid var(--border2);
          border-radius: 12px; position: relative; z-index: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--green); letter-spacing: 0.06em;
        }
        .vf-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); animation: blink 2s ease infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* ── LEFT PANEL (Form) */
        .form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          order: 1;
        }

        .form-box {
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column; gap: 28px;
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
          border-bottom: 1px solid rgba(76,175,110,0.3); transition: border-color 0.2s;
        }
        .form-subtitle a:hover { border-color: var(--green); }

        .form-fields { display: flex; flex-direction: column; gap: 14px; }

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

        .password-hint {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted); margin-top: 4px;
        }

        .terms-row {
          font-size: 12px; color: var(--muted); line-height: 1.6;
          text-align: center;
        }
        .terms-row a {
          color: var(--green); text-decoration: none;
          border-bottom: 1px solid rgba(76,175,110,0.3);
        }
        .terms-row a:hover { border-color: var(--green); }

        .submit-btn {
          width: 100%; padding: 14px;
          background: var(--green); color: #060e07;
          border: none; border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
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

        .login-cta {
          text-align: center; font-size: 13px; color: var(--muted);
        }
        .login-cta a {
          color: var(--green); text-decoration: none; font-weight: 600;
          border-bottom: 1px solid rgba(76,175,110,0.3); transition: border-color 0.2s;
        }
        .login-cta a:hover { border-color: var(--green); }

        @media (max-width: 900px) {
          .root { grid-template-columns: 1fr; }
          .visual-panel { display: none; }
          .form-panel { padding: 32px 24px; order: 1; }
        }
      `}</style>

      {/* FORM PANEL (left) */}
      <div className="form-panel">
        <div className="form-box">
          <div className="form-header">
            <h1 className="form-title">Create your<br />farm account</h1>
            <p className="form-subtitle">
              Already have an account?{" "}
              <Link href="/login">Sign in instead →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="form-fields">
            {error && (
              <div className="error-box">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="field-wrap">
              <label className="field-label">Full name</label>
              <div className="field-input-wrap">
                <span className="field-icon">👤</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Ramesh Kumar"
                  onChange={handleChange}
                  className="field-input"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="field-label">Password</label>
              <div className="field-input-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="field-input"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
              <div className="password-hint">Minimum 6 characters</div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner" /> Creating account…</>
              ) : (
                <>Create Account →</>
              )}
            </button>
          </form>

          <p className="terms-row">
            By creating an account you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>

          <div className="divider">or</div>

          <div className="login-cta">
            Already farming with us?{" "}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>

      {/* VISUAL PANEL (right) */}
      <div className="visual-panel">
        <Link href="/" className="logo">🌾 Farmify<em>AI</em></Link>

        <div className="visual-content">
          <div className="eyebrow">Join 12,400+ farmers</div>
          <h2 className="visual-heading">
            Grow more.<br /><em>Worry less.</em>
          </h2>
          <p className="visual-sub">
            Get AI-powered crop recommendations, disease detection, and smart
            weather alerts — built specifically for Indian agriculture.
          </p>

          <div className="feature-list">
            {[
              { emoji: "🦠", title: "CNN Disease Detection", desc: "Upload a leaf photo and get instant diagnosis with treatment plans." },
              { emoji: "🌦️", title: "Smart Weather Alerts", desc: "Real-time rain, irrigation, and spray window recommendations." },
              { emoji: "📈", title: "Yield Forecasting", desc: "ML models predict your harvest and suggest optimisations." },
            ].map(f => (
              <div key={f.title} className="feature-item">
                <span className="feature-emoji">{f.emoji}</span>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <div className="feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="visual-footer">
          <span className="vf-dot" />
          Free forever · No credit card required · Cancel anytime
        </div>
      </div>
    </div>
  );
}