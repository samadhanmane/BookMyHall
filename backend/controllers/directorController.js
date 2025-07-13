import appointmentModel from "../models/appointmentModel.js";
import hallModel from "../models/hallModel.js";
import Director from '../models/directorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// List all bookings pending director approval (guestroom/vehicle only)
export const listPendingDirectorBookings = async (req, res) => {
    try {
        const pending = await appointmentModel.find({
            coordinatorDecision: 'approved',
            directorDecision: 'pending',
            cancelled: false
        }).populate('userId hallId');
        // Only guestroom/vehicle
        const filtered = pending.filter(app => app.hallId && (app.hallId.isGuestRoom || app.hallId.isVehicle));
        // Add status field for frontend clarity
        const bookings = filtered.map(app => ({
            ...app.toObject(),
            userData: app.userId ? app.userId : { name: 'Unknown', email: '-' },
            hallData: app.hallId ? app.hallId : { name: 'Unknown', email: '-' },
            status: 'Pending Director Approval',
        }));
        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error in listPendingDirectorBookings:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Director approval/rejection for guestroom/vehicle bookings
export const directorDecision = async (req, res) => {
    try {
        const { role } = req.user || {};
        if (role !== 'director') {
            return res.status(403).json({ success: false, message: 'Unauthorized: Only directors can approve/reject at this stage.' });
        }
        const { appointmentId, decision, comment } = req.body;
        if (!appointmentId || !['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ success: false, message: 'Invalid request.' });
        }
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }
        // Only allow for guestroom or vehicle
        const hall = await hallModel.findById(appointment.hallId);
        if (!hall || (!hall.isGuestRoom && !hall.isVehicle)) {
            return res.status(400).json({ success: false, message: 'Only guestroom and vehicle bookings require director approval.' });
        }
        // Only allow if coordinator already approved and director hasn't decided
        if (appointment.coordinatorDecision !== 'approved' || appointment.directorDecision !== 'pending') {
            return res.status(400).json({ success: false, message: 'Booking not pending director approval.' });
        }
        // Update appointment
        appointment.directorDecision = decision;
        appointment.directorComment = comment || '';
        appointment.statusHistory = appointment.statusHistory || [];
        appointment.statusHistory.push({
            status: `director_${decision}`,
            by: 'director',
            comment: comment || '',
            date: new Date()
        });
        await appointment.save();
        res.json({ success: true, message: `Booking ${decision} by director.`, appointment });
    } catch (error) {
        console.error('Error in directorDecision:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Director login
export const loginDirector = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }
        const director = await Director.findOne({ email });
        if (!director) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, director.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ id: director._id, email: director.email, role: 'director' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token, director: { name: director.name, email: director.email } });
    } catch (error) {
        console.error('Error in loginDirector:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}; 