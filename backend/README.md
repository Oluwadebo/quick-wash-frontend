# Quick-Wash Backend API

The engine behind the Quick-Wash platform, providing secure data management, real-time communication, and core business logic orchestration.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Auth**: JSON Web Tokens (JWT)
- **Language**: TypeScript

## 🏗️ Core Business Logic

### 1. Trust Point Engine (Range 0-100)
- **Starting Point**: 50 points.
- **Recovery**: +10 points every 27 days of consistent good behavior.
- **Penalties**: 
  - Late Delivery (>20m): -10 points.
  - Rider Abandonment: -15 points.
  - Fake Dispute: -20 points.
  - 3x Monthly Cancellation: -25 points + 2-day ban.
- **Tier Restrictions**:
  - < 40: 1-day ban.
  - < 30: Suspension/Appeal required.
  - < 10: Permanent Ban risk.

### 2. Atomic Transactions
The backend utilizes Mongoose sessions/transactions for critical "Order Acceptance" logic to ensure that an order can only be claimed by one rider in a high-concurrency environment.

### 3. Rider Return Logic
Riders can return an order with a reason, triggering minor wallet deductions and trust point penalties. 3 consecutive returns result in a 2-day suspension.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`.

### Running the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🔐 Environment Variables

Create a `backend/.env` file:

```env
PORT=5005
MONGODB_URI=mongodb://127.0.0.1:27017/quick-wash
JWT_SECRET=your_jwt_secret_here
BACKEND_PORT=5005
# Add other production keys as needed
```

## 📡 API Endpoints (Summary)

- **Auth**: `/api/auth/*` (Login, Register, fetch user profile)
- **Users**: `/api/users/*` (Update profile, Trust points, Rider docs)
- **Orders**: `/api/orders/*` (Create, Update status, Claim, Handover)
- **Vendors**: `/api/vendors/*` (Price lists, Stats)
- **Site Settings**: `/api/settings/*` (Maintenance, Landmarks, Global fees)

## 📁 Directory Structure

```text
/backend
├── controllers/    # Request handlers & Business logic
├── middleware/     # Auth (JWT), Admin, and Error guards
├── models/         # Mongoose Schemas (User, Order, SiteSetting, etc.)
├── routes/         # Express Route definitions
├── lib/            # Shared utilities (Socket.io, DB connection)
└── server.ts       # Entry point
```

## 🛡️ Security
- **JWT Protection**: All sensitive endpoints require a valid Bearer token.
- **Role Guards**: Specific routes restricted to Admin, Vendor, or Rider roles.
- **Verification**: Mandatory NIN and Phone 11-digit regex validation.

---
© 2026 Quick-Wash Backend.
