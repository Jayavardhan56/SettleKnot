# ⚡ SettleKnot - Group Trip Expense Logger & Debt Settlement Platform

> **100% Free, Installable Chrome Web App for Splitting & Settling Group Trip Expenses Effortlessly.**

SettleKnot is a modern, high-performance web application built with **React 19, TypeScript 5, Vite, Tailwind CSS, Express.js, Supabase PostgreSQL, and PWA capabilities**. It allows travel groups to log shared bills, compute minimal person-to-person debt settlements, export executive PDF audit reports, and install the app directly on Chrome (desktop or mobile).

---

## ✨ Features

- ⚡ **TypeScript 5 & React 19**: Fully type-safe frontend with zero external folder bloat.
- ⚡ **Supabase PostgreSQL Cloud Database**: 100% free permanent cloud database ensuring zero data loss on cloud restarts, plus local fallback.
- 📱 **Persistent Mobile & PWA Sessions**: 30-day persistent login sessions with `localStorage` fallback so accounts stay remembered on mobile.
- 🧮 **Minimum Cash Flow Settlement Algorithm**: Eliminates circular payments by calculating the fewest cash transfers between members.
- 📄 **Executive PDF Reports**: Generates sanitized, official PDF audit reports using `jsPDF` and `jspdf-autotable`.
- 🔄 **Real-Time Auto-Sync & Manual Refresh**: Auto-polls backend every 3 seconds so users see live updates without reloading, plus explicit Refresh buttons.
- 🔒 **Private Personal Expenses**: Log private items separate from group trip totals.
- 👑 **System Admin Control Center**: System administration with 1-click database JSON backups, live cloud database status, and user/room management.
- 🌐 **Express Backend API + Static Server**: Integrated Express server handling authentication, room management, and persistence.

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
├── data/                    # Local persistent JSON database backup
│   └── db.json
├── index.html               # Main HTML entry with PWA headers
├── server.js                # Express API & Supabase / Static Server
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

## ⚡ Permanent Database Setup: Supabase (100% Free Forever)

Render's free web hosting uses an ephemeral filesystem, meaning local files like `data/db.json` get wiped when the server sleeps. Connecting **Supabase (Free Cloud PostgreSQL)** makes your data 100% permanent and safe!

### Step 1: Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **Start your project** (Sign in with GitHub or Email).
2. Click **New project**:
   - **Name**: `settleknot`
   - **Database Password**: Set a strong password (save it).
   - **Region**: Choose the closest region (e.g. Singapore, Frankfurt, or US).
   - **Pricing Plan**: **Free** ($0/month).
3. Click **Create new project** (takes ~1 minute to spin up).

---

### Step 2: Create the 2 Tables in Supabase (1-Click SQL)
1. On the left sidebar of your Supabase dashboard, click the **SQL Editor** tab (icon `>_`).
2. Click **New query**.
3. Paste the following SQL script and click **Run** (green button):

```sql
-- Create accounts table for user logins
create table if not exists accounts (
  id text primary key,
  email text,
  data jsonb not null
);

-- Create rooms table for all trip rooms, expenses, and settlements
create table if not exists rooms (
  code text primary key,
  data jsonb not null
);

-- Disable Row Level Security so the backend can manage reads/writes
alter table accounts disable row level security;
alter table rooms disable row level security;
```

---

### Step 3: Copy Your Supabase API Keys
1. In your Supabase dashboard, click the **Settings (⚙️ icon)** at the bottom left $\rightarrow$ click **API**.
2. Look at the **Project API keys** and **Project URL**:
   - **Project URL**: Copy the URL (e.g., `https://abcdefghijklm.supabase.co`).
   - **API Key (`service_role` or `anon`)**:
     - Under "Project API keys", copy the **`service_role`** key (recommended for backend) OR the **`anon` public** key.

---

### Step 4: Add Environment Variables in Render

1. **Commit and push your updated code to GitHub**:
   ```bash
   git add .
   git commit -m "Integrate Supabase permanent cloud database"
   git push origin main
   ```

2. **Open Render Dashboard**:
   - Go to your service on [Render.com](https://render.com).
   - Go to the **Environment** tab on the left.
   - Click **Add Environment Variable** and add these two:
     - **Key**: `SUPABASE_URL`  
       **Value**: `https://your-project-ref.supabase.co`
     - **Key**: `SUPABASE_KEY`  
       **Value**: `your-supabase-service-role-or-anon-key`
   - Click **Save Changes**.

3. **Auto-Deploy & Verification**:
   - Render will automatically restart.
   - Look at the deployment logs:
     ```text
     [DATABASE SUCCESS] ⚡ Connected to Supabase Cloud Database permanently!
     ```
   - On initial connection, your existing local rooms and accounts will automatically be seeded into Supabase!
   - Open your deployed app $\rightarrow$ Open **Admin Control Center 👑** to verify the green badge:
     ```text
     ⚡ DB: Supabase (Cloud Permanent)
     ```

Your accounts, rooms, expenses, and settlements are now permanently saved in Supabase and will never be lost!

---

## 📄 License
Private project created for SettleKnot.
