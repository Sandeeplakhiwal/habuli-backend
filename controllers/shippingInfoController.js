import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { ShippingInfoModal } from "../models/shippingInfoModal.js";
import ErrorHandler from "../utils/errorhandler.js";

export const addShippingInfo = catchAsyncError(async (req, res, next) => {
  const { address, city, state, country, pinCode, phoneNo, alternatePhoneNo } =
    req.body;
  if (!address || !city || !country || !pinCode || !phoneNo) {
    return next(new ErrorHandler("Please enter all fields", 400));
  }
  await ShippingInfoModal.create({
    address,
    city,
    state,
    country,
    pinCode,
    phoneNo,
    alternatePhoneNo,
    user: req.user._id,
  });
  return res.status(201).json({
    success: true,
  });
});

export const getShippingInfo = catchAsyncError(async (req, res, next) => {
  const shippingInfo = await ShippingInfoModal.find({ user: req.user._id });
  return res.status(200).json({
    success: true,
    shippingInfo,
  });
});

export const deleteShippingInfo = catchAsyncError(async (req, res, next) => {
  if (!req.params.id) {
    return next(new ErrorHandler("Please provide id", 400));
  }
  const shippingInfo = await ShippingInfoModal.findById(req.params.id);
  if (!shippingInfo) {
    return next(new ErrorHandler("Not found!", 404));
  }

  await shippingInfo.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
});
