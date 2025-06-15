import express from 'express'
import { addHalls, allHalls, loginAdmin,appointmentsAdmin,AppointmentCancel,adminDashboard,AppointmentComplete,requestAcceptance, getCoordinatorGuestRooms, getAllHallsAndRooms, deleteHallOrRoom } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/hallController.js'


const adminRouter = express.Router()

adminRouter.post('/add-hall',authAdmin,upload.single('image'),addHalls)
adminRouter.post('/login',loginAdmin)
adminRouter.post('/all-halls',authAdmin,allHalls)
adminRouter.post('/change-availability',authAdmin,changeAvailability)
adminRouter.get('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/appointment-cancel',authAdmin,AppointmentCancel)
adminRouter.post('/complete-appointment',authAdmin,AppointmentComplete)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
adminRouter.post('/request-acceptance',authAdmin,requestAcceptance)
adminRouter.get('/coordinator-guest-rooms', authAdmin, getCoordinatorGuestRooms)
adminRouter.get('/all-halls-and-rooms', authAdmin, getAllHallsAndRooms)
adminRouter.post('/delete-hall-or-room', authAdmin, deleteHallOrRoom)

export default adminRouter