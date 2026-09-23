# Setup & Deployment Guide

This guide provides step-by-step instructions to set up the **Customer Support Ticketing CRM** locally, push the source code to GitHub, and deploy both the backend and frontend to free production hosting platforms (**Render** and **Vercel**).

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Local Setup Instructions](#2-local-setup-instructions)
3. [Pushing to GitHub](#3-pushing-to-github)
4. [Deploying Backend to Render](#4-deploying-backend-to-render)
5. [Deploying Frontend to Vercel](#5-deploying-frontend-to-vercel)
6. [Production Smoke Testing](#6-production-smoke-testing)
7. [Troubleshooting & Common Issues](#7-troubleshooting--common-issues)

---

## 1. Prerequisites

Before starting, ensure you have:
- **Node.js** (v18 or higher) installed (`node -v`)
- **Git** installed (`git --version`)
- A free **GitHub** account ([github.com](https://github.com))
- A free **MongoDB Atlas** account ([mongodb.com/atlas](https://www.mongodb.com/atlas))
- A free **Render** account ([render.com](https://render.com)) for backend hosting
- A free **Vercel** account ([vercel.com](https://vercel.com)) for frontend hosting

---

## 2. Local Setup Instructions

### Step 2.1: Clone or Open the Workspace
```powershell
cd c:\documentt\support-crm
```

### Step 2.2: Backend Configuration
1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Configure environment variables:
   Verify that a `.env` file exists in `backend/` with the following variables:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=support-crm
   PORT=5000
   ```
4. Run the automated test suite to verify database connection and API routes:
   ```powershell
   npm test
   ```
   *Expected output: `ALL 7 AUTOMATED REST API TESTS PASSED SUCCESSFULLY!`*
5. Start the backend server:
   ```powershell
   npm start
   ```
   *The backend will run on `http://localhost:5000`.*

### Step 2.3: Frontend Configuration
1. Open a new terminal and navigate to the frontend directory:
   ```powershell
   cd c:\documentt\support-crm\frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. (Optional) Check `.env`:
   By default, the frontend connects to `http://localhost:5000/api` if no `VITE_API_URL` is set.
4. Start the Vite development server:
   ```powershell
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 3. Pushing to GitHub

A Git repository has already been initialized in `support-crm` with all project files committed and sensitive files (`.env`, `node_modules/`) protected by `.gitignore`.

### Step 3.1: Create a New Repository on GitHub
1. Log in to [GitHub](https://github.com).
2. Click the **+** icon in the top right corner and select **New repository**.
3. Fill in the repository details:
   - **Repository name**: `customer-support-crm` (or your preferred name)
   - **Visibility**: **Public** (required so evaluators can inspect your code)
   - **Initialize this repository with**: Leave all boxes unchecked (do *not* add README, .gitignore, or license, as we already have them).
4. Click **Create repository**.

### Step 3.2: Link and Push Your Code
Copy the repository URL shown on GitHub (e.g. `https://github.com/your-username/customer-support-crm.git`), then run the following commands in your terminal:

```powershell
cd c:\documentt\support-crm

# Set the default branch name to main
git branch -M main

# Add your GitHub repository as the remote origin
git remote add origin https://github.com/<your-username>/customer-support-crm.git

# Push your code to GitHub
git push -u origin main
```

### Step 3.3: Verify on GitHub
Refresh your repository page on GitHub. You should see:
- `backend/` and `frontend/` folders
- `README.md` and `DEPLOYMENT.md`
- **Confirmation**: Verify that `.env` is **NOT** listed in the backend folder (this protects your database credentials).

---

## 4. Deploying Backend to Render

[Render](https://render.com) provides free cloud hosting for Node.js web services.

### Step 4.1: Connect Your GitHub to Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the blue **New +** button and select **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Select or search for your `customer-support-crm` repository and click **Connect**.

### Step 4.2: Configure the Web Service
Configure the settings with the following values:
- **Name**: `support-crm-api` (or similar)
- **Region**: Select the closest region (e.g., Singapore, Frankfurt, Oregon)
- **Branch**: `main`
- **Root Directory**: `backend` *(Important: set this to backend)*
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: **Free**

### Step 4.3: Add Environment Variables
Scroll down to the **Environment Variables** section and click **Add Environment Variable**:
1. Key: `MONGO_URI`
   - Value: *(Paste your complete MongoDB Atlas connection string from your backend `.env` file)*
2. Key: `PORT`
   - Value: `5000`

### Step 4.4: Deploy and Verify
1. Click **Create Web Service**.
2. Wait 1–2 minutes while Render installs packages and boots the server.
3. Look for the log output:
   ```
   Server running on http://localhost:5000
   MongoDB connected successfully
   ```
4. Copy your public service URL from the top of the page:
   - Example: `https://support-crm-api-xxxx.onrender.com`
5. Test the health endpoint in your browser:
   - Open: `https://support-crm-api-xxxx.onrender.com/health`
   - Expected response: `{"status":"ok","timestamp":"..."}`

---

## 5. Deploying Frontend to Vercel

[Vercel](https://vercel.com) provides high-performance global hosting for Vite/React applications.

### Step 5.1: Import Your Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Locate your `customer-support-crm` repository and click **Import**.

### Step 5.2: Configure Build Settings
In the Project Configuration screen:
- **Project Name**: `customer-support-crm` (or default)
- **Framework Preset**: **Vite** (auto-detected)
- **Root Directory**: Click **Edit** and select `frontend` *(Important: set this to frontend)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 5.3: Add Environment Variable
Expand the **Environment Variables** section:
- **Key**: `VITE_API_URL`
- **Value**: `https://<your-render-backend-url>/api`
  *(Note: Include the `/api` path at the end! For example: `https://support-crm-api-xxxx.onrender.com/api`)*

### Step 5.4: Deploy
1. Click **Deploy**.
2. Vercel will build and deploy the React application in under 30 seconds.
3. You will see a congratulatory screen with your public URL:
   - Example: `https://customer-support-crm-xxxx.vercel.app`

---

## 6. Production Smoke Testing

Once both services are deployed, perform these verification steps on your live Vercel URL:

1. **Verify App Loads**: Open your Vercel URL. The dashboard should load without console errors.
2. **Populate Demo Data**: Click **"Populate Demo Data"**. Verify that 5 sample tickets appear and the KPI cards update.
3. **Create a Ticket**:
   - Click **New Ticket**.
   - Enter:
     - Name: `Production Test User`
     - Email: `test@example.com`
     - Subject: `Deployment Verification Ticket`
     - Priority: `Urgent`
     - Description: `Testing live deployment on Vercel and Render.`
   - Click **Create Ticket**.
   - Verify that the ticket appears at the top with an auto-assigned ID (e.g. `TKT-1008`).
4. **Search Test**: Type `Verification` into the search bar. Verify that only the matching ticket displays.
5. **Filter Test**: Click the **Open**, **In Progress**, and **Closed** KPI cards. Verify that the table updates accordingly.
6. **Detail & Notes Test**:
   - Click on the test ticket.
   - Change the status to **In Progress**.
   - Add an internal note: `"Verified live database writes and updates on production."`
   - Click **Add Internal Note** and confirm it appears in the activity timeline with a timestamp.

---

## 7. Troubleshooting & Common Issues

### Issue 1: MongoDB Connection Error on Render
- **Symptom**: Render logs show `MongoServerSelectionError: connection timed out` or `MongooseError`.
- **Cause**: MongoDB Atlas has IP access restrictions enabled.
- **Solution**:
  1. Go to [MongoDB Atlas](https://cloud.mongodb.com).
  2. In the left navigation, click **Network Access** (under Security).
  3. Check if `0.0.0.0/0` (Allow Access from Anywhere) is listed.
  4. If not, click **+ Add IP Address**, select **Allow Access from Anywhere**, and click **Confirm**.

### Issue 2: CORS Error in Browser Console
- **Symptom**: In the browser console, requests to `/api/tickets` fail with a CORS policy error.
- **Solution**: The backend already has `cors()` enabled in `server.js` allowing all cross-origin requests. Verify that your `VITE_API_URL` in Vercel includes `https://` and ends with `/api`.

### Issue 3: Render Free Tier Cold Starts
- **Symptom**: On Render's free tier, the backend spins down after 15 minutes of inactivity. The first request after idle can take ~30–45 seconds to wake up.
- **Solution**: This is normal for Render free tier. Once awake, the server responds instantly. In your demo video or submission note, you can mention: *"Hosted on Render free tier; please allow 30 seconds for initial server spin-up."*

### Issue 4: Frontend Shows "Failed to load tickets"
- **Cause**: The `VITE_API_URL` environment variable was either missing, misspelled, or set without `/api`.
- **Solution**:
  1. In Vercel -> Project Settings -> **Environment Variables**.
  2. Verify `VITE_API_URL` is set to `https://<your-render-url>/api`.
  3. Go to **Deployments** -> Click the three dots on the latest deployment -> **Redeploy**.

---

## 8. Summary Checklist for Final Submission

- [ ] GitHub repository is **Public** with clean commit history.
- [ ] Backend is deployed and returns `{"status":"ok"}` on `/health`.
- [ ] Frontend is deployed on Vercel and successfully communicates with the backend.
- [ ] Created at least 1 live test ticket on production.
- [ ] Recorded 3–5 min demo video using the script in `walkthrough.md`.
- [ ] Prepared submission email using the template in `walkthrough.md`.
