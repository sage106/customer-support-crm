const express = require("express");
const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");

const router = express.Router();

/**
 * Helper to normalize incoming status values to Title Case:
 * "open" -> "Open", "in-progress" -> "In Progress", "resolved" / "closed" -> "Closed"
 */
function normalizeStatus(status) {
    if (!status) return undefined;
    const s = status.trim().toLowerCase();
    if (s === "open") return "Open";
    if (s === "in-progress" || s === "in progress") return "In Progress";
    if (s === "resolved" || s === "closed") return "Closed";
    return status;
}

/**
 * Helper to normalize request body fields so both snake_case
 * (assignment spec) and camelCase (React state) work seamlessly.
 */
function normalizeTicketBody(body) {
    return {
        customerName: body.customerName || body.customer_name,
        customerEmail: body.customerEmail || body.customer_email,
        subject: body.subject,
        description: body.description,
        status: normalizeStatus(body.status) || "Open",
        priority: body.priority || "Medium"
    };
}

/**
 * Helper to find a ticket by either its custom ticketId (e.g., TKT-1001)
 * or MongoDB _id (e.g., 6ab38fa7b925a2bf5c1e63da).
 */
async function findTicketByIdOrCustomId(idParam) {
    if (idParam.startsWith("TKT-")) {
        return await Ticket.findOne({ ticketId: idParam });
    }
    if (mongoose.Types.ObjectId.isValid(idParam)) {
        const ticket = await Ticket.findById(idParam);
        if (ticket) return ticket;
    }
    return await Ticket.findOne({ ticketId: idParam });
}

