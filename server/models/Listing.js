import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Seller info (denormalized for quick display)
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    sellerLocation: {
      type: String,
      trim: true,
      default: "",
    },
    // Listing details
    cropName: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Grains", "Vegetables", "Fruits", "Pulses", "Oilseeds", "Spices", "Flowers", "Other"],
      default: "Grains",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne", "bag", "dozen", "piece"],
      default: "quintal",
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Linked crop (optional)
    linkedCropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      default: null,
    },
    // Status
    status: {
      type: String,
      enum: ["active", "sold", "expired"],
      default: "active",
    },
    // Harvest date for freshness indicator
    harvestDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;