import express from "express";
import {
  getCrops,
  addCrop,
  updateCrop,
  deleteCrop,
} from "../controllers/cropController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

router.get("/", getCrops);
router.post("/", addCrop);
router.put("/:id", updateCrop);
router.delete("/:id", deleteCrop);

export default router;