import express from 'express';
import { addHalls, loginAdmin, allHalls, appointmentsAdmin, AppointmentCancel, adminDashboard, AppointmentComplete, requestAcceptance, getCoordinatorGuestRooms } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Route to get all guest rooms for a coordinator
router.post('/coordinator-guest-rooms', verifyToken, getCoordinatorGuestRooms);

// ... existing code ...

export default router; 