"use client";

import { useState, useRef } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Treatment {
  type: string;
  icon: string;
  detail: string;
}

interface DiseaseResult {
  detected: boolean;
  class_name: string;
  confidence: number;
  disease: {
    name: string;
    scientific: string;
    crop: string;
    severity: string;
    severity_color: "green" | "amber" | "red";
    symptoms: string[];
    treatments: Treatment[];
    prevention: string;
  };
  top5: { class: string; confidence: number }[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DiseaseDetection() {
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus]   = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [result, setResult]   = useState<DiseaseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(
        "http://localhost:5000/api/disease/detect",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(
        err.response?.data?.message ||
        "Analysis failed. Make sure the ML service is running on port 8000."
      );
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  const severityLabel = (s: string) =>
    s === "none" ? "Healthy" : s === "moderate" ? "Moderate" : s === "high" ? "High Risk" : "Critical";

  return (
    <div className="view-root">
      <style>{`
        .disease-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Upload col */
        .upload-col { display: flex; flex-direction: column; gap: 16px; }

        .upload-zone {
          border: 2px dashed var(--border2);
          border-radius: 16px;
          min-height: 280px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          background: var(--bg2); overflow: hidden; position: relative;
        }
        .upload-zone:hover { border-color: var(--green); background: var(--glo); }
        .upload-zone.has-file { border-style: solid; border-color: var(--border2); padding: 0; }
        .upload-zone.dragging { border-color: var(--green); background: var(--glo); }

        .upload-preview {
          width: 100%; height: 280px;
          object-fit: cover; border-radius: 14px;
        }

        .upload-placeholder { text-align: center; padding: 40px 24px; }
        .upload-icon { font-size: 52px; margin-bottom: 14px; opacity: 0.6; }
        .upload-text { font-size: 15px; font-weight: 600; color: var(--cream); margin-bottom: 6px; }
        .upload-sub { font-size: 12px; color: var(--muted); }

        .upload-actions { display: flex; gap: 10px; }

        /* Tips */
        .tips-box {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; padding: 18px;
        }
        .tips-title {
          font-size: 11px; font-weight: 700; color: var(--muted);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px;
        }
        .tip-row {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 12px; color: var(--muted); margin-bottom: 8px;
          line-height: 1.5;
        }
        .tip-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); flex-shrink: 0; margin-top: 5px;
        }

        /* Result col */
        .result-col {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 16px; min-height: 400px;
          display: flex; flex-direction: column;
        }

        .result-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px; text-align: center; gap: 12px;
        }
        .result-empty-icon { font-size: 52px; opacity: 0.35; }
        .result-empty-title { font-size: 16px; font-weight: 600; color: var(--cream); }
        .result-empty-sub { font-size: 13px; color: var(--muted); max-width: 260px; line-height: 1.6; }

        /* Spinner */
        .spinner-wrap {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 20px;
        }
        .spinner {
          width: 48px; height: 48px; border-radius: 50%;
          border: 3px solid var(--border);
          border-top-color: var(--green);
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-text { font-size: 14px; color: var(--muted); }
        .spinner-sub { font-size: 12px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

        /* Error */
        .error-wrap {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px; text-align: center; gap: 16px;
        }
        .error-icon { font-size: 48px; }
        .error-title { font-size: 16px; font-weight: 600; color: var(--red); }
        .error-msg { font-size: 13px; color: var(--muted); max-width: 320px; line-height: 1.6; }

        /* Result card */
        .result-card { padding: 28px; display: flex; flex-direction: column; gap: 20px; }

        .result-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }

        .result-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700;
          padding: 5px 14px; border-radius: 100px;
        }
        .result-badge.green {
          background: var(--glo); color: var(--green);
          border: 1px solid rgba(76,175,110,0.3);
        }
        .result-badge.amber {
          background: var(--alo); color: var(--amber);
          border: 1px solid rgba(232,162,69,0.3);
        }
        .result-badge.red {
          background: var(--rlo); color: var(--red);
          border: 1px solid rgba(224,92,92,0.3);
        }

        .result-conf {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px; color: var(--green);
          background: var(--glo); border: 1px solid var(--border2);
          padding: 5px 12px; border-radius: 100px;
        }

        .result-disease-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 700; color: var(--cream);
          line-height: 1.1;
        }
        .result-crop-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted); margin-top: 4px;
        }
        .result-sci {
          font-size: 13px; color: var(--muted); font-style: italic; margin-top: 2px;
        }

        .result-divider {
          height: 1px; background: var(--border); margin: 4px 0;
        }

        .result-section-title {
          font-size: 11px; font-weight: 700; color: var(--muted);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px;
        }

        /* Symptoms */
        .symptoms-list { display: flex; flex-direction: column; gap: 8px; }
        .symptom-row {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 13px; color: var(--muted); line-height: 1.5;
        }
        .symptom-arrow { color: var(--amber); flex-shrink: 0; font-size: 11px; margin-top: 2px; }

        /* Treatments */
        .treatment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .treatment-card {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px;
          transition: border-color 0.2s;
        }
        .treatment-card:hover { border-color: var(--border2); }
        .treatment-icon { font-size: 20px; margin-bottom: 6px; }
        .treatment-type { font-size: 12px; font-weight: 700; color: var(--green); margin-bottom: 4px; }
        .treatment-detail { font-size: 12px; color: var(--muted); line-height: 1.55; }

        /* Prevention */
        .prevention-box {
          background: var(--glo); border: 1px solid var(--border2);
          border-radius: 12px; padding: 14px 16px;
          font-size: 13px; color: var(--muted); line-height: 1.6;
          display: flex; gap: 10px; align-items: flex-start;
        }
        .prevention-icon { font-size: 16px; flex-shrink: 0; }

        /* Top 5 */
        .top5-list { display: flex; flex-direction: column; gap: 8px; }
        .top5-row { display: flex; align-items: center; gap: 10px; }
        .top5-label { font-size: 12px; color: var(--muted); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top5-bar-wrap { width: 100px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; flex-shrink: 0; }
        .top5-bar { height: 100%; background: var(--green); border-radius: 2px; }
        .top5-pct { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); width: 42px; text-align: right; flex-shrink: 0; }

        .result-actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }

        @media (max-width: 900px) {
          .disease-layout { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Disease Detection</h1>
          <p className="view-sub">Upload a crop leaf image — EfficientNet AI identifies disease instantly across 38 classes.</p>
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, color: "var(--green)",
          background: "var(--glo)", border: "1px solid var(--border2)",
          borderRadius: 100, padding: "5px 14px",
        }}>
          ⚡ EfficientNet-B3 · 38 Classes
        </div>
      </div>

      <div className="disease-layout">
        {/* ── Left: Upload ── */}
        <div className="upload-col">
          <div
            className={`upload-zone ${preview ? "has-file" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => !preview && inputRef.current?.click()}
          >
            <input
              ref={inputRef} type="file" accept="image/*"
              style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {preview ? (
              <img src={preview} alt="Leaf preview" className="upload-preview" />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">🍃</div>
                <div className="upload-text">Drop a leaf image here</div>
                <div className="upload-sub">or click to browse · JPG, PNG, WEBP · max 10MB</div>
              </div>
            )}
          </div>

          {preview && (
            <div className="upload-actions">
              <button className="action-btn" style={{ flex: 1 }} onClick={reset}>
                ✕ Clear
              </button>
              <button
                className="action-btn green"
                style={{ flex: 2 }}
                onClick={analyze}
                disabled={status === "analyzing"}
              >
                {status === "analyzing" ? "Analysing…" : "🔬 Run Analysis"}
              </button>
            </div>
          )}

          {/* Tips */}
          <div className="tips-box">
            <div className="tips-title">Photo Tips for Best Results</div>
            {[
              "Photograph the affected leaf in natural daylight",
              "Include both healthy and diseased portions of the leaf",
              "Avoid blurry, dark, or heavily shadowed images",
              "One leaf per upload — close-up works best",
              "Works best on tomato, potato, maize, grape, apple, pepper",
            ].map(t => (
              <div key={t} className="tip-row">
                <span className="tip-dot" /> {t}
              </div>
            ))}
          </div>

          {/* Supported crops */}
          <div className="tips-box">
            <div className="tips-title">Supported Crops (14)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["🍎 Apple","🫐 Blueberry","🍒 Cherry","🌽 Maize","🍇 Grape","🍊 Orange","🍑 Peach","🫑 Pepper","🥔 Potato","🫐 Raspberry","🫘 Soybean","🎃 Squash","🍓 Strawberry","🍅 Tomato"].map(c => (
                <span key={c} style={{
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 100, padding: "3px 10px", fontSize: 11, color: "var(--muted)",
                }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Result ── */}
        <div className="result-col">
          {/* Idle — no image */}
          {status === "idle" && !preview && (
            <div className="result-empty">
              <div className="result-empty-icon">🔬</div>
              <div className="result-empty-title">Upload a leaf to begin</div>
              <p className="result-empty-sub">Results, confidence score, symptoms, and treatment plan appear here after analysis.</p>
            </div>
          )}

          {/* Idle — image loaded, not yet analysed */}
          {status === "idle" && preview && (
            <div className="result-empty">
              <div className="result-empty-icon">👆</div>
              <div className="result-empty-title">Ready to analyse</div>
              <p className="result-empty-sub">Click "Run Analysis" to detect disease using the AI model.</p>
              <button className="action-btn green" onClick={analyze}>🔬 Run Analysis</button>
            </div>
          )}

          {/* Analyzing */}
          {status === "analyzing" && (
            <div className="spinner-wrap">
              <div className="spinner" />
              <div className="spinner-text">Analysing leaf image…</div>
              <div className="spinner-sub">EfficientNet-B3 · 38 disease classes</div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="error-wrap">
              <div className="error-icon">⚠️</div>
              <div className="error-title">Analysis Failed</div>
              <p className="error-msg">{errorMsg}</p>
              <button className="action-btn" onClick={() => setStatus("idle")}>Try Again</button>
            </div>
          )}

          {/* Result */}
          {status === "done" && result && (
            <div className="result-card">
              {/* Header row */}
              <div className="result-header">
                <span className={`result-badge ${result.disease.severity_color}`}>
                  {result.detected ? "⚠️ Disease Detected" : "✅ Healthy Plant"}
                </span>
                <span className="result-conf">{result.confidence.toFixed(1)}% confidence</span>
              </div>

              {/* Disease name */}
              <div>
                <div className="result-disease-name">{result.disease.name}</div>
                {result.disease.scientific !== "N/A" && (
                  <div className="result-sci">{result.disease.scientific}</div>
                )}
                <div className="result-crop-tag">
                  Detected crop: {result.disease.crop} ·
                  Severity: {severityLabel(result.disease.severity)}
                </div>
              </div>

              <div className="result-divider" />

              {/* Symptoms */}
              <div>
                <div className="result-section-title">Symptoms Identified</div>
                <div className="symptoms-list">
                  {result.disease.symptoms.map((s, i) => (
                    <div key={i} className="symptom-row">
                      <span className="symptom-arrow">▸</span> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatments */}
              {result.detected && (
                <>
                  <div className="result-divider" />
                  <div>
                    <div className="result-section-title">Recommended Treatment</div>
                    <div className="treatment-grid">
                      {result.disease.treatments.map((t, i) => (
                        <div key={i} className="treatment-card">
                          <div className="treatment-icon">{t.icon}</div>
                          <div className="treatment-type">{t.type}</div>
                          <div className="treatment-detail">{t.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prevention */}
                  <div className="prevention-box">
                    <span className="prevention-icon">🛡️</span>
                    <div><strong style={{ color: "var(--cream)", fontSize: 12 }}>Prevention: </strong>{result.disease.prevention}</div>
                  </div>
                </>
              )}

              <div className="result-divider" />

              {/* Top 5 */}
              <div>
                <div className="result-section-title">Top 5 Predictions</div>
                <div className="top5-list">
                  {result.top5.map((item, i) => (
                    <div key={i} className="top5-row">
                      <div className="top5-label" title={item.class}>
                        {i === 0 && <span style={{ color: "var(--green)", marginRight: 4 }}>●</span>}
                        {item.class.replace("___", " — ").replace(/_/g, " ")}
                      </div>
                      <div className="top5-bar-wrap">
                        <div className="top5-bar" style={{ width: `${item.confidence}%` }} />
                      </div>
                      <div className="top5-pct">{item.confidence.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="result-actions">
                <button className="action-btn green" onClick={() => {
                  const text = `Disease: ${result.disease.name}\nCrop: ${result.disease.crop}\nConfidence: ${result.confidence.toFixed(1)}%\nSeverity: ${result.disease.severity}\n\nPrevention: ${result.disease.prevention}`;
                  navigator.clipboard.writeText(text);
                }}>
                  📋 Copy Report
                </button>
                <button className="action-btn" onClick={reset}>
                  🔄 Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}