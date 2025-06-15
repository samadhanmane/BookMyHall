import mongoose, { mongo } from "mongoose"


const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    hallId: { type: String, required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    userData: {type: Object, required: true },
    hallData: {type: Object, required: true },
    bookingDuration: { type: Number, default: 1 }, // Duration in days (1, 3, or 7) for guest rooms
  
    date: {type: Number, required:true},
    cancelled:{type: Boolean, default: false},
    payment: {type: Boolean, default: false},
    isCompleted: {type:Boolean, default: false},
    isAccepted: {type:Boolean, default: false}

})

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment', appointmentSchema)
export default appointmentModel