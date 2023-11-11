import express from "express";
import {
  deleteUserProfile,
  forgotPassword,
  getAllUsers,
  getSingleUser,
  getUserDetail,
  login,
  logout,
  register,
  resetPassword,
  updateProfileRole,
  updateUserPassword,
  updateUserProfile,
} from "../controllers/userController.js";
import { authoriseAdmin, isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// User registration route
router.post("/register", register);

// User login route
router.post("/login", login);

// Forgot Password
router.post("/password/forgot", forgotPassword);

// Reset Password
router.put("/password/reset/:token", resetPassword);

// User logout route
router.get("/logout", logout);

// Get User Profile Details
router.get("/me", isAuthenticated, getUserDetail);

// Update User Password
router.put("/password/update", isAuthenticated, updateUserPassword);

// Update User Profile
router.put("/profile/update", isAuthenticated, updateUserProfile);

// Get All Users --Admin
router.get("/admin/users", isAuthenticated, authoriseAdmin, getAllUsers);

// Get Single User --Admin
router.get("/admin/user/:id", isAuthenticated, authoriseAdmin, getSingleUser);

// Update Profile Role --Admin
router.put(
  "/admin/user/:id",
  isAuthenticated,
  authoriseAdmin,
  updateProfileRole
);

// Delete User Account --Admin
router.delete(
  "/admin/user/:id",
  isAuthenticated,
  authoriseAdmin,
  deleteUserProfile
);

export default router;
