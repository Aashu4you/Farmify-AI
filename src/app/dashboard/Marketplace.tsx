"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
  _id: string;
  user: string;
  sellerName: string;
  sellerPhone: string;
  sellerLocation: string;
  cropName: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  description: string;
  linkedCropId?: string;
  status: "active" | "sold" | "expired";
  harvestDate?: string;
  createdAt: string;
}

interface MyCrop {
  _id: string;
  name: string;
  field: string;
  area: string;
  stage: string;
}

interface FormState {
  cropName: string;
  category: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  description: string;
  sellerPhone: string;
  sellerLocation: string;
  harvestDate: string;
  linkedCropId: string;
}

const EMPTY_FORM: FormState = {
  cropName: "", category: "Grains", quantity: "", unit: "quintal",
  pricePerUnit: "", description: "", sellerPhone: "",
  sellerLocation: "", harvestDate: "", linkedCropId: "",
};

const CATEGORIES = ["All", "Grains", "Vegetables", "Fruits", "Pulses", "Oilseeds", "Spices", "Flowers", "Other"];
const UNITS      = ["kg", "quintal", "tonne", "bag", "dozen", "piece"];

const CATEGORY_ICONS: Record<string, string> = {
  Grains: "🌾", Vegetables: "🥦", Fruits: "🍎", Pulses: "🫘",
  Oilseeds: "🌻", Spices: "🌶️", Flowers: "🌸", Other: "📦", All: "🏪",
};

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "oldest",     label: "Oldest First" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// ── API ───────────────────────────────────────────────────────────────────────
const api = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtPrice = (n: number) =>
  n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : `₹${n}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const daysSince = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;
};

const isMyListing = (listing: Listing) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return listing.sellerName === user?.name || listing.user === user?._id;
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ h = 180 }: { h?: number }) {
  return (
    <div style={{
      height: h, borderRadius: 16,
      background: "linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%)",
      backgroundSize: "200% 100%", animation: "mkShimmer 1.4s infinite",
    }} />
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({
  listing, onEdit, onDelete, onContact, currentUserId,
}: {
  listing: Listing;
  onEdit: (l: Listing) => void;
  onDelete: (id: string) => void;
  onContact: (l: Listing) => void;
  currentUserId: string;
}) {
  const mine = listing.user === currentUserId;
  const freshDays = listing.harvestDate
    ? Math.floor((Date.now() - new Date(listing.harvestDate).getTime()) / 86400000)
    : null;
  const isFresh = freshDays !== null && freshDays <= 7;

  return (
    <div className={`mk-card ${listing.status !== "active" ? "mk-card-inactive" : ""}`}>
      {/* Status badge */}
      {listing.status !== "active" && (
        <div className={`mk-status-badge ${listing.status}`}>
          {listing.status === "sold" ? "✓ Sold" : "Expired"}
        </div>
      )}

      {/* Fresh badge */}
      {isFresh && listing.status === "active" && (
        <div className="mk-fresh-badge">🌿 Fresh</div>
      )}

      {/* Mine badge */}
      {mine && (
        <div className="mk-mine-badge">Yours</div>
      )}

      {/* Top: category + price */}
      <div className="mk-card-top">
        <div className="mk-cat-icon">{CATEGORY_ICONS[listing.category] || "📦"}</div>
        <div className="mk-price-block">
          <div className="mk-price">{fmtPrice(listing.pricePerUnit)}</div>
          <div className="mk-price-unit">per {listing.unit}</div>
        </div>
      </div>

      {/* Crop name + category */}
      <div className="mk-crop-name">{listing.cropName}</div>
      <div className="mk-category-lbl">{listing.category}</div>

      {/* Quantity */}
      <div className="mk-qty-row">
        <span className="mk-qty-icon">⚖️</span>
        <span className="mk-qty">{listing.quantity} {listing.unit} available</span>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="mk-desc">{listing.description.length > 80 ? listing.description.slice(0, 80) + "…" : listing.description}</div>
      )}

      {/* Divider */}
      <div className="mk-divider" />

      {/* Seller info */}
      <div className="mk-seller-row">
        <div className="mk-seller-avatar">{listing.sellerName.slice(0,2).toUpperCase()}</div>
        <div className="mk-seller-info">
          <div className="mk-seller-name">{listing.sellerName}</div>
          {listing.sellerLocation && (
            <div className="mk-seller-loc">📍 {listing.sellerLocation}</div>
          )}
        </div>
        <div className="mk-posted">{daysSince(listing.createdAt)}</div>
      </div>

      {/* Harvest date */}
      {listing.harvestDate && (
        <div className="mk-harvest">
          🗓 Harvested: {fmtDate(listing.harvestDate)}
          {isFresh && <span style={{color:"var(--green)",marginLeft:6,fontSize:10}}>· Fresh</span>}
        </div>
      )}

      {/* Actions */}
      <div className="mk-card-actions">
        {mine ? (
          <>
            <button className="action-btn" style={{flex:1,padding:"8px 0",fontSize:12}} onClick={() => onEdit(listing)}>✏️ Edit</button>
            <button className="action-btn amber" style={{flex:1,padding:"8px 0",fontSize:12}} onClick={() => onDelete(listing._id)}>🗑️ Delete</button>
          </>
        ) : (
          <button
            className="action-btn green"
            style={{flex:1,padding:"8px 0",fontSize:13}}
            onClick={() => onContact(listing)}
            disabled={listing.status !== "active"}
          >
            📞 Contact Seller
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Marketplace() {
  const [listings, setListings]       = useState<Listing[]>([]);
  const [myListings, setMyListings]   = useState<Listing[]>([]);
  const [myCrops, setMyCrops]         = useState<MyCrop[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  // Filters
  const [activeTab, setActiveTab]     = useState<"browse" | "my">("browse");
  const [category, setCategory]       = useState("All");
  const [sort, setSort]               = useState("newest");
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Listing | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState("");

  // Delete confirm
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  // Contact modal
  const [contactListing, setContactListing] = useState<Listing | null>(null);

  // Current user id
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUserId(user?._id || user?.id || "");
  }, []);

  // ── Fetch all listings ────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string> = { sort };
      if (category !== "All") params.category = category;
      if (search) params.search = search;
      const res = await api().get("/listings", { params });
      setListings(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [category, sort, search]);

  // ── Fetch my listings + crops ─────────────────────────────────────────────
  const fetchMyData = useCallback(async () => {
    try {
      const [myRes, cropsRes] = await Promise.all([
        api().get("/listings/my"),
        api().get("/listings/my-crops"),
      ]);
      setMyListings(myRes.data);
      setMyCrops(cropsRes.data);
    } catch {}
  }, []);

  useEffect(() => { fetchListings(); fetchMyData(); }, [fetchListings, fetchMyData]);

  // ── Search on Enter ───────────────────────────────────────────────────────
  const handleSearch = () => setSearch(searchInput.trim());

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      sellerPhone:    user?.phone        || "",
      sellerLocation: user?.farmLocation || "",
    });
    setFormError(""); setModalOpen(true);
  };

  // ── Auto-fill from linked crop ────────────────────────────────────────────
  const handleCropLink = (cropId: string) => {
    const crop = myCrops.find(c => c._id === cropId);
    setForm(f => ({
      ...f,
      linkedCropId: cropId,
      cropName: crop ? crop.name : f.cropName,
    }));
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (listing: Listing) => {
    setEditTarget(listing);
    setForm({
      cropName:       listing.cropName,
      category:       listing.category,
      quantity:       String(listing.quantity),
      unit:           listing.unit,
      pricePerUnit:   String(listing.pricePerUnit),
      description:    listing.description,
      sellerPhone:    listing.sellerPhone,
      sellerLocation: listing.sellerLocation,
      harvestDate:    listing.harvestDate ? listing.harvestDate.split("T")[0] : "",
      linkedCropId:   listing.linkedCropId || "",
    });
    setFormError(""); setModalOpen(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError("");
    try {
      const payload = {
        ...form,
        quantity:     Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
        harvestDate:  form.harvestDate || null,
        linkedCropId: form.linkedCropId || null,
      };
      if (editTarget) {
        const res = await api().put(`/listings/${editTarget._id}`, payload);
        setListings(prev => prev.map(l => l._id === editTarget._id ? res.data : l));
        setMyListings(prev => prev.map(l => l._id === editTarget._id ? res.data : l));
      } else {
        const res = await api().post("/listings", payload);
        setListings(prev => [res.data, ...prev]);
        setMyListings(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save listing");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api().delete(`/listings/${deleteId}`);
      setListings(prev => prev.filter(l => l._id !== deleteId));
      setMyListings(prev => prev.filter(l => l._id !== deleteId));
      setDeleteId(null);
    } catch {}
    finally { setDeleting(false); }
  };

  // ── Mark as sold ──────────────────────────────────────────────────────────
  const markSold = async (id: string) => {
    try {
      const res = await api().put(`/listings/${id}`, { status: "sold" });
      setMyListings(prev => prev.map(l => l._id === id ? res.data : l));
      setListings(prev => prev.map(l => l._id === id ? res.data : l));
    } catch {}
  };

  const displayListings = activeTab === "browse" ? listings : myListings;
  const activeCount      = listings.filter(l => l.status === "active").length;

  return (
    <div className="view-root">
      <style>{`
        @keyframes mkShimmer { to { background-position: -200% 0; } }
        @keyframes mkFadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        /* ── Header stats ── */
        .mk-header-stats { display:flex; gap:12px; flex-wrap:wrap; }
        .mk-stat-pill {
          display:flex; align-items:center; gap:8px;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:100px; padding:7px 16px;
          font-size:12px; color:var(--muted);
          font-family:'JetBrains Mono',monospace;
        }
        .mk-stat-pill strong { color:var(--cream); }

        /* ── Toolbar ── */
        .mk-toolbar {
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        }
        .mk-search-wrap {
          flex:1; min-width:200px; position:relative;
        }
        .mk-search-input {
          width:100%; background:var(--bg2); border:1px solid var(--border2);
          border-radius:10px; padding:10px 40px 10px 14px;
          font-size:13px; color:var(--cream); font-family:'Syne',sans-serif;
          outline:none; transition:border-color 0.2s;
        }
        .mk-search-input:focus { border-color:var(--green); }
        .mk-search-input::placeholder { color:var(--muted); }
        .mk-search-btn {
          position:absolute; right:10px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:var(--muted);
          cursor:pointer; font-size:15px; padding:0; transition:color 0.2s;
        }
        .mk-search-btn:hover { color:var(--green); }
        .mk-select {
          background:var(--bg2); border:1px solid var(--border2);
          border-radius:10px; padding:10px 12px;
          font-size:13px; color:var(--cream); font-family:'Syne',sans-serif;
          outline:none; cursor:pointer; transition:border-color 0.2s;
        }
        .mk-select:focus { border-color:var(--green); }
        .mk-select option { background:#111f13; }

        /* ── Category chips ── */
        .mk-cats { display:flex; gap:6px; flex-wrap:wrap; }
        .mk-cat-chip {
          display:flex; align-items:center; gap:5px;
          padding:6px 14px; border-radius:100px;
          font-size:12px; font-weight:600; cursor:pointer;
          border:1px solid var(--border); background:var(--bg2);
          color:var(--muted); transition:all 0.18s;
          font-family:'Syne',sans-serif;
        }
        .mk-cat-chip:hover { border-color:var(--border2); color:var(--cream); }
        .mk-cat-chip.active {
          background:var(--glo); color:var(--green);
          border-color:var(--border2);
        }

        /* ── Tabs ── */
        .mk-tabs {
          display:flex; gap:4px;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:12px; padding:4px; width:fit-content;
        }
        .mk-tab {
          padding:8px 20px; border-radius:9px; font-size:13px;
          font-weight:600; cursor:pointer; transition:all 0.18s;
          color:var(--muted); border:1px solid transparent;
          font-family:'Syne',sans-serif; background:none;
        }
        .mk-tab.active { background:var(--glo); color:var(--green); border-color:var(--border2); }
        .mk-tab:hover:not(.active) { color:var(--cream); }

        /* ── Grid ── */
        .mk-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
          gap:16px;
        }

        /* ── Card ── */
        .mk-card {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:18px; padding:20px;
          display:flex; flex-direction:column; gap:10px;
          position:relative; transition:border-color 0.2s, transform 0.2s;
          animation:mkFadeUp 0.3s ease both;
        }
        .mk-card:hover { border-color:var(--border2); transform:translateY(-2px); }
        .mk-card-inactive { opacity:0.55; }

        /* Badges */
        .mk-status-badge {
          position:absolute; top:14px; right:14px;
          font-size:10px; font-weight:700; font-family:'JetBrains Mono',monospace;
          padding:3px 10px; border-radius:100px;
          letter-spacing:0.05em;
        }
        .mk-status-badge.sold    { background:var(--glo); color:var(--green); border:1px solid rgba(76,175,110,0.3); }
        .mk-status-badge.expired { background:var(--rlo); color:var(--red);   border:1px solid rgba(224,92,92,0.3); }
        .mk-fresh-badge {
          position:absolute; top:14px; right:14px;
          font-size:10px; font-weight:700; font-family:'JetBrains Mono',monospace;
          padding:3px 10px; border-radius:100px;
          background:var(--glo); color:var(--green);
          border:1px solid rgba(76,175,110,0.3);
        }
        .mk-mine-badge {
          position:absolute; top:14px; left:14px;
          font-size:10px; font-weight:700; font-family:'JetBrains Mono',monospace;
          padding:3px 10px; border-radius:100px;
          background:rgba(76,175,110,0.15); color:var(--green);
          border:1px solid rgba(76,175,110,0.25);
        }

        /* Card internals */
        .mk-card-top { display:flex; align-items:center; justify-content:space-between; }
        .mk-cat-icon { font-size:28px; }
        .mk-price-block { text-align:right; }
        .mk-price {
          font-family:'Cormorant Garamond',serif;
          font-size:24px; font-weight:700; color:var(--green); line-height:1;
        }
        .mk-price-unit { font-size:10px; color:var(--muted); font-family:'JetBrains Mono',monospace; }
        .mk-crop-name { font-size:17px; font-weight:700; color:var(--cream); }
        .mk-category-lbl { font-size:11px; color:var(--muted); margin-top:-6px; }
        .mk-qty-row { display:flex; align-items:center; gap:6px; }
        .mk-qty-icon { font-size:13px; }
        .mk-qty { font-size:12px; color:var(--muted); font-family:'JetBrains Mono',monospace; }
        .mk-desc { font-size:12px; color:var(--muted); line-height:1.5; }
        .mk-divider { height:1px; background:var(--border); }
        .mk-seller-row { display:flex; align-items:center; gap:10px; }
        .mk-seller-avatar {
          width:32px; height:32px; border-radius:50%;
          background:var(--gmd); border:1px solid var(--border2);
          display:flex; align-items:center; justify-content:center;
          font-family:'JetBrains Mono',monospace; font-size:11px;
          color:var(--green); flex-shrink:0;
        }
        .mk-seller-info { flex:1; min-width:0; }
        .mk-seller-name { font-size:13px; font-weight:600; color:var(--cream); }
        .mk-seller-loc  { font-size:11px; color:var(--muted); margin-top:1px; }
        .mk-posted { font-size:10px; color:var(--muted); font-family:'JetBrains Mono',monospace; white-space:nowrap; }
        .mk-harvest { font-size:11px; color:var(--muted); }
        .mk-card-actions { display:flex; gap:8px; margin-top:2px; }

        /* ── My listings summary ── */
        .mk-my-summary {
          display:grid; grid-template-columns:repeat(3,1fr); gap:12px;
          margin-bottom:4px;
        }
        .mk-my-stat {
          background:var(--bg2); border:1px solid var(--border);
          border-radius:12px; padding:14px 16px; text-align:center;
        }
        .mk-my-stat-val { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:700; color:var(--cream); }
        .mk-my-stat-lbl { font-size:11px; color:var(--muted); margin-top:2px; }

        /* ── Empty ── */
        .mk-empty {
          grid-column:1/-1; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:64px 24px; text-align:center; gap:16px;
          background:var(--bg2); border:1px solid var(--border);
          border-radius:18px;
        }
        .mk-empty-icon { font-size:52px; opacity:0.35; }
        .mk-empty-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:700; color:var(--cream); }
        .mk-empty-sub { font-size:13px; color:var(--muted); max-width:280px; line-height:1.6; }

        /* ── Modal ── */
        .mk-overlay {
          position:fixed; inset:0; z-index:200;
          background:rgba(6,14,7,0.88); backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center; padding:24px;
          animation:mkFadeUp 0.18s ease;
        }
        .mk-modal {
          background:var(--bg2); border:1px solid var(--border2);
          border-radius:22px; width:100%; max-width:600px;
          max-height:92vh; overflow-y:auto; padding:32px;
          display:flex; flex-direction:column; gap:24px;
          animation:mkFadeUp 0.22s ease;
        }
        .mk-modal::-webkit-scrollbar { width:4px; }
        .mk-modal::-webkit-scrollbar-thumb { background:var(--border2); border-radius:2px; }
        .mk-modal-header { display:flex; align-items:flex-start; justify-content:space-between; }
        .mk-modal-title { font-family:'Cormorant Garamond',serif; font-size:26px; font-weight:700; color:var(--cream); }
        .mk-modal-close { background:none; border:1px solid var(--border); color:var(--muted); width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .mk-modal-close:hover { border-color:var(--border2); color:var(--cream); }
        .mk-form { display:flex; flex-direction:column; gap:14px; }
        .mk-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .mk-form-group { display:flex; flex-direction:column; gap:6px; }
        .mk-form-group.full { grid-column:1/-1; }
        .mk-label { font-size:11px; font-weight:600; color:var(--muted); letter-spacing:0.08em; text-transform:uppercase; }
        .mk-input, .mk-select-input, .mk-textarea {
          background:var(--bg3); border:1px solid var(--border2);
          border-radius:9px; padding:10px 14px; font-size:13px;
          font-family:'Syne',sans-serif; color:var(--cream);
          outline:none; transition:border-color 0.2s; width:100%;
        }
        .mk-input:focus, .mk-select-input:focus, .mk-textarea:focus { border-color:var(--green); }
        .mk-input::placeholder, .mk-textarea::placeholder { color:var(--muted); }
        .mk-select-input { appearance:none; cursor:pointer; }
        .mk-select-input option { background:var(--bg2); }
        .mk-textarea { resize:vertical; min-height:72px; line-height:1.5; }
        .mk-form-error { display:flex; align-items:center; gap:8px; background:var(--rlo); border:1px solid rgba(224,92,92,0.25); border-radius:9px; padding:10px 14px; font-size:13px; color:var(--red); }
        .mk-modal-actions { display:flex; gap:10px; justify-content:flex-end; }

        /* Crop link section */
        .mk-crop-link-box {
          background:var(--bg3); border:1px solid var(--border);
          border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px;
        }
        .mk-crop-link-title { font-size:12px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; }
        .mk-crop-chips { display:flex; gap:6px; flex-wrap:wrap; }
        .mk-crop-chip {
          padding:6px 12px; border-radius:8px; font-size:12px;
          border:1px solid var(--border); background:var(--bg2);
          color:var(--muted); cursor:pointer; transition:all 0.18s;
          font-family:'Syne',sans-serif;
        }
        .mk-crop-chip:hover { border-color:var(--border2); color:var(--cream); }
        .mk-crop-chip.linked { background:var(--glo); color:var(--green); border-color:var(--border2); }

        /* Contact modal */
        .mk-contact-box {
          background:var(--bg2); border:1px solid var(--border2);
          border-radius:20px; width:100%; max-width:420px;
          padding:32px; display:flex; flex-direction:column; gap:18px;
          animation:mkFadeUp 0.22s ease;
        }
        .mk-contact-title { font-family:'Cormorant Garamond',serif; font-size:24px; font-weight:700; color:var(--cream); }
        .mk-contact-row { display:flex; align-items:center; gap:12px; padding:12px; background:var(--bg3); border-radius:10px; }
        .mk-contact-icon { font-size:20px; }
        .mk-contact-lbl { font-size:11px; color:var(--muted); }
        .mk-contact-val { font-size:14px; font-weight:600; color:var(--cream); }
        .mk-contact-phone {
          font-family:'JetBrains Mono',monospace; font-size:18px; font-weight:700;
          color:var(--green); text-align:center; letter-spacing:0.1em;
          padding:14px; background:var(--glo); border:1px solid var(--border2);
          border-radius:12px;
        }

        /* Confirm */
        .mk-confirm-box { background:var(--bg2); border:1px solid rgba(224,92,92,0.3); border-radius:18px; padding:28px; max-width:360px; width:100%; display:flex; flex-direction:column; gap:16px; animation:mkFadeUp 0.22s ease; }
        .mk-confirm-title { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:700; color:var(--red); }
        .mk-confirm-desc { font-size:14px; color:var(--muted); line-height:1.6; }
        .mk-confirm-actions { display:flex; gap:10px; }

        @media(max-width:640px) { .mk-form-row { grid-template-columns:1fr; } .mk-my-summary { grid-template-columns:1fr 1fr; } }
      `}</style>

      {/* ── Header ── */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Marketplace</h1>
          <p className="view-sub">Buy and sell crops directly with other farmers.</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div className="mk-header-stats">
            <div className="mk-stat-pill">🏪 <strong>{activeCount}</strong> active listings</div>
            <div className="mk-stat-pill">👤 <strong>{myListings.filter(l=>l.status==="active").length}</strong> yours</div>
          </div>
          <button className="action-btn green" onClick={openAdd}>+ New Listing</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div className="mk-tabs">
          <button className={`mk-tab ${activeTab==="browse"?"active":""}`} onClick={() => setActiveTab("browse")}>
            🏪 Browse All ({listings.filter(l=>l.status==="active").length})
          </button>
          <button className={`mk-tab ${activeTab==="my"?"active":""}`} onClick={() => setActiveTab("my")}>
            👤 My Listings ({myListings.length})
          </button>
        </div>
      </div>

      {/* ── My listings summary ── */}
      {activeTab==="my" && (
        <div className="mk-my-summary">
          {[
            {label:"Active",value:myListings.filter(l=>l.status==="active").length,color:"var(--green)"},
            {label:"Sold",  value:myListings.filter(l=>l.status==="sold").length,  color:"var(--muted)"},
            {label:"Expired",value:myListings.filter(l=>l.status==="expired").length,color:"var(--amber)"},
          ].map(s=>(
            <div key={s.label} className="mk-my-stat">
              <div className="mk-my-stat-val" style={{color:s.color}}>{s.value}</div>
              <div className="mk-my-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters (browse only) ── */}
      {activeTab==="browse" && (
        <>
          <div className="mk-toolbar">
            <div className="mk-search-wrap">
              <input
                className="mk-search-input"
                placeholder="Search crops, sellers, locations…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleSearch()}
              />
              <button className="mk-search-btn" onClick={handleSearch}>🔍</button>
            </div>
            <select className="mk-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="mk-cats">
            {CATEGORIES.map(cat=>(
              <button
                key={cat}
                className={`mk-cat-chip ${category===cat?"active":""}`}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{background:"var(--rlo)",border:"1px solid rgba(224,92,92,0.25)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"var(--red)",display:"flex",gap:8}}>
          ⚠️ {error}
          <button onClick={fetchListings} style={{marginLeft:"auto",background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>Retry</button>
        </div>
      )}

      {/* ── Listing grid ── */}
      <div className="mk-grid">
        {loading ? (
          Array(6).fill(0).map((_,i) => <Skeleton key={i} />)
        ) : displayListings.length===0 ? (
          <div className="mk-empty">
            <div className="mk-empty-icon">{activeTab==="my"?"📋":"🏪"}</div>
            <div className="mk-empty-title">
              {activeTab==="my" ? "No listings yet" : "No listings found"}
            </div>
            <p className="mk-empty-sub">
              {activeTab==="my"
                ? "Create your first listing to start selling your crops to other farmers."
                : search ? `No results for "${search}". Try a different search.` : "No active listings in this category yet. Be the first to list!"}
            </p>
            {activeTab==="my" && <button className="action-btn green" onClick={openAdd}>+ Create Listing</button>}
          </div>
        ) : (
          displayListings.map((listing, i) => (
            <div key={listing._id} style={{animationDelay:`${i*0.04}s`}}>
              <ListingCard
                listing={listing}
                onEdit={openEdit}
                onDelete={setDeleteId}
                onContact={setContactListing}
                currentUserId={currentUserId}
              />
              {/* Mark as sold button for my active listings */}
              {activeTab==="my" && listing.status==="active" && listing.user===currentUserId && (
                <button
                  className="action-btn"
                  style={{width:"100%",marginTop:6,fontSize:12,padding:"7px 0"}}
                  onClick={() => markSold(listing._id)}
                >
                  ✓ Mark as Sold
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="mk-overlay" onClick={() => setModalOpen(false)}>
          <div className="mk-modal" onClick={e => e.stopPropagation()}>
            <div className="mk-modal-header">
              <div className="mk-modal-title">{editTarget ? "Edit Listing" : "New Listing"}</div>
              <button className="mk-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            {/* Link from My Crops */}
            {!editTarget && myCrops.length>0 && (
              <div className="mk-crop-link-box">
                <div className="mk-crop-link-title">🌾 Quick fill from My Crops</div>
                <div className="mk-crop-chips">
                  {myCrops.map(c=>(
                    <button
                      key={c._id}
                      className={`mk-crop-chip ${form.linkedCropId===c._id?"linked":""}`}
                      onClick={() => handleCropLink(c._id)}
                    >
                      {c.name} — {c.field}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form className="mk-form" onSubmit={handleSave}>
              {formError && <div className="mk-form-error">⚠️ {formError}</div>}

              <div className="mk-form-row">
                <div className="mk-form-group">
                  <label className="mk-label">Crop Name *</label>
                  <input className="mk-input" placeholder="e.g. Wheat" value={form.cropName}
                    onChange={e => setForm({...form,cropName:e.target.value})} required />
                </div>
                <div className="mk-form-group">
                  <label className="mk-label">Category</label>
                  <select className="mk-select-input" value={form.category}
                    onChange={e => setForm({...form,category:e.target.value})}>
                    {CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="mk-form-row">
                <div className="mk-form-group">
                  <label className="mk-label">Quantity *</label>
                  <input className="mk-input" type="number" placeholder="e.g. 50" min="0"
                    value={form.quantity} onChange={e => setForm({...form,quantity:e.target.value})} required />
                </div>
                <div className="mk-form-group">
                  <label className="mk-label">Unit</label>
                  <select className="mk-select-input" value={form.unit}
                    onChange={e => setForm({...form,unit:e.target.value})}>
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="mk-form-row">
                <div className="mk-form-group">
                  <label className="mk-label">Price per {form.unit} (₹) *</label>
                  <input className="mk-input" type="number" placeholder="e.g. 2500" min="0"
                    value={form.pricePerUnit} onChange={e => setForm({...form,pricePerUnit:e.target.value})} required />
                </div>
                <div className="mk-form-group">
                  <label className="mk-label">Harvest Date</label>
                  <input className="mk-input" type="date" value={form.harvestDate}
                    onChange={e => setForm({...form,harvestDate:e.target.value})} />
                </div>
              </div>

              <div className="mk-form-group full">
                <label className="mk-label">Description</label>
                <textarea className="mk-textarea" placeholder="Quality, variety, storage details, delivery options…"
                  value={form.description} onChange={e => setForm({...form,description:e.target.value})} />
              </div>

              <div className="mk-form-row">
                <div className="mk-form-group">
                  <label className="mk-label">Contact Phone</label>
                  <input className="mk-input" placeholder="+91 98765 43210" value={form.sellerPhone}
                    onChange={e => setForm({...form,sellerPhone:e.target.value})} />
                </div>
                <div className="mk-form-group">
                  <label className="mk-label">Location</label>
                  <input className="mk-input" placeholder="e.g. Indore, MP" value={form.sellerLocation}
                    onChange={e => setForm({...form,sellerLocation:e.target.value})} />
                </div>
              </div>

              {/* Live price preview */}
              {form.quantity && form.pricePerUnit && (
                <div style={{background:"var(--glo)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"var(--green)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Total value estimate</span>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700}}>
                    ₹{(Number(form.quantity)*Number(form.pricePerUnit)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="mk-modal-actions">
                <button type="button" className="action-btn" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="action-btn green" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Post Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Contact Modal ── */}
      {contactListing && (
        <div className="mk-overlay" onClick={() => setContactListing(null)}>
          <div className="mk-contact-box" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div className="mk-contact-title">Contact Seller</div>
              <button className="mk-modal-close" onClick={() => setContactListing(null)}>✕</button>
            </div>

            <div className="mk-contact-row">
              <span className="mk-contact-icon">{CATEGORY_ICONS[contactListing.category]||"📦"}</span>
              <div>
                <div className="mk-contact-lbl">Listing</div>
                <div className="mk-contact-val">{contactListing.cropName} · {contactListing.quantity} {contactListing.unit} @ {fmtPrice(contactListing.pricePerUnit)}/{contactListing.unit}</div>
              </div>
            </div>

            <div className="mk-contact-row">
              <span className="mk-contact-icon">👤</span>
              <div>
                <div className="mk-contact-lbl">Seller</div>
                <div className="mk-contact-val">{contactListing.sellerName}</div>
                {contactListing.sellerLocation && <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>📍 {contactListing.sellerLocation}</div>}
              </div>
            </div>

            {contactListing.sellerPhone ? (
              <>
                <div className="mk-contact-phone">📞 {contactListing.sellerPhone}</div>
                <a
                  href={`tel:${contactListing.sellerPhone.replace(/\s/g,"")}`}
                  className="action-btn green"
                  style={{textAlign:"center",textDecoration:"none",padding:"11px 0",fontSize:14}}
                >
                  Call Now
                </a>
                <a
                  href={`https://wa.me/91${contactListing.sellerPhone.replace(/\D/g,"").slice(-10)}?text=${encodeURIComponent(`Hi, I'm interested in your ${contactListing.cropName} listing on Farmify AI (${contactListing.quantity} ${contactListing.unit} @ ₹${contactListing.pricePerUnit}/${contactListing.unit}).`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="action-btn"
                  style={{textAlign:"center",textDecoration:"none",padding:"11px 0",fontSize:14,display:"block"}}
                >
                  💬 WhatsApp
                </a>
              </>
            ) : (
              <div style={{background:"var(--alo)",border:"1px solid rgba(232,162,69,0.2)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"var(--amber)"}}>
                ⚠️ Seller has not provided a contact number.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="mk-overlay" onClick={() => setDeleteId(null)}>
          <div className="mk-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="mk-confirm-title">Delete Listing?</div>
            <p className="mk-confirm-desc">
              This will permanently remove <strong style={{color:"var(--cream)"}}>
                {listings.find(l=>l._id===deleteId)?.cropName || myListings.find(l=>l._id===deleteId)?.cropName}
              </strong> from the marketplace.
            </p>
            <div className="mk-confirm-actions">
              <button className="action-btn" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
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