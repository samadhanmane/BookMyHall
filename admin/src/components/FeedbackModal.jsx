import React, { useState, useEffect } from 'react';

const FeedbackModal = ({ open, onClose, onSubmit, loading, adminMode = false, adminRating, setAdminRating, adminMessage, setAdminMessage, feedback }) => {
  const [rating, setRating] = useState(0);
  const [cleanliness, setCleanliness] = useState('');
  const [descriptionMatch, setDescriptionMatch] = useState('');
  const [electricity, setElectricity] = useState('');
  const [otherComments, setOtherComments] = useState('');

  const isReviewed = feedback && (feedback.adminRating || feedback.adminMessage);

  useEffect(() => {
    if (!open && !adminMode) {
      setRating(0);
      setCleanliness('');
      setDescriptionMatch('');
      setElectricity('');
      setOtherComments('');
    }
  }, [open, adminMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (adminMode) {
      onSubmit(e);
    } else {
      onSubmit({ rating, cleanliness, descriptionMatch, electricity, otherComments });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-center">{adminMode ? 'User Feedback' : 'Share Your Feedback'}</h2>
        {adminMode && feedback && (
          <div className="mb-6 border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-[#123458]">{feedback.userId?.name || 'User'}</span>
              <span className="flex gap-1 ml-2">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className={`text-lg ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                ))}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-1">{new Date(feedback.createdAt).toLocaleString()}</div>
            <div className="text-sm text-gray-700 mb-1"><b>Cleanliness:</b> {feedback.cleanliness}</div>
            <div className="text-sm text-gray-700 mb-1"><b>Description Match:</b> {feedback.descriptionMatch}</div>
            <div className="text-sm text-gray-700 mb-1"><b>Electricity:</b> {feedback.electricity}</div>
            <div className="text-sm text-gray-700 mb-1"><b>Other Comments:</b> {feedback.otherComments}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {adminMode ? (
            isReviewed ? (
              <div className="mt-4 p-4 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#123458]">Your Review</span>
                  {feedback.adminRating && (
                    <span className="flex gap-1 ml-2">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-lg ${star <= feedback.adminRating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </span>
                  )}
                </div>
                {feedback.adminMessage && <div className="text-sm text-gray-700">{feedback.adminMessage}</div>}
                {feedback.adminReviewedAt && <div className="text-xs text-gray-400 mt-1">Reviewed on {new Date(feedback.adminReviewedAt).toLocaleString()}</div>}
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-medium mb-1">Your Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`text-2xl ${star <= (adminRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        onClick={() => setAdminRating(star)}
                        disabled={loading}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Message to User</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    value={adminMessage || ''}
                    onChange={e => setAdminMessage(e.target.value)}
                    placeholder="Write a message to the user..."
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </>
            )
          ) : (
            <>
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
                  placeholder="Was the hall/room clean?"
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
                  placeholder="Did the hall/room match the description?"
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
            </>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded border bg-gray-200 text-gray-700"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            {(!adminMode || !isReviewed) && (
              <button
                type="submit"
                className="px-4 py-2 rounded border bg-[#123458] text-white font-semibold"
                disabled={loading || (adminMode ? adminRating === 0 : rating === 0)}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal; 