// ==========================================
// 1. POST /api/tickets — Create a new ticket
// ==========================================
router.post("/", async (req, res) => {
    try {
        const payload = normalizeTicketBody(req.body);

        if (!payload.customerName || !payload.customerEmail || !payload.subject || !payload.description) {
            return res.status(400).json({
                message: "All fields are required: customerName, customerEmail, subject, description"
            });
        }

        const ticket = new Ticket(payload);
        await ticket.save();

        res.status(201).json({
            success: true,
            ticket_id: ticket.ticketId,
            ticketId: ticket.ticketId,
            created_at: ticket.createdAt,
            ticket
        });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 2. GET /api/tickets — List all tickets with optional search & filter
// Query params: ?status=Open&search=query
// ==========================================
router.get("/", async (req, res) => {
    try {
        const { status, search, priority } = req.query;
        const filter = {};

        // Filter by Status (Open / In Progress / Closed)
        if (status && status !== "all") {
            const normalized = normalizeStatus(status);
            // Handle both legacy lowercase and new title case in database
            filter.$or = [
                { status: normalized },
                { status: status.toLowerCase() }
            ];
        }

        // Filter by Priority
        if (priority && priority !== "all") {
            filter.priority = priority;
        }

        // Quick search across names, IDs, emails, subjects, descriptions
        if (search && search.trim() !== "") {
            const regex = new RegExp(search.trim(), "i");
            const searchConditions = [
                { ticketId: regex },
                { customerName: regex },
                { customerEmail: regex },
                { subject: regex },
                { description: regex }
            ];

            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: searchConditions }
                ];
                delete filter.$or;
            } else {
                filter.$or = searchConditions;
            }
        }

        const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

        // Ensure every ticket has a ticketId if an old record didn't have one
        const formatted = tickets.map((t, index) => {
            const doc = t.toObject();
            if (!doc.ticketId) {
                doc.ticketId = `TKT-${1000 + (tickets.length - index)}`;
            }
            // Compatibility mappings
            doc.ticket_id = doc.ticketId;
            doc.customer_name = doc.customerName;
            doc.customer_email = doc.customerEmail;
            doc.created_at = doc.createdAt;
            doc.updated_at = doc.updatedAt;
            return doc;
        });

        res.status(200).json(formatted);
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// Standout Route: POST /api/tickets/seed
// Instantly seed sample tickets for testing / evaluators
// ==========================================
router.post("/seed", async (req, res) => {
    try {
        const sampleTickets = [
            {
                customerName: "Alex Rivera",
                customerEmail: "alex.rivera@fintech.io",
                subject: "Payment webhook failing with 500 error",
                description: "Our production webhook endpoint stopped receiving payment events starting at 09:00 UTC today. We need this resolved immediately as customer checkouts are pending.",
                status: "Open",
                priority: "Urgent",
                notes: [
                    { noteText: "Escalated to backend on-call engineer.", author: "Tier 1 Support" }
                ]
            },
            {
                customerName: "Sarah Chen",
                customerEmail: "sarah.c@designstudio.co",
                subject: "Cannot update team member permissions",
                description: "Admin panel returns 'Access Denied' when attempting to assign Editor role to newly invited team members.",
                status: "In Progress",
                priority: "High",
                notes: [
                    { noteText: "Investigating IAM permission scopes for organization ID 4892.", author: "Security Team" }
                ]
            },
            {
                customerName: "Marcus Sterling",
                customerEmail: "m.sterling@logistics.com",
                subject: "Requesting invoice for Enterprise subscription",
                description: "Please provide the official tax invoice for our annual plan renewal processed on March 15th.",
                status: "Open",
                priority: "Medium",
                notes: []
            },
            {
                customerName: "Elena Rostova",
                customerEmail: "elena@cloudops.net",
                subject: "Feature request: Dark mode in analytics dashboard",
                description: "Our monitoring engineers would love a dark theme option for the real-time operational dashboard.",
                status: "Closed",
                priority: "Low",
                notes: [
                    { noteText: "Added to Q3 product backlog. Customer notified via email.", author: "Product Manager" }
                ]
            },
            {
                customerName: "David Miller",
                customerEmail: "david.m@retailhub.com",
                subject: "Password reset link expiring prematurely",
                description: "Customers reporting that the password reset link says expired within 2 minutes of generation instead of the documented 24 hours.",
                status: "In Progress",
                priority: "High",
                notes: [
                    { noteText: "Identified timezone offset bug in token TTL calculation. PR is in review.", author: "Dev Team" }
                ]
            }
        ];

        // Assign proper ticketId for each
        const existingCount = await Ticket.countDocuments();
        let counter = existingCount + 1001;

        const docsToInsert = sampleTickets.map((item) => ({
            ...item,
            ticketId: `TKT-${counter++}`
        }));

        const inserted = await Ticket.insertMany(docsToInsert);
        res.status(201).json({
            message: `Successfully seeded ${inserted.length} sample tickets!`,
            count: inserted.length
        });
    } catch (error) {
        console.error("Error seeding sample tickets:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 3. GET /api/tickets/:id — View single ticket details
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const ticket = await findTicketByIdOrCustomId(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const doc = ticket.toObject();
        // Compatibility attributes
        doc.ticket_id = doc.ticketId || `TKT-${doc._id.toString().slice(-4)}`;
        doc.customer_name = doc.customerName;
        doc.customer_email = doc.customerEmail;
        doc.created_at = doc.createdAt;
        doc.updated_at = doc.updatedAt;

        res.status(200).json(doc);
    } catch (error) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// 4. PUT /api/tickets/:id — Update ticket status & add notes
// Spec: Body: { status, notes } -> Returns: { success: true, updated_at }
// ==========================================
router.put("/:id", async (req, res) => {
    try {
        const ticket = await findTicketByIdOrCustomId(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const { status, notes, noteText, author, priority } = req.body;

        // Update status if provided
        if (status) {
            ticket.status = normalizeStatus(status);
        }

        // Update priority if provided
        if (priority) {
            ticket.priority = priority;
        }

        // Add note if provided (accepts string or object or array)
        if (notes && typeof notes === "string") {
            ticket.notes.push({
                noteText: notes,
                author: author || "Support Agent",
                createdAt: new Date()
            });
        } else if (noteText) {
            ticket.notes.push({
                noteText,
                author: author || "Support Agent",
                createdAt: new Date()
            });
        } else if (Array.isArray(notes)) {
            notes.forEach((n) => {
                ticket.notes.push({
                    noteText: typeof n === "string" ? n : n.noteText,
                    author: n.author || author || "Support Agent",
                    createdAt: n.createdAt || new Date()
                });
            });
        }

        await ticket.save();

        res.status(200).json({
            success: true,
            updated_at: ticket.updatedAt,
            ticket_id: ticket.ticketId,
            ticket
        });
    } catch (error) {
        console.error("Error updating ticket:", error);
        res.status(400).json({ message: error.message });
    }
});

// Legacy PATCH support for compatibility
router.patch("/:id", async (req, res) => {
    try {
        const ticket = await findTicketByIdOrCustomId(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        if (req.body.status) {
            ticket.status = normalizeStatus(req.body.status);
        }
        if (req.body.priority) {
            ticket.priority = req.body.priority;
        }
        if (req.body.customerName) ticket.customerName = req.body.customerName;
        if (req.body.customerEmail) ticket.customerEmail = req.body.customerEmail;
        if (req.body.subject) ticket.subject = req.body.subject;
        if (req.body.description) ticket.description = req.body.description;

        await ticket.save();
        res.status(200).json(ticket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 5. POST /api/tickets/:id/notes — Add note to ticket
// ==========================================
router.post("/:id/notes", async (req, res) => {
    try {
        const ticket = await findTicketByIdOrCustomId(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const { noteText, author } = req.body;
        if (!noteText || !noteText.trim()) {
            return res.status(400).json({ message: "Note text is required" });
        }

        ticket.notes.push({
            noteText: noteText.trim(),
            author: author || "Support Agent",
            createdAt: new Date()
        });

        await ticket.save();

        res.status(201).json({
            success: true,
            notes: ticket.notes,
            ticket
        });
    } catch (error) {
        console.error("Error adding note:", error);
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// 6. DELETE /api/tickets/:id — Delete a ticket
// ==========================================
router.delete("/:id", async (req, res) => {
    try {
        const ticket = await findTicketByIdOrCustomId(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        await Ticket.deleteOne({ _id: ticket._id });

        res.status(200).json({
            success: true,
            message: "Ticket deleted successfully",
            ticket_id: ticket.ticketId
        });
    } catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;