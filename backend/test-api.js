const http = require("http");

// Start backend server in-process for test verification
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/tickets", ticketRoutes);
app.get("/health", (req, res) => res.json({ status: "ok" }));

const TEST_PORT = 5099;

function request(options, bodyData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data
                    });
                }
            });
        });

        req.on("error", (err) => reject(err));

        if (bodyData) {
            req.write(JSON.stringify(bodyData));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=== Starting Automated End-to-End API Verification ===");
    await connectDB();

    const server = app.listen(TEST_PORT, async () => {
        console.log(`Test server running on port ${TEST_PORT}`);

        try {
            // Test 1: Health check
            console.log("\n[Test 1] Testing GET /health");
            const healthRes = await request({
                hostname: "localhost",
                port: TEST_PORT,
                path: "/health",
                method: "GET"
            });
            console.log("Status:", healthRes.statusCode, "Body:", healthRes.data);
            if (healthRes.statusCode !== 200) throw new Error("Health check failed");

            // Test 2: Create ticket (POST /api/tickets)
            console.log("\n[Test 2] Testing POST /api/tickets");
            const newTicket = {
                customer_name: "Emma Watson",
                customer_email: "emma@example.com",
                subject: "Unable to export monthly billing report",
                description: "Clicking export button causes a timeout after 30 seconds.",
                priority: "High"
            };
            const postRes = await request(
                {
                    hostname: "localhost",
                    port: TEST_PORT,
                    path: "/api/tickets",
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                },
                newTicket
            );
            console.log("Status:", postRes.statusCode);
            console.log("Returned Ticket ID:", postRes.data.ticket_id);
            if (postRes.statusCode !== 201 || !postRes.data.ticket_id) {
                throw new Error("Ticket creation failed");
            }
            const createdTicketId = postRes.data.ticket_id;

            // Test 3: List tickets (GET /api/tickets)
            console.log("\n[Test 3] Testing GET /api/tickets");
            const listRes = await request({
                hostname: "localhost",
                port: TEST_PORT,
                path: "/api/tickets",
                method: "GET"
            });
            console.log("Status:", listRes.statusCode, "Count:", listRes.data.length);
            if (listRes.statusCode !== 200 || !Array.isArray(listRes.data)) {
                throw new Error("List tickets failed");
            }

            // Test 4: Search & Filter (GET /api/tickets?status=Open&search=Watson)
            console.log("\n[Test 4] Testing GET /api/tickets?status=Open&search=Watson");
            const filterRes = await request({
                hostname: "localhost",
                port: TEST_PORT,
                path: "/api/tickets?status=Open&search=Watson",
                method: "GET"
            });
            console.log("Status:", filterRes.statusCode, "Matched:", filterRes.data.length);
            if (filterRes.statusCode !== 200 || filterRes.data.length === 0) {
                throw new Error("Search/filter query failed");
            }

            // Test 5: Fetch single ticket by ticketId (GET /api/tickets/{ticket_id})
            console.log(`\n[Test 5] Testing GET /api/tickets/${createdTicketId}`);
            const getSingleRes = await request({
                hostname: "localhost",
                port: TEST_PORT,
                path: `/api/tickets/${createdTicketId}`,
                method: "GET"
            });
            console.log("Status:", getSingleRes.statusCode, "Subject:", getSingleRes.data.subject);
            if (getSingleRes.statusCode !== 200 || getSingleRes.data.ticket_id !== createdTicketId) {
                throw new Error("Fetch single ticket by custom ID failed");
            }

            // Test 6: Update status & add note (PUT /api/tickets/{ticket_id})
            console.log(`\n[Test 6] Testing PUT /api/tickets/${createdTicketId}`);
            const putRes = await request(
                {
                    hostname: "localhost",
                    port: TEST_PORT,
                    path: `/api/tickets/${createdTicketId}`,
                    method: "PUT",
                    headers: { "Content-Type": "application/json" }
                },
                {
                    status: "In Progress",
                    notes: "Investigating slow database aggregation query on billing table."
                }
            );
            console.log("Status:", putRes.statusCode, "Success:", putRes.data.success);
            if (putRes.statusCode !== 200 || !putRes.data.success) {
                throw new Error("Update ticket failed");
            }

            // Test 7: Post explicit note (POST /api/tickets/{ticket_id}/notes)
            console.log(`\n[Test 7] Testing POST /api/tickets/${createdTicketId}/notes`);
            const noteRes = await request(
                {
                    hostname: "localhost",
                    port: TEST_PORT,
                    path: `/api/tickets/${createdTicketId}/notes`,
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                },
                {
                    noteText: "Customer contacted via phone; confirmed repro steps.",
                    author: "Senior Support Agent"
                }
            );
            console.log("Status:", noteRes.statusCode, "Total Notes:", noteRes.data.notes.length);
            if (noteRes.statusCode !== 201 || noteRes.data.notes.length < 2) {
                throw new Error("Add note endpoint failed");
            }

            console.log("\n✅ ALL 7 AUTOMATED REST API TESTS PASSED SUCCESSFULLY!");
            server.close();
            process.exit(0);
        } catch (err) {
            console.error("\n❌ TEST FAILED:", err.message);
            server.close();
            process.exit(1);
        }
    });
}

runTests();
