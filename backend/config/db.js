const mongoose = require("mongoose");

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error("ERROR: MONGO_URI environment variable is missing on Render!");
        console.error("Please add MONGO_URI in your Render Dashboard -> Environment Variables.");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 8000
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        console.error("Troubleshooting: Check if 0.0.0.0/0 is added in MongoDB Atlas -> Network Access.");
    }
};

module.exports = connectDB;