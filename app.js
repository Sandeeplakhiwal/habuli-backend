import express from "express";
import dotenv from "dotenv";
import ErrorMiddleware from "./middleware/error.js";
import cookieParser from "cookie-parser";
import Cors from "cors";

const app = express();

dotenv.config({
  path: "./config/.env",
});

// Using Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  Cors({
    origin: "https://habuli.vercel.app",
    // origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/", (req, res) => {
  res.send("Sandeep Lakhiwal");
});

// Importing routes
import product from "./routes/productRoutes.js";
import user from "./routes/userRoutes.js";
import order from "./routes/orderRoute.js";
import payment from "./routes/paymentRoutes.js";
import shippingInfo from "./routes/shippingInfoRoutes.js";

// Using routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", shippingInfo);
app.use("/api/v1", payment);

// Middleware for errors
app.use(ErrorMiddleware);

export default app;
