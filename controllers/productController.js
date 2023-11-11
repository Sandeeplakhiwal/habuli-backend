import { Product } from "../models/productModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { ApiFeatures } from "../utils/apiFeatures.js";
import { User } from "../models/userModel.js";

// Create product
export const createProduct = catchAsyncError(async (req, res, next) => {
  const data = req.body;
  data.user = req.user._id;
  const product = await Product.create(data);
  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

// Get all products
export const getAllProducts = catchAsyncError(async (req, res, next) => {
  const resultPerPage = 5;
  const productCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(Product.find(), req.query);
  apiFeature.search().filter().pagination(resultPerPage);

  const products = await apiFeature.query;

  res.status(200).json({
    success: true,
    productCount,
    products,
  });
});

// Get product details
export const getProductDetails = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin
export const updateProduct = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  let product = await Product.findById(productId);
  console.log(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  product = await Product.findByIdAndUpdate(productId, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// Delete Product
export const deleteProduct = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  await product.deleteOne();
  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Create New Review or Update Review
export const addOrUpdateReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  if (!rating) {
    return next(
      new ErrorHandler("Please rate our product between 1 to 5 star", 400)
    );
  }
  if (!comment) {
    return next(new ErrorHandler("Review comment is required", 400));
  }
  if (!productId) {
    return next(new ErrorHandler("Product id is required", 400));
  }
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };
  let product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
  }

  let avg = 0;

  product.ratings =
    product.reviews.forEach((rev) => {
      avg += rev.rating;
    }) / product.reviews.length;

  product.numOfReviews = product.reviews.length;

  await product.save({ validateBeforeSave: false });

  return res.status(201).json({
    success: true,
    message: "Review added/updated successfully",
  });
});

// Get All Reviews Of Product
export const getProductAllReviews = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  if (!productId) return next(new ErrorHandler("ProductId is required", 400));
  const product = await Product.findById(productId);
  if (!product)
    return next(
      new ErrorHandler(`Product does not exist with this id: ${productId}`, 404)
    );
  return res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete user's own review
export const deleteMyReview = catchAsyncError(async (req, res, next) => {
  const user = req.user;
  const productId = req.params.id;
  if (!productId) return next(new ErrorHandler("ProductId is required", 400));
  const product = await Product.findById(productId);
  const reviews = product.reviews.filter(
    (rev) => rev.user.toString() !== user._id.toString()
  );
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });
  let ratings = 0;
  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }
  const numOfReviews = reviews.length;
  await product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  return res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});
