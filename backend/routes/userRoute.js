import express from 'express'
import { registerUser,loginUser, getProfile,updateProfile,bookAppointment,listAppointment,cancelAppointment,sendOtp,verifyOtp } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'
import { submitFeedback, getUserFeedbacks } from '../controllers/hallController.js'

const userRouter = express.Router()

// Auth routes
userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

// Password reset routes
userRouter.post('/forgot-password', sendOtp)
userRouter.post('/reset-password', verifyOtp)

// Protected routes
userRouter.get('/get-profile', authUser, getProfile)
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/feedback', authUser, submitFeedback)
userRouter.get('/feedbacks', authUser, getUserFeedbacks)

export default userRouter