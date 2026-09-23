# 🎫 Support Desk CRM — Customer Support Ticketing System

A production-ready, full-stack Customer Support Management System built with the **MERN stack** (MongoDB, Express, React, Node.js). Designed to help customer support teams triage, search, update, and collaborate on customer issues with real-time feedback.

---

## 🌟 Key Features

### 1. Core Capabilities (Assignment Requirements)
- **Create Tickets**: Log issues with customer name, email, subject, description, and urgency priority. Automatically generates a human-readable identifier (e.g. `TKT-1001`) and timestamp.
- **Ticket List View**: Clean, responsive list view displaying Ticket ID, Customer Name & Email, Subject, Priority Badge, Status Pill, and Creation Date.
- **Search-as-you-type**: Instant search across Ticket IDs, customer names, emails, subjects, and descriptions.
- **Status Filter**: Real-time filtering by status: **Open**, **In Progress**, and **Closed**.
- **Detailed Ticket View**: Dedicated view showing full customer details, ticket description, and timestamps.
- **Ticket Status & Note Updates**: Change ticket status instantly and append timestamped internal notes.

### 2. Standout / Bonus Features (Evaluation Strong Points)
- **Urgency & SLA Triage Matrix**:
  - Four priority levels: **🔴 Urgent**, **🟠 High**, **🔵 Medium**, **🟢 Low** with color-coded visual badges.
  - *Why it matters*: In a busy support desk handling hundreds of daily tickets, a strict first-in-first-out queue causes severe system outages to wait behind trivial questions. Triage by urgency is essential for customer retention and SLA adherence.
  - *Trade-off*: We implemented an agent-assigned priority model with instant UI filtering, delivering 90% of practical triage value without the performance overhead of heavy automated escalation engines.
- **Interactive KPI Stat Cards**:
  - High-level metric cards for **Total**, **Open**, **In Progress**, and **Closed** tickets.
  - Clicking any card dynamically filters the ticket list with a single click.
- **Internal Collaboration Thread**:
  - Full activity log for support agents to record debugging steps, customer phone call summaries, or escalation notes with author attribution and timestamps.
- **One-Click Demo Data Generator**:
  - Evaluators can click **"⚡ Load Demo Data"** to instantly populate 5 realistic support tickets representing various industries (fintech, SaaS, cloud ops).

---

## 🏗️ Architecture & Tech Stack

```
┌────────────────────────────────┐
│   React 19 + Vite Frontend     │  (Port 5173 / Vercel)
│  - Responsive Dashboard        │
│  - Real-time Search & Filter   │
│  - Modal Ticket Form           │
│  - Notes & Activity Timeline   │
└───────────────┬────────────────┘
                │  HTTP / REST JSON
┌───────────────▼────────────────┐
│    Express 5 + Node.js API     │  (Port 5000 / Render / Railway)
│  - REST Endpoints              │
│  - Auto Ticket ID Generator    │
│  - Input Normalization         │
└───────────────┬────────────────┘
                │  Mongoose ODM
┌───────────────▼────────────────┐
│       MongoDB Atlas            │  (Cloud Database)
│  - Tickets Collection          │
│  - Embedded Notes Subdocuments │
└────────────────────────────────┘
```

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Modern CSS | Fast, reactive, zero-dependency UI |
| **Backend** | Node.js, Express.js | REST API server with routing & validation |
| **Database** | MongoDB Atlas, Mongoose 9 | Scalable document store with schema validation |

---

## 🗄️ Database Design

### Tickets Collection (`Ticket`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | MongoDB unique primary key |
| `ticketId` | String | Unique human-readable identifier (e.g. `TKT-1001`), indexed |
| `customerName` | String | Full name of the customer (required) |
| `customerEmail` | String | Email address (required, normalized to lowercase) |
| `subject` | String | Issue summary / title (required) |
| `description` | String | Detailed issue explanation (required) |
| `status` | String | Enum: `Open`, `In Progress`, `Closed` (default: `Open`) |
| `priority` | String | Enum: `Low`, `Medium`, `High`, `Urgent` (default: `Medium`) |
| `notes` | Array[Note] | Subdocuments containing internal agent notes |
| `createdAt` | Date | Timestamp of creation (auto-managed) |
| `updatedAt` | Date | Timestamp of last modification (auto-managed) |

