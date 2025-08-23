import express from 'express'
import { addHalls, allHalls, loginAdmin, appointmentsAdmin, AppointmentCancel, adminDashboard, AppointmentComplete, requestAcceptance, getCoordinatorGuestRooms, getAllHallsAndRooms, deleteHallOrRoom, getCoordinatorVehicles, addCoordinator, listCoordinators, deleteCoordinator } from '../controllers/adminController.js'
import upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/hallController.js'
import { listPendingDirectorBookings, directorDecision } from '../controllers/directorController.js';


const adminRouter = express.Router()

adminRouter.post('/add-hall', authAdmin, upload.single('image'), addHalls)
adminRouter.post('/login', loginAdmin)
adminRouter.post('/all-halls', authAdmin, allHalls)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/appointment-cancel', authAdmin, AppointmentCancel)
adminRouter.post('/complete-appointment', authAdmin, AppointmentComplete)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.post('/request-acceptance', authAdmin, requestAcceptance)
adminRouter.get('/coordinator-guest-rooms', authAdmin, getCoordinatorGuestRooms)
adminRouter.get('/coordinator-vehicles', authAdmin, getCoordinatorVehicles)
adminRouter.get('/all-halls-and-rooms', authAdmin, getAllHallsAndRooms)
adminRouter.post('/delete-hall-or-room', authAdmin, deleteHallOrRoom)
adminRouter.post('/add-coordinator', authAdmin, addCoordinator)
adminRouter.get('/list-coordinators', authAdmin, listCoordinators)
adminRouter.post('/delete-coordinator', authAdmin, deleteCoordinator)

const directorRouter = express.Router();

directorRouter.get('/pending-bookings', listPendingDirectorBookings);
directorRouter.post('/decision', directorDecision);

export default adminRouter