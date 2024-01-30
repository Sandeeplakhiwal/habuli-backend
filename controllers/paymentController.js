import { catchAsyncError } from "../middleware/catchAsyncError.js";
import Razorpay from "razorpay";

export const processPayment = catchAsyncError(async (req, res, next) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });
  const options = {
    amount: req.body.totalAmount * 100,
    currency: "INR",
    receipt: "order_receipt_11",
  };
  const order = await razorpay.orders.create(options);
  console.log("order", order);
  return res.status(200).json({ success: true, order });
});

export const sendRazorpayApiKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    razorpay_key: process.env.RAZORPAY_API_KEY,
  });
});