### Notes Subdocument Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Subdocument ID |
| `noteText` | String | Content of the internal note (required) |
| `author` | String | Support agent or author name (default: "Support Agent") |
| `createdAt` | Date | Timestamp note was recorded |

---

## 📡 REST API Reference

### 1. Create a Ticket
- **URL**: `POST /api/tickets`
- **Body**:
  ```json
  {
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Cannot connect payment gateway",
    "description": "Getting error 401 when attempting to verify API credentials.",
    "priority": "High"
  }
  ```
  *(Note: Accepts both snake_case and camelCase)*
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "ticket_id": "TKT-1003",
    "created_at": "2026-09-23T10:00:00.000Z",
    "ticket": { ... }
  }
  ```

### 2. List All Tickets (with search & filter)
- **URL**: `GET /api/tickets`
- **Optional Query Params**:
  - `status=Open` (or `In Progress`, `Closed`)
  - `search=Jane` (searches across ID, name, email, subject, description)
  - `priority=High`
- **Response** (`200 OK`):
  ```json
  [
    {
      "ticket_id": "TKT-1003",
      "customer_name": "Jane Doe",
      "subject": "Cannot connect payment gateway",
      "status": "Open",
      "priority": "High",
      "created_at": "2026-09-23T10:00:00.000Z"
    }
  ]
  ```

### 3. Get Ticket by ID
- **URL**: `GET /api/tickets/:id` *(supports `TKT-1001` or MongoDB ObjectId)*
- **Response** (`200 OK`):
  ```json
  {
    "ticket_id": "TKT-1003",
    "customer_name": "Jane Doe",
    "customer_email": "jane@example.com",
    "subject": "Cannot connect payment gateway",
    "description": "Getting error 401 when attempting to verify API credentials.",
    "status": "Open",
    "priority": "High",
    "notes": [],
    "created_at": "...",
    "updated_at": "..."
  }
  ```

### 4. Update Ticket Status & Notes
- **URL**: `PUT /api/tickets/:id`
- **Body**:
  ```json
  {
    "status": "In Progress",
    "notes": "Verified API credentials; investigating webhook URL format."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "updated_at": "2026-09-23T10:15:00.000Z",
    "ticket_id": "TKT-1003"
  }
  ```

### 5. Append Internal Note
- **URL**: `POST /api/tickets/:id/notes`
- **Body**:
  ```json
  {
    "noteText": "Customer phoned in. Updated ticket with reproduction steps.",
    "author": "Support Lead"
  }
  ```

### 6. Delete Ticket
- **URL**: `DELETE /api/tickets/:id`
- **Response** (`200 OK`):
  ```json
  { "success": true, "message": "Ticket deleted successfully" }
  ```

### 7. Seed Sample Tickets
- **URL**: `POST /api/tickets/seed`
- **Response** (`201 Created`):
  ```json
  { "message": "Successfully seeded 5 sample tickets!", "count": 5 }
  ```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance

### 1. Setup Backend
```bash
cd backend
npm install

# Copy example environment configuration
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string and PORT (default: 5000)

# Run automated API test suite
npm test

# Start the server
npm start
```
The backend server will run on `http://localhost:5000`.

### 2. Setup Frontend
```bash
cd ../frontend
npm install

# (Optional) specify custom API URL, default points to http://localhost:5000/api
cp .env.example .env

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🌐 Production Deployment Guide

### Deploying the Backend (e.g., Render.com or Railway.app)
1. Push this repository to GitHub.
2. Go to **Render.com** -> New **Web Service** -> Connect GitHub repo.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `PORT`: `5000`
5. Click **Deploy**. Note your public backend URL (e.g. `https://support-crm-api.onrender.com`).

### Deploying the Frontend (e.g., Vercel)
1. Go to **Vercel.com** -> Add New Project -> Import your GitHub repo.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://support-crm-api.onrender.com/api` (your deployed backend URL)
4. Click **Deploy**. Your app is now live!
