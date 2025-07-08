import mongoose from "mongoose";

const hallSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, sparse: true, partialFilterExpression: { isGuestRoom: false, isVehicle: false } },
    password: { type: String, required: true },
    image: { type: String, required: true },
    speciality: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String },
    available: { type: Boolean, default: true },
    isGuestRoom: { type: Boolean, default: false },
    isVehicle: { type: Boolean, default: false },
    address: {
        line1: { type: String, required: function () { return !this.isVehicle; } },
        line2: { type: String, required: function () { return !this.isVehicle; } },
    },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    user_booked_slots: { type: Object, default: {} },
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator' },
    createdAt: { type: Date, default: Date.now },
}, { minimize: false });

const hallModel = mongoose.models.Hall || mongoose.model('Hall', hallSchema);

export default hallModel;
