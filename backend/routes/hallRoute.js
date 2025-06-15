import express from 'express'
import { hallList,loginHall,appointmentsHall,appointmentComplete,appointmentCancel,hallDashboard,hallProfile,updateHallProfile,appointmentRequest,sendOtp,verifyOtp,changeAvailability,updateHallEmail,getCoordinatorGuestRooms,updateGuestRoom,uploadImage, getHalls } from '../controllers/hallController.js'
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
hallRouter.post('/update-guest-room', authHall, updateGuestRoom)
hallRouter.post('/upload-image', authHall, uploadImage)
hallRouter.get('/get-halls', authHall, getHalls)

export default hallRouter
