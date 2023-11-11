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

const server = app.listen(4000, () => {
  console.log("Server is listening on port 4000");
});

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log("Error:", err.message);
  console.log("Shutting down the server due to Unhandled Promise Rejection");
  server.close(() => {
    process.exit(1);
  });
});
