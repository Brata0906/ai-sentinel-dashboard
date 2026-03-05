

# AI Sentinel — Fraud Detection Dashboard

## Overview
A modern, dark-themed FinTech dashboard that monitors financial transactions in real-time, flags fraudulent activity using simulated AI risk scoring, and provides rich analytics — all built as a single-page React app with simulated data.

> **Note:** Since Lovable runs React/TypeScript in the browser, the AI/ML model and backend will be simulated client-side. The fraud scoring algorithm will mimic ML-style risk calculation. If you later want a real backend, we can connect Supabase for persistence and edge functions.

---

## Pages & Layout

**Dark-mode sidebar layout** with navigation:
1. **Dashboard** (home) — key metrics + live feed
2. **Transactions** — full transaction table with filters
3. **Analytics** — charts and trends
4. **Fraud Map** — global heatmap of fraud locations
5. **Admin Panel** — review & manage flagged transactions

---

## Feature Breakdown

### 1. Transaction Simulator
- Background engine generating random transactions every 3–5 seconds
- Randomized: user ID, amount ($1–$50,000), location (global cities), device type, timestamp
- Stores transactions in React state (in-memory)

### 2. AI Fraud Scoring Engine
- Client-side scoring function evaluating 5 risk factors:
  - **Unusual amount** (>$5,000 or very small micro-transactions)
  - **Location change** (different country from user's last transaction)
  - **New device** (device not seen before for that user)
  - **Unusual time** (2am–5am local)
  - **Rapid frequency** (multiple transactions within 60 seconds)
- Each factor contributes weighted points → combined Risk Score (0–100)
- Color-coded: 🟢 Safe (0–30), 🟡 Medium (31–70), 🔴 High (71–100)

### 3. Live Dashboard
- KPI cards: Total Transactions, Flagged Count, Fraud %, Average Risk Score
- Live transaction feed (auto-scrolling table showing latest ~50 transactions)
- Real-time red alert toast/banner when a high-risk transaction appears

### 4. Explainable AI Panel
- Clicking any transaction opens a detail drawer/modal
- Shows transaction details + risk breakdown with each contributing factor and its weight
- Visual bar showing factor contributions to the total score

### 5. Analytics Page
- **Risk Distribution** — pie/donut chart (Safe vs Medium vs High)
- **Fraud Trends Over Time** — line chart of flagged transactions per minute
- **Top Fraud Locations** — bar chart by city
- **Amount Distribution** — histogram of transaction amounts
- Built with Recharts (already installed)

### 6. Fraud Heatmap
- World map visualization showing fraud hotspots by city
- Implemented as a stylized SVG/CSS dot map with bubble sizes representing fraud density
- City coordinates mapped to a simplified world projection

### 7. Admin Panel
- Table of all flagged (high-risk) transactions
- Admin actions: "Confirm Fraud" or "Mark Safe" buttons per row
- Status badges showing pending/confirmed/cleared
- Summary stats at top

---

## Design
- **Dark mode by default** — deep navy/charcoal background
- Stripe/banking-inspired clean card layout with subtle borders
- Color palette: dark backgrounds, teal/cyan accents, red for alerts, green for safe
- Smooth animations on data updates
- Responsive for desktop-first with tablet support

