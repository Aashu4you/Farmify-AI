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
    stage: {
      type: String,
      enum: [
        "Germination",
        "Seedling",
        "Vegetative",
        "Tillering",
        "Flowering",
        "Pod Fill",
        "Boll Dev.",
        "Maturity",
        "Harvesting",
      ],
      required: [true, "Growth stage is required"],
    },
    health: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    daysLeft: {
      type: Number,
      required: [true, "Days to harvest is required"],
      min: 0,
    },
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

// Derive status from health score
cropSchema.virtual("status").get(function () {
  if (this.health >= 80) return "good";
  if (this.health >= 60) return "warn";
  return "bad";
});

cropSchema.set("toJSON", { virtuals: true });
cropSchema.set("toObject", { virtuals: true });

const Crop = mongoose.model("Crop", cropSchema);

export default Crop;