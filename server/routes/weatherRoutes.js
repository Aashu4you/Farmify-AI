import express from "express";
import { getWeather } from "../controllers/weatherController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/weather?lat=28.6&lon=77.2
// GET /api/weather?city=Indore
router.get("/", protect, getWeather);

export default router;