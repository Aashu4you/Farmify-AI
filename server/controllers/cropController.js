import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import Crop, { GROWTH_STAGES, getStageFromProgress } from "../models/Crop.js";

// ── Health decay: -1 per day without tasks ────────────────────────────────────
const applyHealthDecay = async (crop) => {
  const now = new Date();
  const lastUpdate = new Date(crop.lastHealthUpdate || crop.createdAt);
  const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));

  if (daysSinceUpdate >= 1) {
    const decay = daysSinceUpdate * 1; // -1 per day
    crop.health = Math.max(0, crop.health - decay);
    crop.lastHealthUpdate = now;
    await crop.save();
  }
  return crop;
};

// ── Build growth timeline for a crop ──────────────────────────────────────────
const buildTimeline = (crop) => {
  const plantingDate   = new Date(crop.plantingDate);
  const totalDays      = crop.totalGrowthDays;
  const daysElapsed    = crop.daysElapsed;
  const progressPct    = crop.progressPct;

  return GROWTH_STAGES.map((stage) => {
    const stageStartDay = Math.round((stage.from / 100) * totalDays);
    const stageEndDay   = Math.round((stage.to   / 100) * totalDays);

    const startDate = new Date(plantingDate);
    startDate.setDate(startDate.getDate() + stageStartDay);

    const endDate = new Date(plantingDate);
    endDate.setDate(endDate.getDate() + stageEndDay);

    const isActive    = progressPct >= stage.from && progressPct < stage.to;
    const isCompleted = progressPct >= stage.to;
    const isUpcoming  = progressPct < stage.from;

    const daysUntilStart = stageStartDay - daysElapsed;

    return {
      name:          stage.name,
      from:          stage.from,
      to:            stage.to,
      startDate:     startDate.toISOString(),
      endDate:       endDate.toISOString(),
      isActive,
      isCompleted,
      isUpcoming,
      daysUntilStart: isUpcoming ? daysUntilStart : 0,
    };
  });
};

// ── Next recommended action based on stage ────────────────────────────────────
const getNextAction = (stage, health, daysLeft) => {
  if (daysLeft <= 7)  return { action: "Prepare for harvest", icon: "🌾", urgency: "high" };
  if (health < 60)    return { action: "Urgent: Apply disease/pest treatment", icon: "🚨", urgency: "high" };
  if (health < 75)    return { action: "Apply fungicide and monitor closely", icon: "💊", urgency: "medium" };

  const actions = {
    "Germination":  { action: "Ensure consistent soil moisture for germination", icon: "💧", urgency: "medium" },
    "Seedling":     { action: "Light irrigation and watch for damping off", icon: "🌱", urgency: "medium" },
    "Vegetative":   { action: "Apply nitrogen-rich fertilizer for leaf growth", icon: "🌿", urgency: "medium" },
    "Tillering":    { action: "Apply NPK fertilizer and ensure good drainage", icon: "🌿", urgency: "medium" },
    "Flowering":    { action: "Avoid pesticides during flowering to protect pollinators", icon: "🌸", urgency: "low" },
    "Pod Fill":     { action: "Apply potassium fertilizer to improve pod/grain fill", icon: "🌾", urgency: "medium" },
    "Maturity":     { action: "Reduce irrigation and monitor for harvest readiness", icon: "⏳", urgency: "low" },
    "Harvesting":   { action: "Harvest at optimal moisture content", icon: "🌾", urgency: "high" },
  };

  return actions[stage] || { action: "Monitor crop regularly", icon: "👁️", urgency: "low" };
};

// ── GET /api/crops ─────────────────────────────────────────────────────────────
export const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Apply health decay to each crop
    const updatedCrops = await Promise.all(crops.map(applyHealthDecay));

    res.status(200).json(updatedCrops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/crops/:id/timeline ────────────────────────────────────────────────
export const getCropTimeline = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found" });
    }

    await applyHealthDecay(crop);

    const timeline   = buildTimeline(crop);
    const nextAction = getNextAction(crop.stage, crop.health, crop.daysLeft);

    // Health trend (compare to baseHealth)
    const healthDiff = crop.health - crop.baseHealth;
    const healthTrend = healthDiff > 2 ? "improving" : healthDiff < -5 ? "declining" : "stable";

    res.status(200).json({
      crop: {
        _id:            crop._id,
        name:           crop.name,
        field:          crop.field,
        area:           crop.area,
        plantingDate:   crop.plantingDate,
        totalGrowthDays: crop.totalGrowthDays,
        health:         crop.health,
        baseHealth:     crop.baseHealth,
        daysElapsed:    crop.daysElapsed,
        daysLeft:       crop.daysLeft,
        progressPct:    crop.progressPct,
        stage:          crop.stage,
        status:         crop.status,
        soilType:       crop.soilType,
        irrigationType: crop.irrigationType,
        notes:          crop.notes,
      },
      timeline,
      nextAction,
      healthTrend,
      harvestDate: new Date(
        new Date(crop.plantingDate).getTime() + crop.totalGrowthDays * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/crops ────────────────────────────────────────────────────────────
export const addCrop = async (req, res) => {
  try {
    const {
      name, field, area,
      plantingDate, totalGrowthDays,
      health, soilType, irrigationType, notes,
    } = req.body;

    if (!name || !field || !area || !plantingDate || !totalGrowthDays) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const startHealth = health ?? 85;

    const crop = await Crop.create({
      user: req.user.id,
      name, field, area,
      plantingDate,
      totalGrowthDays,
      health:           startHealth,
      baseHealth:       startHealth,
      lastHealthUpdate: new Date(),
      soilType, irrigationType, notes,
    });

    res.status(201).json(crop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/crops/:id ─────────────────────────────────────────────────────────
export const updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found or not authorised" });
    }

    const fields = [
      "name", "field", "area",
      "plantingDate", "totalGrowthDays",
      "health", "soilType", "irrigationType", "notes",
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) crop[f] = req.body[f];
    });

    // If health manually updated, reset the decay baseline
    if (req.body.health !== undefined) {
      crop.lastHealthUpdate = new Date();
    }

    const updated = await crop.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/crops/:id ──────────────────────────────────────────────────────
export const deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!crop) {
      return res.status(404).json({ message: "Crop not found or not authorised" });
    }

    res.status(200).json({ message: "Crop deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};