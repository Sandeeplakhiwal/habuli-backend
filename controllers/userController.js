import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";

// Register a user
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please enter all fields", 401));
  }

  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User already exist with this email", 409));
  }

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "demoId",
      url: "demoUrl",
    },
  });

  return sendToken(res, user, "Registered successfully", 201);
});

// Login a user
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  let user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }
  return sendToken(res, user, `Welcome back ${user.name}`, 200);
});

// Logout a user
export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logged out successfully!",
    });
});

// Forgot Password
export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(
      new ErrorHandler("Please enter your email address to reset password", 400)
    );
  const user = await User.findOne({ email });
  if (!user)
    return next(
      new ErrorHandler("No user associated with this email address", 404)
    );
  // Get reset password token
  const resetToken = await user.getResetPasswordToken(user);
  await user.save({ validateBeforeSave: false });
  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/password/reset/${resetToken}`;
  const resetPasswordUrl = `${process.env.FRONTEND}/auth/password/reset/${resetToken}`;
  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then please ignore it`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Reset Habuli Password`,
      message,
    });
    return res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password) {
    return next(new ErrorHandler("Please enter password", 400));
  }
  const resetPasswordTokenString = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordTokenString,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user)
    return next(new ErrorHandler("Token is invalid or has expired!", 409));
  user.password = password;
  user.resetPasswordTokenString = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password changed successfully.",
  });
});

// Get User Detail
export const getUserDetail = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  return res.status(200).json({
    success: true,
    user,
  });
});

// Get User Password
export const updateUserPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please fill all fields"));
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password", 400));
  }
  user.password = newPassword;
  await user.save();
  return res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

// Get User Profile
export const updateUserProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;
  // We will add cloudinary later
  if (!name && !email) {
    return next(new ErrorHandler("Please enter name or email"));
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

// Get all users (admin)
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find();
  if (!users) {
    return res.status(200).json({
      success: true,
      message: "No Users Yet!",
    });
  }
  return res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
export const getSingleUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User doesn't exist with this id: ${req.params.id}`, 404)
    );
  }
  return res.status(200).json({
    success: true,
    user,
  });
});

// Update Profile Role (admin)
export const updateProfileRole = catchAsyncError(async (req, res, next) => {
  const { role } = req.body;
  if (!role) {
    return next(new ErrorHandler("Enter Role"));
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { role },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  await user.save();

  return res.status(200).json({
    success: true,
    message: `Role updated successfully`,
  });
});

// Delete User Profile (admin)
export const deleteUserProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exit with this id: ${req.params.id}`, 404)
    );
  }

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: `${user.name}'s account has deleted successfully`,
  });
});
