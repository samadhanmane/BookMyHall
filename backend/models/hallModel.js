import mongoose from "mongoose";

const hallSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String, required:true }, // Changed default value to an empty string
    speciality: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    isGuestRoom: { type: Boolean, default: false }, // New field to differentiate between halls and guest rooms
   
    address: { 
        line1: { type: String, required: true },
        line2: { type: String, required: true }
    },

    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} }
}, { minimize: false });

// Add a simple index for email uniqueness only for halls
hallSchema.index({ email: 1 }, { 
    unique: true,
    partialFilterExpression: { isGuestRoom: false } // Only enforce uniqueness for halls
});

const hallModel = mongoose.models.hall || mongoose.model('hall', hallSchema);

export default hallModel;
