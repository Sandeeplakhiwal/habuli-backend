import app from "./app.js";
import { connectDB } from "./config/database.js";

// Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log("Error", err.message);
  console.log("Shutting down the server due to uncaught exception");
  process.exit(1);
});

// Connecting to database
connectDB();

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log("Error:", err.message);
  console.log("Shutting down the server due to Unhandled Promise Rejection");
  server.close(() => {
    process.exit(1);
  });
});
