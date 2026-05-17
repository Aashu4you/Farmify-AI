import Crop from "../models/Crop.js";

export const addCrop = async (req, res) => {
  try {
    const {
      cropName,
      fieldLocation,
      plantingDate,
    } = req.body;

    const crop = await Crop.create({
      cropName,
      fieldLocation,
      plantingDate,
    });

    res.status(201).json({
      message: "Crop added successfully",
      crop,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};