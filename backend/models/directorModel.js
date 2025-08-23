import mongoose from 'mongoose';

const directorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const Director = mongoose.models.Director || mongoose.model('Director', directorSchema);
export default Director; 