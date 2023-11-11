import mongoose from "mongoose";

// const model
export const connectDB = async () => {
  const { connection } = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`MongoDB connected with ${connection.host}`);
};
