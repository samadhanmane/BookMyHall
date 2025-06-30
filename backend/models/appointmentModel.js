import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hallId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    bookingDuration: { type: Number, default: 1 }, // Duration in days (1, 3, or 7) for guest rooms
    isAccepted: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
})

const Appointment = mongoose.model('Appointment', appointmentSchema)
export default Appointment