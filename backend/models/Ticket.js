const mongoose = require("mongoose");

// Sub-schema for individual notes / agent comments
const noteSchema = new mongoose.Schema(
    {
        noteText: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            default: "Support Agent",
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: true }
);

const ticketSchema = new mongoose.Schema(
    {
        // Human-readable sequential / formatted ID: e.g. TKT-1001
        ticketId: {
            type: String,
            unique: true,
            index: true
        },

        customerName: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },

        customerEmail: {
            type: String,
            required: [true, "Customer email is required"],
            trim: true,
            lowercase: true
        },

        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true
        },

        status: {
            type: String,
            enum: ["Open", "In Progress", "Closed"],
            default: "Open"
        },

        // Standout feature: Urgency & SLA triage matrix
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium"
        },

        // Internal notes and agent collaboration thread
        notes: [noteSchema]
    },
    {
        timestamps: true // Automatically manages createdAt and updatedAt
    }
);

// Pre-save hook: auto-assign sequential/unique ticketId if not provided
ticketSchema.pre("save", async function () {
    if (!this.ticketId) {
        // Find highest existing ticket number or count
        const count = await mongoose.model("Ticket").countDocuments();
        const nextNumber = 1001 + count;
        this.ticketId = `TKT-${nextNumber}`;
    }
});

module.exports = mongoose.model("Ticket", ticketSchema);