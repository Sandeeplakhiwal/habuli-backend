import express from "express";
import {
  addShippingInfo,
  deleteShippingInfo,
  getShippingInfo,
} from "../controllers/shippingInfoController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/shippinginfo/add", isAuthenticated, addShippingInfo);

router.get("/shippinginfo", isAuthenticated, getShippingInfo);

router.delete("/shippinginfo/:id", isAuthenticated, deleteShippingInfo);

export default router;
