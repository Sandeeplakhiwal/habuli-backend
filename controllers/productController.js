import { Product } from "../models/productModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import { catchAsyncError } from "../middleware/catchAsyncError.js";
import { ApiFeatures } from "../utils/apiFeatures.js";
import cloudinary from "cloudinary";
import { createWriteStream } from "fs";
import os from "os";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

// Create product
export const createProduct = catchAsyncError(async (req, res, next) => {
  const { name, description, price, category, stock } = req.body;
  if (!name || !description || !price || !category || !stock) {
    return res.status(400).json({
      success: false,
      message: "Please fill all required fields",
    });
  }

  if (req.files.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Please add product images" });
  }

  const uploadPromises = req.files.map(async (file) => {
    // Create a Readable stream from the Buffer
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null); // Signals the end of the stream

    // Create a temporary file path
    const tempFilePath = path.join(os.tmpdir(), `${file.originalname}`);

    // Create a WriteStream to write the Buffer data to the temporary file
    const writeStream = fs.createWriteStream(tempFilePath);
    bufferStream.pipe(writeStream);

    // Wait for the stream to finish writing to the file
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload the temporary file to Cloudinary
    const cloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: "products",
    });

    // Delete the temporary file after upload
    fs.unlinkSync(tempFilePath);

    return {
      public_id: cloud.public_id,
      url: cloud.url,
    };
  });

  const uploadedImages = await Promise.all(uploadPromises);

  const productData = {
    name,
    description,
    images: uploadedImages,
    price,
    category,
    stock,
    user: req.user._id,
  };
  const product = await Product.create(productData);
  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

export const testProduct = catchAsyncError(async (req, res, next) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  const fileData = req.file.buffer;
  const cloud = await cloudinary.v2.uploader.upload(fileData, {
    folder: "products",
  });
  res.status(200).json({
    success: true,
    cloud: cloud.public_id,
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
    productCount: products.length,
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

  res.status(200).json({ product });
});

// Update Product -- Admin
export const updateProduct = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  let product = await Product.findById(productId);
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

  let ratingsSum = 0;
  product.reviews.forEach((rev) => {
    ratingsSum += rev.rating;
  });

  product.ratings = ratingsSum / product.reviews.length;

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
  await Product.findByIdAndUpdate(
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
