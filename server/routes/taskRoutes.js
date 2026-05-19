import express from "express";
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  getRecommendations,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/",               getTasks);
router.get("/recommendations", getRecommendations);
router.post("/",              addTask);
router.put("/:id",            updateTask);
router.delete("/:id",         deleteTask);

export default router;