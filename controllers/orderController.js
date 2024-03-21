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
  const orders = await Order.find({ user: req.user._id }).populate(
    "orderItems.product"
  );
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

// Get CartItems
// Assuming catchAsyncError is a middleware for handling async errors
export const getCartProductsAndPrice = catchAsyncError(
  async (req, res, next) => {
    try {
      let cartItems = req.query.items;
      let productIds = [];

      // Check if cartItems is provided
      if (!cartItems) {
        return res.status(400).json({
          success: false,
          message: "CartItems are required",
        });
      }

      // Parse cartItems
      cartItems = JSON.parse(cartItems);

      // Extract productIds from cartItems
      cartItems.forEach((item) => {
        if (item._id) {
          productIds.push(item._id);
        }
      });

      // Check if productIds are present
      if (!productIds.length) {
        return res.status(400).json({
          success: false,
          message: "Valid Product IDs are required in CartItems",
        });
      }

      // Fetch products based on productIds
      const products = await Product.find({
        _id: { $in: productIds },
      }).populate("user");

      // Check if products are found
      if (!products || products.length === 0) {
        return next(new ErrorHandler("Products not found", 404));
      }

      // Calculate prices
      const getItemQuantity = (id) => {
        const item = cartItems.find(
          (item) => item._id.toString() === id.toString()
        );
        return item?.quantity || 1;
      };

      const itemsPrice = Math.ceil(
        products.reduce(
          (total, product) =>
            total + product.price * getItemQuantity(product._id),
          0
        )
      );

      const taxPrice = Math.ceil(
        products.reduce(
          (total, product) =>
            total + product.price * getItemQuantity(product._id) * 0.05,
          0
        )
      );

      const shippingCharges = Math.ceil(
        products.reduce(
          (total, product) => total + (product.price > 1000 ? 0 : 200),
          0
        )
      );

      const totalAmount = Math.ceil(itemsPrice + taxPrice + shippingCharges);

      return res.status(200).json({
        success: true,
        products,
        prices: {
          itemsPrice,
          taxPrice,
          shippingCharges,
          totalAmount,
        },
      });
    } catch (error) {
      // Handle any asynchronous errors
      next(error);
    }
  }
);
