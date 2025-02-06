import express from 'express'
import { hallList,loginHall,appointmentsHall,appointmentComplete,appointmentCancel,hallDashboard,hallProfile,updateHallProfile,appointmentRequest} from '../controllers/hallController.js'
import authHall from '../middlewares/authHall.js'

const hallRouter = express.Router()

hallRouter.get('/list',hallList)
hallRouter.post('/login',loginHall)
hallRouter.get('/appointments',authHall,appointmentsHall)
hallRouter.post('/complete-appointment',authHall,appointmentComplete)
hallRouter.post('/cancel-appointment',authHall,appointmentCancel)
hallRouter.get('/dashboard',authHall,hallDashboard)
hallRouter.get('/profile',authHall,hallProfile)
hallRouter.post('/update-profile',authHall,updateHallProfile)
hallRouter.post('/request-appointment',authHall,appointmentRequest)



export default hallRouter
