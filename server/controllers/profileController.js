import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import User from "../models/User.js";
import bcrypt from "bcryptjs";

// ── GET /api/profile ───────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, farmName, farmLocation } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name)         user.name         = name.trim();
    if (phone         !== undefined) user.phone         = phone.trim();
    if (farmName      !== undefined) user.farmName      = farmName.trim();
    if (farmLocation  !== undefined) user.farmLocation  = farmLocation.trim();

    const updated = await user.save();

    res.status(200).json({
      id:           updated._id,
      name:         updated.name,
      email:        updated.email,
      phone:        updated.phone,
      farmName:     updated.farmName,
      farmLocation: updated.farmLocation,
      role:         updated.role,
      createdAt:    updated.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/profile/password ──────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt        = await bcrypt.genSalt(10);
    user.password     = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};