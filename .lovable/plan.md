

## User Intelligence Page

### Overview
Add a `/users` page that computes behavioral profiles from existing transaction data (via `useTransactions()`) and displays them as a searchable card grid. Clicking a card opens a drawer with full history and a timeline chart.

### New Files

**`src/pages/UserIntelligence.tsx`** — Main page component:
- Consume `useTransactions()` to get all transactions
- Group transactions by `userId` using `useMemo`
- For each user, compute a `UserProfile` object:
  - **Amount stats**: min, avg, max from their transactions
  - **Top devices**: count occurrences of `deviceType`, sort descending
  - **Top locations**: count occurrences of `location.name`, sort descending
  - **Active hours heatmap**: 24-slot array counting transactions per hour
  - **Behavioral risk score**: compare recent transactions (last 10) against their baseline — flag deviations in amount (>2x avg), new locations, new devices; score 0–100
- Render a search input filtering by user ID
- Render a responsive grid of `UserProfileCard` components
- State for selected user → opens a `Sheet` (drawer) with:
  - Full transaction table (reuse existing table pattern)
  - A Recharts `LineChart` showing transaction amounts over time

**`src/components/UserProfileCard.tsx`** — Card component:
- Display user ID, transaction count, amount range (min–max), avg amount
- Top 2 devices and locations as badges
- 24-hour heatmap as a row of small colored cells (green→yellow→red by density)
- Behavioral risk score with color coding (green <30, yellow 30–60, red >60)

**`src/lib/user-profile.ts`** — Pure computation functions:
- `computeUserProfiles(transactions)` → `Map<string, UserProfile>`
- `calculateBehavioralRisk(userTxns)` → number
- Types: `UserProfile` interface

### Modified Files

**`src/App.tsx`** — Add route `/users` → `UserIntelligence`

**`src/components/AppSidebar.tsx`** — Add "User Intel" nav item with `Users` icon between Analytics and Fraud Map

### Technical Details
- All computation is client-side from the existing transaction context (no new DB tables needed)
- Hours heatmap: extract `getHours()` from each transaction timestamp, render 24 cells with opacity/color based on count
- Behavioral risk formula: weighted sum of (amount deviation from personal mean, location diversity in last 10 vs history, new device usage rate)
- Timeline chart: Recharts `AreaChart` with timestamp on X-axis, amount on Y-axis, dots colored by risk level
- Drawer uses the existing `Sheet` component from `src/components/ui/sheet.tsx`

