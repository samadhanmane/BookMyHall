import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, sendOtp, verifyOtp, getAllUsers } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const router = express.Router()

// Auth routes
router.post('/register', registerUser)
router.post('/login', loginUser)

// Password reset routes
router.post('/reset-password-request', sendOtp)
router.post('/reset-password', verifyOtp)

// Protected routes
router.get('/profile', authUser, getProfile)
router.post('/update-profile', upload.single('image'), authUser, updateProfile)
router.post('/book-appointment', authUser, bookAppointment)
router.get('/appointments', authUser, listAppointment)
router.post('/cancel-appointment', authUser, cancelAppointment)
router.get('/all', getAllUsers)

export default router