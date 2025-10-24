import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const opts = {
      // Remove deprecated options
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
    };

    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI is not set. Skipping MongoDB connection (running in degraded mode).');
      return false;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("connected", () => {
      console.log("Mongoose default connection is open");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose default connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose default connection disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("Mongoose default connection disconnected through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.log(`Error Connecting to MongoDB: ${error.message}`);
    console.log('Continuing without MongoDB connection. Fix environment/network to restore DB features.');
    // Do not exit the process — allow app to run in degraded mode for frontend/dev work.
    return false;
  }
  return true;
};
