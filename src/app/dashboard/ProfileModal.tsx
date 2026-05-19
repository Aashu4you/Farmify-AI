"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Profile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  farmName: string;
  farmLocation: string;
  role: string;
  createdAt: string;
}

interface Props {
  onClose: () => void;
  onProfileUpdate: (name: string) => void;
}

const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfileModal({ onClose, onProfileUpdate }: Props) {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<"view" | "edit" | "password">("view");

  // Edit form
  const [editForm, setEditForm]   = useState({ name: "", phone: "", farmName: "", farmLocation: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Password form
  const [pwForm, setPwForm]       = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving]   = useState(false);
  const [pwError, setPwError]     = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPw, setShowPw]       = useState({ current: false, new: false, confirm: false });

  // ── Fetch profile ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api().get("/profile");
        setProfile(res.data);
        setEditForm({
          name:         res.data.name         || "",
          phone:        res.data.phone         || "",
          farmName:     res.data.farmName      || "",
          farmLocation: res.data.farmLocation  || "",
        });
      } catch (err: any) {
        console.error("Profile fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    setEditSuccess("");
    try {
      const res = await api().put("/profile", editForm);
      setProfile(prev => prev ? { ...prev, ...res.data } : res.data);

      // Update localStorage so topbar/sidebar reflect new name immediately
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, name: res.data.name }));
      onProfileUpdate(res.data.name);

      setEditSuccess("Profile updated successfully!");
      setTimeout(() => setEditSuccess(""), 3000);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Change password ──────────────────────────────────────────────────────
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }

    setPwSaving(true);
    try {
      await api().put("/profile/password", {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwSuccess("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (err: any) {
      setPwError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const initials = profile?.name?.slice(0, 2).toUpperCase() || "??";
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  const strengthColor = (pw: string) => {
    if (pw.length === 0) return "var(--border)";
    if (pw.length < 6)   return "var(--red)";
    if (pw.length < 10)  return "var(--amber)";
    return "var(--green)";
  };

  const strengthLabel = (pw: string) => {
    if (pw.length === 0) return "";
    if (pw.length < 6)   return "Too short";
    if (pw.length < 10)  return "Fair";
    return "Strong";
  };

  return (
    <>
      <style>{`
        .profile-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(6,14,7,0.88);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .profile-modal {
          background: var(--bg2); border: 1px solid var(--border2);
          border-radius: 24px; width: 100%; max-width: 560px;
          max-height: 90vh; overflow-y: auto;
          display: flex; flex-direction: column;
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

        /* Header */
        .pm-header {
          padding: 28px 32px 0;
          display: flex; align-items: flex-start; justify-content: space-between;
        }
        .pm-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 700; color: var(--cream);
        }
        .pm-close {
          background: none; border: 1px solid var(--border);
          color: var(--muted); width: 34px; height: 34px;
          border-radius: 9px; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .pm-close:hover { border-color: var(--border2); color: var(--cream); }

        /* Avatar section */
        .pm-avatar-section {
          display: flex; align-items: center; gap: 20px;
          padding: 24px 32px; border-bottom: 1px solid var(--border);
        }
        .pm-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: var(--gmd); border: 2px solid var(--border2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 22px; font-weight: 700; color: var(--green);
          flex-shrink: 0;
        }
        .pm-avatar-info { flex: 1; }
        .pm-avatar-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px; font-weight: 700; color: var(--cream);
        }
        .pm-avatar-email { font-size: 13px; color: var(--muted); margin-top: 2px; }
        .pm-avatar-since {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted); margin-top: 6px;
        }

        /* Tabs */
        .pm-tabs {
          display: flex; gap: 2px;
          padding: 16px 32px 0;
          border-bottom: 1px solid var(--border);
        }
        .pm-tab {
          padding: 8px 20px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s; color: var(--muted);
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          background: none; border-top: none; border-left: none; border-right: none;
          font-family: 'Syne', sans-serif;
        }
        .pm-tab:hover { color: var(--cream); }
        .pm-tab.active { color: var(--green); border-bottom-color: var(--green); }

        /* Body */
        .pm-body { padding: 28px 32px 32px; display: flex; flex-direction: column; gap: 20px; }

        /* Info rows (view tab) */
        .pm-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        }
        .pm-info-cell {
          background: var(--bg3); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 16px;
        }
        .pm-info-label {
          font-size: 11px; font-weight: 600; color: var(--muted);
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px;
        }
        .pm-info-value { font-size: 14px; font-weight: 600; color: var(--cream); }
        .pm-info-empty { color: var(--muted); font-weight: 400; font-style: italic; font-size: 13px; }

        /* Form */
        .pm-form { display: flex; flex-direction: column; gap: 14px; }
        .pm-form-group { display: flex; flex-direction: column; gap: 6px; }
        .pm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pm-label {
          font-size: 11px; font-weight: 600; color: var(--muted);
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .pm-input {
          background: var(--bg3); border: 1px solid var(--border2);
          border-radius: 10px; padding: 11px 14px;
          font-size: 14px; font-family: 'Syne', sans-serif;
          color: var(--cream); outline: none;
          transition: border-color 0.2s; width: 100%;
        }
        .pm-input:focus { border-color: var(--green); }
        .pm-input::placeholder { color: var(--muted); }
        .pm-input:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Password input wrapper */
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          font-size: 14px; color: var(--muted); padding: 0;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: var(--cream); }

        /* Strength bar */
        .strength-bar-wrap { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 4px; }
        .strength-bar { height: 100%; border-radius: 2px; transition: all 0.3s; }
        .strength-label { font-size: 11px; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }

        /* Success / Error */
        .pm-success {
          display: flex; align-items: center; gap: 8px;
          background: var(--glo); border: 1px solid rgba(76,175,110,0.3);
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; color: var(--green);
        }
        .pm-error {
          display: flex; align-items: center; gap: 8px;
          background: var(--rlo); border: 1px solid rgba(224,92,92,0.25);
          border-radius: 10px; padding: 11px 14px;
          font-size: 13px; color: var(--red);
          animation: shake 0.3s ease;
        }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }

        /* Actions */
        .pm-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

        /* Skeleton */
        .pm-skeleton {
          height: 48px; border-radius: 10px;
          background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* Divider */
        .pm-divider { height: 1px; background: var(--border); }

        .pm-section-title {
          font-size: 12px; font-weight: 700; color: var(--muted);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
      `}</style>

      <div className="profile-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="pm-header">
            <div className="pm-title">My Profile</div>
            <button className="pm-close" onClick={onClose}>✕</button>
          </div>

          {/* Avatar section */}
          {loading ? (
            <div style={{ padding: "24px 32px" }}>
              <div className="pm-skeleton" />
            </div>
          ) : profile && (
            <div className="pm-avatar-section">
              <div className="pm-avatar">{initials}</div>
              <div className="pm-avatar-info">
                <div className="pm-avatar-name">{profile.name}</div>
                <div className="pm-avatar-email">{profile.email}</div>
                <div className="pm-avatar-since">Member since {memberSince}</div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, color: "var(--green)",
                background: "var(--glo)", border: "1px solid var(--border2)",
                borderRadius: 100, padding: "4px 12px",
              }}>
                {profile.role || "Farmer"}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="pm-tabs">
            {[
              { id: "view",     label: "Overview" },
              { id: "edit",     label: "Edit Profile" },
              { id: "password", label: "Change Password" },
            ].map(t => (
              <button
                key={t.id}
                className={`pm-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id as any)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="pm-body">

            {/* ── VIEW TAB ── */}
            {tab === "view" && (
              <>
                {loading ? (
                  [1,2,3,4].map(i => <div key={i} className="pm-skeleton" style={{height:64}} />)
                ) : profile && (
                  <>
                    <div className="pm-section-title">Personal Information</div>
                    <div className="pm-info-grid">
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Full Name</div>
                        <div className="pm-info-value">{profile.name}</div>
                      </div>
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Email</div>
                        <div className="pm-info-value" style={{fontSize:13}}>{profile.email}</div>
                      </div>
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Phone</div>
                        <div className={profile.phone ? "pm-info-value" : "pm-info-empty"}>
                          {profile.phone || "Not set"}
                        </div>
                      </div>
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Role</div>
                        <div className="pm-info-value" style={{color:"var(--green)"}}>{profile.role || "Farmer"}</div>
                      </div>
                    </div>

                    <div className="pm-divider" />
                    <div className="pm-section-title">Farm Information</div>

                    <div className="pm-info-grid">
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Farm Name</div>
                        <div className={profile.farmName ? "pm-info-value" : "pm-info-empty"}>
                          {profile.farmName || "Not set"}
                        </div>
                      </div>
                      <div className="pm-info-cell">
                        <div className="pm-info-label">Location</div>
                        <div className={profile.farmLocation ? "pm-info-value" : "pm-info-empty"}>
                          {profile.farmLocation || "Not set"}
                        </div>
                      </div>
                    </div>

                    <div className="pm-divider" />

                    <div style={{display:"flex", gap:10}}>
                      <button className="action-btn green" style={{flex:1}} onClick={() => setTab("edit")}>
                        ✏️ Edit Profile
                      </button>
                      <button className="action-btn" style={{flex:1}} onClick={() => setTab("password")}>
                        🔒 Change Password
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── EDIT TAB ── */}
            {tab === "edit" && (
              <form className="pm-form" onSubmit={handleEditSave}>
                {editError   && <div className="pm-error">⚠️ {editError}</div>}
                {editSuccess && <div className="pm-success">✅ {editSuccess}</div>}

                <div className="pm-section-title">Personal Information</div>

                <div className="pm-form-group">
                  <label className="pm-label">Full Name *</label>
                  <input
                    className="pm-input"
                    placeholder="Your full name"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">Phone Number</label>
                  <input
                    className="pm-input"
                    placeholder="+91 98765 43210"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>

                <div className="pm-divider" />
                <div className="pm-section-title">Farm Information</div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label className="pm-label">Farm Name</label>
                    <input
                      className="pm-input"
                      placeholder="e.g. Green Valley Farm"
                      value={editForm.farmName}
                      onChange={e => setEditForm({...editForm, farmName: e.target.value})}
                    />
                  </div>
                  <div className="pm-form-group">
                    <label className="pm-label">Farm Location</label>
                    <input
                      className="pm-input"
                      placeholder="e.g. Indore, MP"
                      value={editForm.farmLocation}
                      onChange={e => setEditForm({...editForm, farmLocation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pm-actions">
                  <button type="button" className="action-btn" onClick={() => setTab("view")} disabled={editSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="action-btn green" disabled={editSaving}>
                    {editSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* ── PASSWORD TAB ── */}
            {tab === "password" && (
              <form className="pm-form" onSubmit={handlePasswordSave}>
                {pwError   && <div className="pm-error">⚠️ {pwError}</div>}
                {pwSuccess && <div className="pm-success">✅ {pwSuccess}</div>}

                <div className="pm-section-title">Change Password</div>

                <div className="pm-form-group">
                  <label className="pm-label">Current Password</label>
                  <div className="pw-wrap">
                    <input
                      className="pm-input"
                      type={showPw.current ? "text" : "password"}
                      placeholder="Enter current password"
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})}
                      required
                      style={{paddingRight: 40}}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(p => ({...p, current: !p.current}))}>
                      {showPw.current ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">New Password</label>
                  <div className="pw-wrap">
                    <input
                      className="pm-input"
                      type={showPw.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({...pwForm, newPassword: e.target.value})}
                      required
                      style={{paddingRight: 40}}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(p => ({...p, new: !p.new}))}>
                      {showPw.new ? "🙈" : "👁"}
                    </button>
                  </div>
                  {pwForm.newPassword && (
                    <>
                      <div className="strength-bar-wrap">
                        <div className="strength-bar" style={{
                          width: pwForm.newPassword.length === 0 ? "0%" : pwForm.newPassword.length < 6 ? "33%" : pwForm.newPassword.length < 10 ? "66%" : "100%",
                          background: strengthColor(pwForm.newPassword),
                        }} />
                      </div>
                      <div className="strength-label" style={{color: strengthColor(pwForm.newPassword)}}>
                        {strengthLabel(pwForm.newPassword)}
                      </div>
                    </>
                  )}
                </div>

                <div className="pm-form-group">
                  <label className="pm-label">Confirm New Password</label>
                  <div className="pw-wrap">
                    <input
                      className="pm-input"
                      type={showPw.confirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})}
                      required
                      style={{
                        paddingRight: 40,
                        borderColor: pwForm.confirmPassword
                          ? pwForm.confirmPassword === pwForm.newPassword
                            ? "var(--green)" : "var(--red)"
                          : undefined,
                      }}
                    />
                    <button type="button" className="pw-toggle" onClick={() => setShowPw(p => ({...p, confirm: !p.confirm}))}>
                      {showPw.confirm ? "🙈" : "👁"}
                    </button>
                  </div>
                  {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                    <div style={{fontSize:11, color:"var(--red)", fontFamily:"'JetBrains Mono',monospace"}}>
                      Passwords do not match
                    </div>
                  )}
                </div>

                <div className="pm-actions">
                  <button type="button" className="action-btn" onClick={() => setTab("view")} disabled={pwSaving}>
                    Cancel
                  </button>
                  <button type="submit" className="action-btn green" disabled={pwSaving}>
                    {pwSaving ? "Changing…" : "Change Password"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </>
  );
}