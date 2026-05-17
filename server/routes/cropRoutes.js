import express from "express";
import { addCrop } from "../controllers/cropController.js";

const router = express.Router();

router.post("/add", addCrop);

export default router;