import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DirectorContext } from '../context/DirectorContext';
import { assets } from '../assets/assets.js';
import axios from 'axios';

const DirectorDashboard = () => {
  const { dToken, backendUrl, logoutDirector } = useContext(DirectorContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!dToken) {
      navigate('/director/login');
      return;
    }
    fetchBookings();
    // eslint-disable-next-line
  }, [dToken]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${backendUrl}/api/director/pending-bookings`, {
        headers: { dtoken: dToken },
      });
      if (data.success) {
        setBookings(data.bookings);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id, decision) => {
    setActionLoading(true);
    setSelectedId(id);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/director/decision`,
        { appointmentId: id, decision, comment },
        { headers: { dtoken: dToken } }
      );
      if (data.success) {
        fetchBookings();
        setComment('');
      } else {
        setError(data.message || 'Action failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="font-[Poppins] text-[#030303] min-h-screen bg-[#f9f9f9]">
      {/* Navbar */}
      <div className="flex justify-between items-center px-10 py-7 border-b-2 border-gray-300 bg-white" style={{ minHeight: '90px' }}>
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <img
            onClick={() => navigate('/director-dashboard')}
            className="w-52 sm:w-60 cursor-pointer rounded-md object-contain transition-transform duration-200 hover:scale-105 drop-shadow-lg"
            src={assets.MITAOE_logo}
            alt='College Logo'
          />
          <span className='flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-[#030303] border border-[#030303] bg-gray-50'>
            {/* Optionally add an icon here: <img src={assets.admin_logo} alt="Director" className="w-6 h-6 rounded-full" /> */}
            Director
          </span>
        </div>
        {/* Logout Button */}
        <button
          onClick={logoutDirector}
          className="bg-primary text-white py-2 px-6 rounded-md font-semibold hover:bg-primary-dark transition text-base"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="m-5">
        {/* Header Cards */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3 bg-white p-4 min-w-52 rounded border border-gray-200 shadow-sm shadow-black hover:shadow-md transition-all duration-200">
            <img className="w-12 h-12 object-contain rounded-md shadow-sm" src={assets.appointments_icon} alt="pending" />
            <div>
              <p className="text-xl font-semibold">{bookings.length}</p>
              <p className="text-[#123458] font-medium">Bookings Pending Approval</p>
            </div>
          </div>
          <div className="flex-1" />
        </div>

        {/* Latest Bookings Section */}
        <div className="bg-white rounded shadow-sm shadow-black border">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-[#123458] text-white rounded-t">
            <img src={assets.list_icon} alt="list" className="w-5 h-5" />
            <p className="font-semibold">Pending Bookings</p>
          </div>

          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : bookings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No pending bookings for approval.</div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b._id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all"
                >
                  <img
                    className="rounded-md w-12 h-12 object-cover shadow-sm shadow-black"
                    src={b.hallId?.image || assets.hall_icon}
                    alt="facility"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{b.hallId?.name || 'Facility'}</p>
                    <p className="text-xs text-gray-600 mb-1">Type: {b.hallId?.isGuestRoom ? 'Guest Room' : b.hallId?.isVehicle ? 'Vehicle' : 'Facility'}</p>
                    <p className="text-xs text-gray-600">User: {b.userId?.name} ({b.userId?.email})</p>
                    <p className="text-xs text-gray-600">Date: {b.slotDate} | Time: {b.slotTime}</p>
                    {b.reason && <p className="text-xs text-gray-600">Reason: {b.reason}</p>}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <textarea
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="Comment (optional)"
                      value={selectedId === b._id ? comment : ''}
                      onChange={e => setComment(e.target.value)}
                      disabled={actionLoading && selectedId === b._id}
                    />
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition text-sm font-medium"
                        disabled={actionLoading && selectedId === b._id}
                        onClick={() => handleDecision(b._id, 'approved')}
                      >
                        {actionLoading && selectedId === b._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition text-sm font-medium"
                        disabled={actionLoading && selectedId === b._id}
                        onClick={() => handleDecision(b._id, 'rejected')}
                      >
                        {actionLoading && selectedId === b._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard; 