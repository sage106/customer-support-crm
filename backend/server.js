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

// API Routes
app.use("/api/tickets", ticketRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root welcome
app.get("/", (req, res) => {
    res.send("Customer Support CRM API is running!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});