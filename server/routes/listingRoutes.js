import express from "express";
import {
  getAllListings,
  getMyListings,
  getMyCropsForListing,
  createListing,
  updateListing,
  deleteListing,
} from "../controllers/listingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/",          getAllListings);
router.get("/my",        getMyListings);
router.get("/my-crops",  getMyCropsForListing);
router.post("/",         createListing);
router.put("/:id",       updateListing);
router.delete("/:id",    deleteListing);

export default router;