import express from "express";
import {
  check,
  deleteOrder,
  getAllOrders,
  getCartProductsAndPrice,
  getSingleOrder,
  myOrders,
  newOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authoriseAdmin, isAuthenticated } from "../middleware/auth.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";

const router = express.Router();

router.post("/order/new", isAuthenticated, newOrder);
router.get("/order", isAuthenticated, getSingleOrder);
router.get("/orders", isAuthenticated, myOrders);

// Get All Orders Route --Admin
router.get("/admin/orders", isAuthenticated, authoriseAdmin, getAllOrders);

// Update Order Status Route --Admin
router.put(
  "/admin/order/:id",
  isAuthenticated,
  authoriseAdmin,
  updateOrderStatus
);

// Delete Order Route --Admin
router.delete("/admin/order/:id", isAuthenticated, authoriseAdmin, deleteOrder);

// Check
router.get("/check/:id", check);

router.get("/cartitems", getCartProductsAndPrice);

export default router;
