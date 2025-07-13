import express from 'express';
import { listPendingDirectorBookings, directorDecision, loginDirector } from '../controllers/directorController.js';
import authDirector from '../middlewares/authDirector.js';

const directorRouter = express.Router();

directorRouter.post('/login', loginDirector);
directorRouter.get('/pending-bookings', authDirector, listPendingDirectorBookings);
directorRouter.post('/decision', authDirector, directorDecision);

export default directorRouter; 