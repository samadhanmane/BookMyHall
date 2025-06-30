import mongoose from 'mongoose';

const coordinatorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const Coordinator = mongoose.models.Coordinator || mongoose.model('Coordinator', coordinatorSchema);

export default Coordinator; 