import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";

async function updateStock(id, quantity, next) {
  console.log(id.toString());
  const product = await Product.findById(id);
  if (!product) {
    return next(
      new ErrorHandler("Product not found with included id of order item", 404)
    );
  }
  console.log(product);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

// Create New Order
export const newOrder = catchAsyncError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });
  res.status(201).json({
    success: true,
    message: "Order created successfully.",
    order,
  });
});

// Get Single Order
export const getSingleOrder = catchAsyncError(async (req, res, next) => {
  const { orderId } = req.query;
  const order = await Order.findById(orderId).populate("user", "name");
  if (!order) {
    return next(new ErrorHandler("Order not found!", 404));
  }
  return res.status(200).json({
    success: true,
    order,
  });
});

// Get Logged In User Orders
export const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  return res.status(200).json({
    success: true,
    orders,
  });
});

// Get All Orders --Admin
export const getAllOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find();
  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });
  return res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// Update Order Status --Admin
export const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this Id", 404));
  }
  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("You have already delivered this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity, next);
    });
  }

  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({
    validateBeforeSave: false,
  });

  return res.status(200).json({
    success: true,
    message: "Order status updated",
  });
});

// Delete Order --Admin
export const deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found!", 404));
  }
  await order.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// Check
export const check = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  console.log("Id", id);
  const product = await Product.findById(id);
  console.log("Product", product);
  return res.status(200).json({
    success: true,
    product,
  });
});
