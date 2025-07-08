# BookMyFacility

BookMyFacility is a modern, unified platform for booking and managing a variety of facilities—including halls, guest rooms, and vehicles—designed for college and institutional use. The platform provides seamless booking, management, and feedback features for both users and administrators, with a consistent, professional interface.

## Features
- Book and manage facilities (halls, guest rooms, vehicles)
- User and admin portals with matching branding
- Facility availability calendar and booking system
- Facility type filters and search
- User profile and booking history
- Feedback and rating system
- Responsive, modern UI with consistent theme
- Secure authentication and role-based access

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Admin Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express, MongoDB
- **Other:** Cloudinary (image uploads), JWT (authentication)

## Project Structure
```
BookMyFacility/
  admin/        # Admin portal (React)
  backend/      # Backend API (Node.js/Express)
  frontend/     # User portal (React)
```

## Setup Instructions

### 1. Clone the Repository
```
git clone <your-repo-url>
cd BookMyFacility
```

### 2. Backend Setup
```
cd backend
npm install
```
Create a `.env` file in the `backend/` directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```
To start the backend server:
```
npm run dev   # For development
npm start     # For production
```

### 3. Frontend Setup (User Portal)
```
cd ../frontend
npm install
npm run dev    # For development
npm run build  # For production build
```

### 4. Admin Frontend Setup
```
cd ../admin
npm install
npm run dev    # For development
npm run build  # For production build
```

### 5. Environment Variables (Frontend/Admin)
If your frontend or admin needs to connect to a remote backend, create a `.env` file in each with:
```
VITE_API_URL=https://your-backend-url.com
```

## Developed By
---
Chaitanya Retawade

**BookMyFacility** — Streamlining facility management for your institution. 