import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import FeedbackModal from '../components/FeedbackModal';

const MyAppointments = () => {
  const { backendUrl, token, getHallsData, getAppointments } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [cancellingIds, setCancellingIds] = useState([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [userFeedbacks, setUserFeedbacks] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [viewFeedbackModalOpen, setViewFeedbackModalOpen] = useState(false);
  const [viewFeedback, setViewFeedback] = useState(null);

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    if (token) {
      getAppointments();
      getUserAppointments();
      fetchUserFeedbacks();
    }
  }, [token]);

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('-');
    return `${dateArray[0]} ${months[+dateArray[1]]} ${dateArray[2]}`;
  };

  const getUserAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchUserFeedbacks = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/feedbacks`, {
        headers: { token },
      });
      if (data.success) {
        setUserFeedbacks(data.feedbacks);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const hasFeedback = (appointmentId) => {
    return userFeedbacks.some(fb => fb.appointmentId === appointmentId || (fb.appointmentId && fb.appointmentId._id === appointmentId));
  };

  const handleOpenFeedback = (appointment) => {
    setSelectedAppointment(appointment);
    setFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = async (feedbackData) => {
    if (!selectedAppointment) return;
    setFeedbackLoading(true);
    try {
      const res = await axios.post(
        `${backendUrl}/api/user/feedback`,
        {
          appointmentId: selectedAppointment._id,
          ...feedbackData,
        },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success('Feedback submitted!');
        setFeedbackModalOpen(false);
        setSelectedAppointment(null);
        fetchUserFeedbacks();
      } else {
        toast.error(res.data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      setCancellingIds(prev => [...prev, appointmentId]);

      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { userId: token.id, appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        setAppointments(prev =>
          prev.map(appointment =>
            appointment._id === appointmentId
              ? { ...appointment, cancelled: true }
              : appointment
          )
        );
        getHallsData();
      } else {
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setCancellingIds(prev => prev.filter(id => id !== appointmentId));
    }
  };

  const handleViewFeedback = (appointmentId) => {
    const feedback = userFeedbacks.find(fb => fb.appointmentId === appointmentId || (fb.appointmentId && fb.appointmentId._id === appointmentId));
    setViewFeedback(feedback);
    setViewFeedbackModalOpen(true);
  };

  return (
    <div className="min-h-screen px-6 sm:px-10 py-10 bg-white font-poppins text-[#030303]">
      <h2 className="text-2xl font-semibold border-b border-[#ddd] pb-3 mb-6">My Appointments</h2>
      {appointmentsLoading ? (
        <p className="text-zinc-600">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p className="text-zinc-600">No appointments found.</p>
      ) : (
        <div className="space-y-6">
          {appointments.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-6 p-6 border rounded-lg shadow-md shadow-[#00000010] bg-white"
            >
              <div className="w-full sm:w-32 flex-shrink-0">
                <img
                  src={item.hallData.image}
                  alt="Hall"
                  className="w-full h-24 object-cover rounded shadow-sm border"
                />
              </div>

              <div className="flex-1 text-sm text-zinc-700">
                <p className="text-base font-semibold text-[#030303] mb-1">{item.hallData.name}</p>
                <p className="font-medium text-[#030303]">Address:</p>
                <p className="text-xs">{item.hallData.address.line1}</p>
                <p className="text-xs">{item.hallData.address.line2}</p>
                <p className="text-xs mt-2">
                  <span className="text-sm font-medium text-[#030303]">Date & Time:</span>{' '}
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
              </div>

              <div className="flex flex-col justify-center gap-2 sm:min-w-[12rem]">
                {!item.cancelled && !item.isCompleted && !item.isAccepted && (
                  <>
                    <button
                      className="text-sm py-2 rounded border bg-[#123458] text-white shadow transition-all duration-300"
                      disabled
                    >
                      Request Pending
                    </button>

                    <button
                      onClick={() => cancelAppointment(item._id)}
                      disabled={cancellingIds.includes(item._id)}
                      className={`text-sm py-2 rounded border text-white shadow transition-all duration-300 ${
                        cancellingIds.includes(item._id) ? 'bg-gray-400' : 'bg-red-600'
                      }`}
                    >
                      {cancellingIds.includes(item._id) ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  </>
                )}

                {item.cancelled && !item.isCompleted && (
                  <span className="text-sm py-2 border border-red-500 rounded text-red-600 text-center shadow">
                    Appointment Cancelled
                  </span>
                )}

                {item.isCompleted && (
                  <>
                    <span className="text-sm py-2 border border-green-500 rounded text-green-600 text-center shadow">
                      Appointment Completed
                    </span>
                    {!hasFeedback(item._id) && (
                      <button
                        className="mt-2 text-sm py-2 rounded border bg-yellow-500 text-white shadow transition-all duration-300"
                        onClick={() => handleOpenFeedback(item)}
                      >
                        Give Feedback
                      </button>
                    )}
                    {hasFeedback(item._id) && (
                      <button
                        className="mt-2 text-sm py-2 rounded border bg-blue-500 text-white shadow transition-all duration-300"
                        onClick={() => handleViewFeedback(item._id)}
                      >
                        View Feedback
                      </button>
                    )}
                  </>
                )}

                {item.isAccepted && !item.isCompleted && (
                  <span className="text-sm py-2 border border-green-500 rounded text-green-600 text-center shadow">
                    Appointment Confirmed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <FeedbackModal
        open={feedbackModalOpen}
        onClose={() => { setFeedbackModalOpen(false); setSelectedAppointment(null); }}
        onSubmit={handleSubmitFeedback}
        loading={feedbackLoading}
      />
      {viewFeedbackModalOpen && viewFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => { setViewFeedbackModalOpen(false); setViewFeedback(null); }}
            >
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center">Your Feedback</h2>
            <div className="mb-6 border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-[#123458]">{viewFeedback.hallId?.name || 'Hall/Room'}</span>
                <span className="flex gap-1 ml-2">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-lg ${star <= viewFeedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-1">{new Date(viewFeedback.createdAt).toLocaleString()}</div>
              <div className="text-sm text-gray-700 mb-1"><b>Cleanliness:</b> {viewFeedback.cleanliness}</div>
              <div className="text-sm text-gray-700 mb-1"><b>Description Match:</b> {viewFeedback.descriptionMatch}</div>
              <div className="text-sm text-gray-700 mb-1"><b>Electricity:</b> {viewFeedback.electricity}</div>
              <div className="text-sm text-gray-700 mb-1"><b>Other Comments:</b> {viewFeedback.otherComments}</div>
            </div>
            {viewFeedback.adminMessage || viewFeedback.adminRating ? (
              <div className="mt-4 p-4 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#123458]">Coordinator Review</span>
                  {viewFeedback.adminRating && (
                    <span className="flex gap-1 ml-2">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-lg ${star <= viewFeedback.adminRating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </span>
                  )}
                </div>
                {viewFeedback.adminMessage && <div className="text-sm text-gray-700">{viewFeedback.adminMessage}</div>}
                {viewFeedback.adminReviewedAt && <div className="text-xs text-gray-400 mt-1">Reviewed on {new Date(viewFeedback.adminReviewedAt).toLocaleString()}</div>}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
