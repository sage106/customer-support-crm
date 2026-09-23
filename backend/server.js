require("dotenv").config();

const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
connectDB();

// Support both /api/tickets and /tickets for flexible deployment
app.use("/api/tickets", ticketRoutes);
app.use("/tickets", ticketRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Customer Support CRM API",
        timestamp: new Date().toISOString()
    });
});

// Root welcome
app.get("/", (req, res) => {
    res.status(200).send("Customer Support CRM API is running successfully!");
});

const PORT = process.env.PORT || 5000;

// Bind to 0.0.0.0 for cloud providers like Render / Railway
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});