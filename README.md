# ⚡ SettleKnot - Group Trip Expense Logger & Debt Settlement Platform

> **100% Free, Installable Chrome Web App for Splitting & Settling Group Trip Expenses Effortlessly.**

SettleKnot is a modern, high-performance web application built with **React 19, TypeScript 5, Vite, Tailwind CSS, Express.js, and PWA capabilities**. It allows travel groups to log shared bills, compute minimal person-to-person debt settlements, export executive PDF audit reports, and install the app directly on Chrome (desktop or mobile).

---

## ✨ Features

- ⚡ **TypeScript 5 & React 19**: Fully type-safe frontend with zero external folder bloat.
- 📱 **Chrome PWA Installable**: Registered Service Worker (`sw.js`) and Web Manifest (`manifest.json`) enabling 1-click installation from Chrome.
- 🧮 **Minimum Cash Flow Settlement Algorithm**: Eliminates circular payments by calculating the fewest cash transfers between members.
- 📄 **Executive PDF Reports**: Generates sanitized, official PDF audit reports using `jsPDF` and `jspdf-autotable`.
- 🔄 **Real-Time Auto-Sync & Manual Refresh**: Auto-polls backend every 3 seconds so users see live updates without reloading, plus explicit Refresh buttons.
- 🔒 **Private Personal Expenses**: Log private items separate from group trip totals.
- 👑 **System Admin Control Center**: System administration with 1-click database JSON backups and user/room management.
- 🌐 **Express Backend API + Static Server**: Integrated Express server handling authentication, room management, and persistence with local data fallback.

---

## 📂 Crystal-Clean Project Structure

```text
TRACKIT/
├── public/                  # PWA Manifest, Brand Logo & Service Worker
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo.png
│   ├── manifest.json
│   └── sw.js
├── src/                     # React 19 TypeScript Source Code
│   ├── components/          # Reusable UI Components & Modals
│   ├── lib/                 # Auth, Store, API & PDF Generator Logic
│   ├── pages/               # Application View Pages
│   ├── types/               # TypeScript Definitions
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── data/                    # Persistent JSON database storage
│   └── db.json
├── index.html               # Main HTML entry with PWA headers
├── server.js                # Express API & Production Static Server
├── package.json             # Unified dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build & proxy configuration
```

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Install Dependencies
Run in the root folder:
```bash
npm install
```

### 2. Development Mode
To run both the **Express Backend Server** (Port `5000`) and the **Vite Dev Server** (Port `3000`) concurrently:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

### 3. Build & Test Production Server
```bash
npm run build
npm start
```
Open your browser at [http://localhost:5000](http://localhost:5000).

---

## 🌐 Free Hosting & Deployment Guide

### Step 1: Push Code to GitHub

1. Open your terminal in the project folder `d:\PROJECTS\TRACKIT`.
2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SettleKnot Production App"
   ```
3. Create a new repository on [GitHub](https://github.com/new) named `SettleKnot`.
4. Link and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/SettleKnot.git
   git branch -M main
   git push -u origin main
   ```

---

### Step 2: Host for FREE on Render (Recommended Full Stack Hosting)

Render provides free hosting for Node.js Express full-stack web applications:

1. Sign up / Log in to [Render.com](https://render.com).
2. Click **New +** $\rightarrow$ Select **Web Service**.
3. Connect your GitHub account and select your `SettleKnot` repository.
4. Fill in the deployment details:
   - **Name**: `settleknot` (or any custom name)
   - **Environment**: `Node`
   - **Region**: Choose closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Click **Create Web Service**.
6. Render will automatically install dependencies, build the TypeScript frontend into `dist/`, and run `server.js` on your free `https://settleknot.onrender.com` URL!

---

### Alternative: Host on Railway / Koyeb

1. Sign up on [Railway.app](https://railway.app) or [Koyeb.com](https://koyeb.com).
2. Create **New Project** $\rightarrow$ **Deploy from GitHub repo**.
3. Set Build Command: `npm run build`
4. Set Start Command: `npm start`

---

## 📄 License
Private project created for SettleKnot.
