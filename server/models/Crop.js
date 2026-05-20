import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    field: {
      type: String,
      required: [true, "Field name is required"],
      trim: true,
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },
    // ── Growth tracking ──────────────────────────────────────────────────────
    plantingDate: {
      type: Date,
      required: [true, "Planting date is required"],
      default: Date.now,
    },
    totalGrowthDays: {
      type: Number,
      required: [true, "Total growth days is required"],
      default: 120,
      min: 1,
    },
    // ── Health ───────────────────────────────────────────────────────────────
    baseHealth: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    health: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    lastHealthUpdate: {
      type: Date,
      default: Date.now,
    },
    // ── Extra info ───────────────────────────────────────────────────────────
    soilType: {
      type: String,
      enum: ["Black", "Red", "Loamy", "Sandy", "Clay", "Alluvial", "Other"],
      default: "Loamy",
    },
    irrigationType: {
      type: String,
      enum: ["Drip", "Sprinkler", "Flood", "Rain-fed", "Other"],
      default: "Drip",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Stage definitions ─────────────────────────────────────────────────────────
export const GROWTH_STAGES = [
  { name: "Germination", from: 0,  to: 8   },
  { name: "Seedling",    from: 8,  to: 18  },
  { name: "Vegetative",  from: 18, to: 35  },
  { name: "Tillering",   from: 35, to: 50  },
  { name: "Flowering",   from: 50, to: 65  },
  { name: "Pod Fill",    from: 65, to: 78  },
  { name: "Maturity",    from: 78, to: 92  },
  { name: "Harvesting",  from: 92, to: 100 },
];

export const getStageFromProgress = (progressPct) => {
  const pct = Math.min(100, Math.max(0, progressPct));
  for (const stage of GROWTH_STAGES) {
    if (pct >= stage.from && pct < stage.to) return stage.name;
  }
  return "Harvesting";
};

// ── Virtuals ──────────────────────────────────────────────────────────────────
cropSchema.virtual("daysElapsed").get(function () {
  const now = new Date();
  const planted = new Date(this.plantingDate);
  return Math.max(0, Math.floor((now - planted) / (1000 * 60 * 60 * 24)));
});

cropSchema.virtual("daysLeft").get(function () {
  return Math.max(0, this.totalGrowthDays - this.daysElapsed);
});

cropSchema.virtual("progressPct").get(function () {
  return Math.min(100, Math.round((this.daysElapsed / this.totalGrowthDays) * 100));
});

cropSchema.virtual("stage").get(function () {
  return getStageFromProgress(this.progressPct);
});

cropSchema.virtual("status").get(function () {
  if (this.health >= 80) return "good";
  if (this.health >= 60) return "warn";
  return "bad";
});

cropSchema.set("toJSON",   { virtuals: true });
cropSchema.set("toObject", { virtuals: true });

const Crop = mongoose.model("Crop", cropSchema);
export default Crop;