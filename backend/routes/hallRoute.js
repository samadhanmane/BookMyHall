import express from 'express'
import { hallList, loginHall, appointmentsHall, appointmentComplete, appointmentCancel, hallDashboard, hallProfile, updateHallProfile, appointmentRequest, sendOtp, verifyOtp, changeAvailability, updateHallEmail, getCoordinatorGuestRooms, updateGuestRoom, uploadImage, getHalls, getHallFeedbacks, reviewFeedback, getHallRatings, getCoordinatorVehicles, updateVehicle, bookingDecision, allCoordinatorAppointments } from '../controllers/hallController.js'
import authHall from '../middlewares/authHall.js'

const hallRouter = express.Router()

// Public routes
hallRouter.post('/login', loginHall)
hallRouter.get('/list', hallList)
hallRouter.post('/send-otp', sendOtp)
hallRouter.post('/forgot-password', sendOtp)
hallRouter.post('/verify-otp', verifyOtp)
hallRouter.post('/reset-password', verifyOtp)

// Protected routes
hallRouter.post('/change-availability', authHall, changeAvailability)
hallRouter.post('/appointment-request', authHall, appointmentRequest)
hallRouter.post('/appointment-complete', authHall, appointmentComplete)
hallRouter.post('/appointment-cancel', authHall, appointmentCancel)
hallRouter.post('/update-email', authHall, updateHallEmail)
hallRouter.get('/dashboard', authHall, hallDashboard)
hallRouter.get('/profile', authHall, hallProfile)
hallRouter.post('/update-profile', authHall, updateHallProfile)
hallRouter.get('/appointments', authHall, appointmentsHall)
hallRouter.get('/coordinator-guest-rooms', authHall, getCoordinatorGuestRooms)
hallRouter.get('/coordinator-vehicles', authHall, getCoordinatorVehicles)
hallRouter.post('/update-guest-room', authHall, updateGuestRoom)
hallRouter.post('/update-vehicle', authHall, updateVehicle)
hallRouter.post('/upload-image', authHall, uploadImage)
hallRouter.get('/get-halls', authHall, getHalls)
hallRouter.get('/feedbacks', authHall, getHallFeedbacks)
hallRouter.patch('/review-feedback', authHall, reviewFeedback)
hallRouter.get('/ratings', getHallRatings)
hallRouter.post('/booking-decision', authHall, bookingDecision)
hallRouter.get('/all-appointments', authHall, allCoordinatorAppointments)

export default hallRouter
