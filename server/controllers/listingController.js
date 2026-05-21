import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import Listing from "../models/Listing.js";
import Crop from "../models/Crop.js";
import User from "../models/User.js";

// ── GET /api/listings — browse all active listings (with filters) ─────────────
export const getAllListings = async (req, res) => {
  try {
    const { category, search, sort = "newest" } = req.query;

    const filter = { status: "active" };
    if (category && category !== "All") filter.category = category;
    if (search) {
      filter.$or = [
        { cropName:      { $regex: search, $options: "i" } },
        { sellerName:    { $regex: search, $options: "i" } },
        { sellerLocation:{ $regex: search, $options: "i" } },
        { description:   { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder =
      sort === "newest"   ? { createdAt: -1 } :
      sort === "oldest"   ? { createdAt:  1 } :
      sort === "price_asc"  ? { pricePerUnit:  1 } :
      sort === "price_desc" ? { pricePerUnit: -1 } :
      { createdAt: -1 };

    const listings = await Listing.find(filter).sort(sortOrder);
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/listings/my — get logged-in user's listings ─────────────────────
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/listings/my-crops — get user's crops for quick listing ───────────
export const getMyCropsForListing = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.id });
    res.status(200).json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/listings — create a new listing ─────────────────────────────────
export const createListing = async (req, res) => {
  try {
    const {
      cropName, category, quantity, unit,
      pricePerUnit, description, sellerPhone,
      sellerLocation, harvestDate, linkedCropId,
    } = req.body;

    if (!cropName || !quantity || !pricePerUnit) {
      return res.status(400).json({ message: "Crop name, quantity and price are required" });
    }

    // Get seller name from user profile
    const user = await User.findById(req.user.id);
    const sellerName = user?.name || "Farmer";

    const listing = await Listing.create({
      user:          req.user.id,
      sellerName,
      sellerPhone:   sellerPhone    || user?.phone    || "",
      sellerLocation:sellerLocation || user?.farmLocation || "",
      cropName, category, quantity, unit,
      pricePerUnit, description,
      harvestDate:   harvestDate || null,
      linkedCropId:  linkedCropId || null,
    });

    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/listings/:id — update listing ────────────────────────────────────
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, user: req.user.id });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not authorised" });
    }

    const fields = [
      "cropName", "category", "quantity", "unit",
      "pricePerUnit", "description", "sellerPhone",
      "sellerLocation", "harvestDate", "status",
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) listing[f] = req.body[f];
    });

    const updated = await listing.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/listings/:id — delete listing ─────────────────────────────────
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found or not authorised" });
    }

    res.status(200).json({ message: "Listing deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};