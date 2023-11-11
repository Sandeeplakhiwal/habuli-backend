import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "../utils/errorhandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new ErrorHandler("Not Logged In!", 401));
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded._id);
  next();
});

export const authoriseAdmin = (req, res, next) => {
  if (req.user.role === "User")
    return next(
      new ErrorHandler(
        `${req.user.role} is not allowed to access this resource`,
        403
      )
    );
  next();
};
