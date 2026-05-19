import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // ── Profile fields ──────────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    farmName: {
      type: String,
      trim: true,
      default: "",
    },
    farmLocation: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      default: "farmer",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;