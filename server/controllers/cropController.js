import Crop from "../models/Crop.js";

// ── GET /api/crops — get all crops for logged-in user
export const getCrops = async (req, res) => {
  try {
    // req.user.id comes from JWT payload { id: user._id }
    // If your generateToken uses _id, change req.user.id → req.user._id
    const crops = await Crop.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(crops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/crops — add a new crop
export const addCrop = async (req, res) => {
  try {
    const {
      name,
      field,
      area,
      stage,
      health,
      daysLeft,
      soilType,
      irrigationType,
      notes,
    } = req.body;

    if (!name || !field || !area || !stage || !daysLeft) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const crop = await Crop.create({
      user: req.user.id, // scope to logged-in user
      name,
      field,
      area,
      stage,
      health: health ?? 85,
      daysLeft,
      soilType,
      irrigationType,
      notes,
    });

    res.status(201).json(crop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/crops/:id — update a crop
export const updateCrop = async (req, res) => {
  try {
    // findOne with user check so users can't edit each other's crops
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found or not authorised" });
    }

    const fields = [
      "name", "field", "area", "stage", "health",
      "daysLeft", "soilType", "irrigationType", "notes",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) crop[f] = req.body[f];
    });

    const updated = await crop.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/crops/:id — delete a crop
export const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found or not authorised" });
    }

    res.status(200).json({ message: "Crop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};