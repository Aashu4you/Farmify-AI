import express from "express";
import {
  getCrops,
  addCrop,
  updateCrop,
  deleteCrop,
  getCropTimeline,
} from "../controllers/cropController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/",              getCrops);
router.get("/:id/timeline",  getCropTimeline);
router.post("/",             addCrop);
router.put("/:id",           updateCrop);
router.delete("/:id",        deleteCrop);

export default router;