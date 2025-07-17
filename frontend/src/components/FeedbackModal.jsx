import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const FeedbackModal = ({ open, onClose, onSubmit, loading, facilityType }) => {
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState('');
  const [helpful, setHelpful] = useState('');
  const [improvement, setImprovement] = useState('');
  // Hall-specific
  const [audioVisual, setAudioVisual] = useState('');
  const [seatingComfort, setSeatingComfort] = useState('');
  // Guest room-specific
  const [bedComfort, setBedComfort] = useState('');
  const [amenities, setAmenities] = useState('');
  // Vehicle-specific
  const [vehicleCondition, setVehicleCondition] = useState('');
  const [timeliness, setTimeliness] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prepare feedback data based on type
    let feedbackData = { rating, cleanliness, helpful, improvement };
    if (facilityType === 'hall') {
      feedbackData = { ...feedbackData, audioVisual, seatingComfort };
    } else if (facilityType === 'guest room') {
      feedbackData = { ...feedbackData, bedComfort, amenities };
    } else if (facilityType === 'vehicle') {
      feedbackData = { ...feedbackData, vehicleCondition, timeliness };
    }
    onSubmit(feedbackData);
  };

  if (!open) return null;

  // Render questions based on facility type
  let extraQuestions = null;
  if (facilityType === 'hall') {
    extraQuestions = <>
      <div>
        <label className="block font-medium mb-1">Audio/Visual Equipment</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={audioVisual}
          onChange={e => setAudioVisual(e.target.value)}
          placeholder="Was the AV equipment satisfactory?"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Seating Comfort</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={seatingComfort}
          onChange={e => setSeatingComfort(e.target.value)}
          placeholder="Was the seating comfortable?"
          disabled={loading}
        />
      </div>
    </>;
  } else if (facilityType === 'guest room') {
    extraQuestions = <>
      <div>
        <label className="block font-medium mb-1">Bed Comfort</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={bedComfort}
          onChange={e => setBedComfort(e.target.value)}
          placeholder="Was the bed comfortable?"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Amenities</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={amenities}
          onChange={e => setAmenities(e.target.value)}
          placeholder="Were the amenities satisfactory?"
          disabled={loading}
        />
      </div>
    </>;
  } else if (facilityType === 'vehicle') {
    extraQuestions = <>
      <div>
        <label className="block font-medium mb-1">Vehicle Condition</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={vehicleCondition}
          onChange={e => setVehicleCondition(e.target.value)}
          placeholder="Was the vehicle in good condition?"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Timeliness</label>
        <input
          type="text"
          className="w-full border border-gray-400 rounded px-3 py-2"
          value={timeliness}
          onChange={e => setTimeliness(e.target.value)}
          placeholder="Was the vehicle on time?"
          disabled={loading}
        />
      </div>
    </>;
  }

  // Default to generic if type is missing
  if (!extraQuestions) {
    extraQuestions = null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-50 rounded-xl shadow-lg w-full max-w-md p-8 border border-[#123458]/30 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-[#123458]">Share Your Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-medium mb-1">Overall Experience</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  onClick={() => setRating(star)}
                  disabled={loading}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <StarIcon className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Cleanliness</label>
            <input
              type="text"
              className="w-full border border-gray-400 rounded px-3 py-2"
              value={cleanliness}
              onChange={e => setCleanliness(e.target.value)}
              placeholder="Was the facility clean?"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Was the staff/coordinator helpful?</label>
            <input
              type="text"
              className="w-full border border-gray-400 rounded px-3 py-2"
              value={helpful}
              onChange={e => setHelpful(e.target.value)}
              placeholder="Yes/No or describe briefly"
              disabled={loading}
            />
          </div>
          {extraQuestions}
          <div>
            <label className="block font-medium mb-1">Suggestions for Improvement</label>
            <textarea
              className="w-full border border-gray-400 rounded px-3 py-2"
              value={improvement}
              onChange={e => setImprovement(e.target.value)}
              placeholder="Any suggestions for improvement?"
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-[#123458]/20 bg-gray-200 text-gray-700 font-semibold shadow"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg border-none bg-[#123458] text-white font-semibold shadow"
              disabled={loading || rating === 0}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal; 