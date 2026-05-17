import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cropName: {
      type: String,
      required: true,
    },

    fieldLocation: {
      type: String,
      required: true,
    },

    plantingDate: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Growing",
    },
  },
  {
    timestamps: true,
  }
);

const Crop = mongoose.model("Crop", cropSchema);

export default Crop;