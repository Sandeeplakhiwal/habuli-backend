import express from "express";
import { isAuthenticated } from "../middleware/auth.js";
import {
  processPayment,
  sendRazorpayApiKey,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/payment/process", isAuthenticated, processPayment);

router.get("/razorpayapikey", isAuthenticated, sendRazorpayApiKey);

export default router;
