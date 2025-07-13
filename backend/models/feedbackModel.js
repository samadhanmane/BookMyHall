import mongoose from 'mongoose';


const feedbackSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  cleanliness: {
    type: String,
    required: false,
  },
  helpful: {
    type: String,
    required: false,
  },
  bookingProcess: {
    type: String,
    required: false,
  },
  facilityCondition: {
    type: String,
    required: false,
  },
  improvement: {
    type: String,
    required: false,
  },
  descriptionMatch: {
    type: String,
    required: false,
  },
  electricity: {
    type: String,
    required: false,
  },
  otherComments: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false,
  },
  adminRating: {
    type: Number,
    min: 1,
    max: 5,
    required: false,
  },
  adminMessage: {
    type: String,
    required: false,
  },
  adminReviewedAt: {
    type: Date,
    required: false,
  },
});

export default mongoose.model('Feedback', feedbackSchema); 