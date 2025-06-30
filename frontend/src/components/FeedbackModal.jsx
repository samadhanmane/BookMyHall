import React, { useState } from 'react';

const FeedbackModal = ({ open, onClose, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState('');
  const [descriptionMatch, setDescriptionMatch] = useState('');
  const [electricity, setElectricity] = useState('');
  const [otherComments, setOtherComments] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, cleanliness, descriptionMatch, electricity, otherComments });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-4">Share Your Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Rating</label>
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
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium mb-1">Cleanliness</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={cleanliness}
              onChange={e => setCleanliness(e.target.value)}
              placeholder="Was the facility clean?"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description Match</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={descriptionMatch}
              onChange={e => setDescriptionMatch(e.target.value)}
              placeholder="Did the facility match the description?"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Electricity</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={electricity}
              onChange={e => setElectricity(e.target.value)}
              placeholder="Any issues with electricity?"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Other Comments</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={otherComments}
              onChange={e => setOtherComments(e.target.value)}
              placeholder="Share anything else..."
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded border bg-gray-200 text-gray-700"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded border bg-[#123458] text-white font-semibold"
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