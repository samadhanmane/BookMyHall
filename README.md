# BookMyHall - College Management & Multi-Tenant Facility Booking ERP

BookMyHall is a comprehensive, multi-tenant monorepo application designed to manage college resources, facility bookings, canteen orders, and workshop maintenance. It features an automated approval workflow, role-based access control (RBAC), and an integrated AI Gemini Chatbot for conversational slot booking.

---

## 🚀 Quick Start

### 1. Backend Setup (Express & MongoDB)
```bash
cd backend
cp .env.example .env   # Configure MONGODB_URI, JWT_SECRET, SMTP options, & GEMINI_API_KEY
npm install
npm run dev            # API runs on http://localhost:4000
```

### 2. Frontend Setup (React, Vite & Tailwind CSS)
```bash
cd frontend
cp .env.example .env   # Set VITE_API_URL=http://localhost:4000/api
npm install
npm run dev            # Development server runs on http://localhost:5173
```

---

## 🏛️ Core Modules & Workflows

### 1. Facility & Resource Booking
* **Lock System**: When a user selects a facility slot (e.g. Auditorium, Lab), the system creates a temporary `LOCKED` booking for **5 minutes** to prevent concurrency conflicts.
* **Chatbot Integration**: Users can book facilities conversationally via the AI Chatbot. The chatbot locks the slot, prompts the user for the mandatory booking purpose, and confirms the request.
* **Cancellation**: If a user cancels during checkout, the chatbot or page immediately invokes `releaseLock` to reopen the slot.

### 2. Canteen Requisitions
An sequential approval chain for department food orders:
1. **Submit**: Faculty submits a food requisition for a department event.
2. **HOD Approval**: Department Head reviews and approves/rejects the request.
3. **Registrar Stamp**: Central Registrar stamps and verifies budget availability.
4. **Director Sign-off**: College Director provides final administrative approval.
5. **Canteen Owner**: Receives fully approved orders, manages preparation status, assigns delivery peons, and marks orders as `Delivered`.

### 3. Workshop & Maintenance System
A robust ticketing pipeline for physical infrastructure repairs:
1. **Ticket Creation**: Faculty raises a ticket detailing the problem, category, location, and department.
2. **HOD Verification**: Department HOD approves the ticket to advance it to the central queue.
3. **Workshop HOD Assignment**: Central Workshop HOD reviews active workloads and assigns the ticket to a specific Worker (Technician).
4. **Technician Action**: Worker accepts and marks the ticket as `In Progress`.
5. **Pause & Reopen Flow**:
   * If the worker needs external parts or user action, they can **Pause** the ticket with a mandatory reason. Discussion chat is locked, and email notifications are sent to HODs and the requester.
   * Faculty completes offline steps and clicks **Reopen** (entering a mandatory reason). The ticket status resets to `Assigned`, notifying the technician and panel members to resume.
6. **Completion**: The worker completes the repair, and all panel members receive automated email confirmations that the ticket has closed successfully.

---

## 👥 Roles & Functionalities

| Role | Key Capabilities & Functionality |
| :--- | :--- |
| **Super Admin** | Platform-level administrator. Creates organizations/colleges, assigns Organization Admins, and monitors platform-wide statistics. |
| **Org Admin** | Tenant administrator. Manages user accounts, configures facilities/utilities and categories, monitors analytics, and overrides bookings. |
| **Coordinator** | Resource manager. Assigned to specific utilities (e.g., Lab HOD) to review and approve/reject booking requests. |
| **Head of Department (HOD)** | Department overseer. Approves department-level booking requests, canteen requisitions, and maintenance tickets before they go central. |
| **Registrar** | Financial gatekeeper. Verifies budget availability and stamps canteen/maintenance workflows. |
| **Director** | Executive authority. Grants final administrative sign-off for canteen requisitions. |
| **Canteen Owner** | Canteen manager. Updates preparation states, assigns delivery details, and logs total revenues. |
| **Worker (Technician)** | Workshop field staff. Receives assigned repair tasks, updates progress, pauses tickets with reason, and marks jobs completed. |
| **Faculty (Requester)** | End-user. Books resources (via UI or AI Chatbot), requests department food orders, raises maintenance tickets, and reopens paused tasks. |

---



## 🛠️ Tech Stack & Conventions

* **Backend**: Node.js, Express, MongoDB (Mongoose), Nodemailer (asynchronous background email queues), Gemini Pro API (Chatbot Engine).
* **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide icons, Shadcn UI Components.
* **Security & Auth**: Session-based tokens (`sessionStorage` for immediate logout on tab/window close), Express Rate-Limiter (configured for reverse proxy environments), Route-level RBAC.

---
*Last Updated/Deployed: 31 July 2026 (Chatbot Syntax Fix)*

