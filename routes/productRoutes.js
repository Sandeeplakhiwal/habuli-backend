import express, { Router } from "express";
import {
  addOrUpdateReview,
  createProduct,
  deleteMyReview,
  deleteProduct,
  getAllProducts,
  getProductAllReviews,
  getProductDetails,
  updateProduct,
} from "../controllers/productController.js";
import { authoriseAdmin, isAuthenticated } from "../middleware/auth.js";

const router = Router();

// Create Product --Admin
router.post("/product/new", isAuthenticated, authoriseAdmin, createProduct);

// Get All Products
router.get("/products", getAllProducts);

// Update Product --Admin
router.put("/product/:id", isAuthenticated, authoriseAdmin, updateProduct);

// Delete Product --Admin
router.delete("/product/:id", isAuthenticated, authoriseAdmin, deleteProduct);

// Get Product Details
router.get("/product/:id", getProductDetails);

// Add New Review
router.post("/product/reviews/:id", isAuthenticated, addOrUpdateReview);

// Get Product Reviews
router.get("/product/reviews/:id", getProductAllReviews);

// Delete User Own Product Review
router.delete("/product/reviews/:id", isAuthenticated, deleteMyReview);

export default router;
