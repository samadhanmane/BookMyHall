import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DirectorContext } from '../context/DirectorContext';
import { CalendarDaysIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import mitaoeLogo from '../assets/MITAOE-logo.png';

const DirectorDashboard = () => {
  const { dToken, backendUrl, logoutDirector } = useContext(DirectorContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [expandedHistory, setExpandedHistory] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!dToken) {
      navigate('/director/login');
      return;
    }
    fetchBookings();
    fetchHistory();
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

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const { data } = await axios.get(`${backendUrl}/api/director/approval-history`, {
        headers: { dtoken: dToken },
      });
      if (data.success) {
        setHistory(data.bookings);
      } else {
        setHistoryError(data.message || 'Failed to fetch approval history');
      }
    } catch (err) {
      setHistoryError(err.response?.data?.message || err.message);
    } finally {
      setHistoryLoading(false);
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

  const toggleExpandHistory = (id) => {
    setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }));
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
            src={mitaoeLogo}
            alt='MITAOE Logo'
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
          <div className="flex items-center gap-3 bg-gray-50 p-4 min-w-52 rounded-xl border border-[#123458]/30 shadow-lg">
            <CalendarDaysIcon className="w-12 h-12 text-[#123458]" />
            <div>
              <p className="text-xl font-semibold">{bookings.length}</p>
              <p className="text-[#123458] font-medium">Bookings Pending Approval</p>
            </div>
          </div>
          <div className="flex-1" />
        </div>

        {/* Latest Bookings Section */}
        <div className="bg-gray-50 rounded-xl shadow-lg border border-[#123458]/30 mb-10">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-[#123458] text-white rounded-t">
            <ListBulletIcon className="w-5 h-5" />
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
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all border-b border-gray-400"
                >
                  {/* Remove facility image, show only name */}
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-lg text-[#123458]">{b.hallId?.name || 'Facility'}</p>
                    <p className="text-xs text-gray-600 mb-1">Type: {b.hallId?.isGuestRoom ? 'Guest Room' : b.hallId?.isVehicle ? 'Vehicle' : 'Facility'}</p>
                    <p className="text-xs text-gray-600">User: {b.userId?.name} ({b.userId?.email})</p>
                    <p className="text-xs text-gray-600">Date: {b.slotDate} | Time: {b.slotTime}</p>
                    {b.reason && <p className="text-xs text-gray-600">Reason: {b.reason}</p>}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <textarea
                      className="border border-gray-400 rounded px-2 py-1 text-sm"
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

        {/* Approval History Section */}
        <div className="bg-gray-50 rounded-xl shadow-lg border border-[#123458]/30">
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-[#123458] text-white rounded-t">
            <ListBulletIcon className="w-5 h-5" />
            <p className="font-semibold">Director Approval History</p>
          </div>
          <div className="divide-y max-h-[70vh] overflow-y-auto">
            {historyLoading ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : historyError ? (
              <div className="text-center text-red-600 py-8">{historyError}</div>
            ) : history.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No approval history found.</div>
            ) : (
              history.map((h) => (
                <div
                  key={h._id}
                  className="flex flex-col md:flex-row md:items-center gap-2 px-6 py-4 hover:bg-gray-50 transition-all border-b border-gray-400"
                >
                  <div className="flex-1 text-sm">
                    <p className="font-bold text-lg text-[#123458]">{h.hallData?.name || 'Facility'}</p>
                    <p className="text-xs text-gray-600 mb-1">Type: {h.hallData?.isGuestRoom ? 'Guest Room' : h.hallData?.isVehicle ? 'Vehicle' : 'Facility'}</p>
                    <p className="text-xs text-gray-600">User: {h.userData?.name} ({h.userData?.email})</p>
                    <p className="text-xs text-gray-600">Date: {h.slotDate} | Time: {h.slotTime}</p>
                    {h.reason && <p className="text-xs text-gray-600">Reason: {h.reason}</p>}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <span className={`font-semibold text-sm ${h.directorDecision === 'approved' ? 'text-green-600' : 'text-red-600'}`}>{h.status}</span>
                    <button
                      className="text-xs underline text-[#123458] hover:text-[#0e2e47] transition self-start"
                      onClick={() => toggleExpandHistory(h._id)}
                    >
                      {expandedHistory[h._id] ? 'Hide Status History' : 'Show Status History'}
                    </button>
                  </div>
                  {expandedHistory[h._id] && (
                    <div className="w-full mt-2 bg-white border border-[#123458]/10 rounded p-3 text-xs">
                      <p className="font-semibold mb-2 text-[#123458]">Status History:</p>
                      <ul className="space-y-1">
                        {h.statusHistory && h.statusHistory.length > 0 ? (
                          h.statusHistory.map((s, idx) => (
                            <li key={idx} className="flex flex-col md:flex-row md:items-center gap-2 border-b last:border-b-0 pb-1">
                              <span className="font-medium">{s.status}</span>
                              <span className="text-gray-500">by {s.by}</span>
                              <span className="text-gray-500">{new Date(s.date).toLocaleString()}</span>
                              {s.comment && <span className="text-gray-700">Comment: {s.comment}</span>}
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-400">No status history available.</li>
                        )}
                      </ul>
                    </div>
                  )}
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