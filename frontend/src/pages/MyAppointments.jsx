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
      <h2 className="text-2xl font-bold mb-6">My Facility Bookings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 border-2 border-gray-400 rounded-lg p-8">
            You have not booked any facilities yet.
          </div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment._id} className="border-2 border-gray-400 rounded-lg p-6 bg-white flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-lg">{appointment.facilityId?.name || 'Facility'}</span>
                <span className="text-sm text-gray-500">{appointment.facilityId?.type}</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Date:</span> {appointment.date}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium">Time:</span> {appointment.time}
              </div>
              {/* Vehicle-specific details */}
              {appointment.facilityId?.isVehicle && (
                <>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Vehicle Type:</span> {appointment.facilityId?.speciality}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Seating:</span> {appointment.facilityId?.experience}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Description:</span> {appointment.facilityId?.about}
                  </div>
                </>
              )}
              {/* Add more facility-specific details here if needed */}
              {appointment.reason && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Reason:</span> {appointment.reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
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
