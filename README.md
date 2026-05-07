# Quick-Wash: Premium Laundry Logistics Platform

Quick-Wash is a high-performance, student-focused laundry platform built for modern campus life. It streamlines the connection between **Customers**, **Vendors (Laundries)**, and **Riders**, ensuring efficient service delivery with built-in trust and cultural resonance.

## 🚀 Architecture Overview

Quick-Wash follows a **decoupled full-stack architecture**:
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/UI, and Motion for fluid animations.
- **Backend**: Node.js, Express, MongoDB/Mongoose, and Socket.io for real-time order tracking and communication.

## 🏗️ Tech Stack (Frontend)

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI
- **Animations**: motion (framer-motion)
- **State Management**: React Hooks & Context API
- **Real-time**: Socket.io-client

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A running instance of the Quick-Wash Backend

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (see below).
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5005
# Note: In development, the Next.js rewrite in next.config.ts 
# handles requests to /api by proxying to the backend.
```

## 📦 Key Directory Structure

```text
/
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── (admin)/          # Admin Dashboard
│   ├── (customer)/       # Customer Modules (Order, Track, History)
│   ├── (rider)/          # Rider Dashboard & Operations
│   ├── (vendor)/         # Vendor Dashboard & Price List
│   └── chat/             # Real-time Chat Interface
├── components/           # Reusable UI Components
│   ├── shared/           # Cross-module components (Sidebar, BottomNav)
│   └── ui/               # Base UI primitives (Shadcn)
├── lib/                  # Utility functions & API Service
├── hooks/                # Custom React Hooks (Auth, etc.)
└── backend/              # Decoupled Backend Service (see backend/README.md)
```

## 📜 Core Business Rules

- **First-to-Claim**: Riders compete for orders in real-time. Atomic locks prevent double-assignment.
- **Trust Point Engine**: Users maintain visibility and access based on a behavioral score (0-100).
- **Yoruba Audio Triggers**: High-visibility actions trigger cultural audio cues for better engagement in the local context.
- **Privacy First**: Data isolation at every level—users only see what belongs to them.

## 🛡️ Authentication

Authentication is handled via JWT. Tokens are managed securely in the browser and cleared instantly upon logout to prevent unauthorized access.

---
© 2026 Quick-Wash. All Rights Reserved.
