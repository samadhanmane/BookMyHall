import mongoose from "mongoose";

const hallSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required:true }, // Changed default value to an empty string
    speciality: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
   
    address: { 
        line1: { type: String, required: true },
        line2: { type: String, required: true }
    },

    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} }
}, { minimize: false });

const hallModel = mongoose.models.hall || mongoose.model('hall', hallSchema);

export default hallModel;
