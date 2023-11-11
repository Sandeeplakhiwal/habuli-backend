import mongoose from "mongoose";
import Validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const schema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [3, "Name should have at least three characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [Validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    maxLength: [30, "Password cannot exceed 50 characters"],
    minLength: [6, "Password should have at least 8 characters"],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: "User",
  },
  resetPasswordTokenString: String,
  resetPasswordExpire: Date,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// JWT Token
schema.methods.generateToken = async function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare password when login or Password reseting etc.
schema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Gernerate Password Reset Tokken
schema.methods.getResetPasswordToken = async function (user) {
  // Generating Token
  let token = crypto.randomBytes(20).toString("hex");

  // Hashing Token
  this.resetPasswordTokenString = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Set Token Expire Time
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return token;
};

export const User = new mongoose.model("User", schema);
