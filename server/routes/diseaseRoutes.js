import express from "express";
import multer from "multer";
import { detectDisease } from "../controllers/diseaseController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.post("/detect", protect, upload.single("image"), detectDisease);

export default router;