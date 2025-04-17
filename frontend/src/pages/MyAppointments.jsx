import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyAppointments = () => {
  const { backendUrl, token, getHallsData, getAppointments } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [cancellingIds, setCancellingIds] = useState([]);

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    if (token) {
      getAppointments();
      getUserAppointments();
    }
  }, [token]);

  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('-');
    return `${dateArray[0]} ${months[+dateArray[1]]} ${dateArray[2]}`;
  };

  const getUserAppointments = async () => {
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

  return (
    <div className="min-h-screen px-6 sm:px-10 py-10 bg-white font-poppins text-[#030303]">
      <h2 className="text-2xl font-semibold border-b border-[#ddd] pb-3 mb-6">My Appointments</h2>

      {appointments.length === 0 ? (
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
                <p className="mb-1">{item.speciality}</p>
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
                  <span className="text-sm py-2 border border-green-500 rounded text-green-600 text-center shadow">
                    Appointment Completed
                  </span>
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
    </div>
  );
};

export default MyAppointments;
