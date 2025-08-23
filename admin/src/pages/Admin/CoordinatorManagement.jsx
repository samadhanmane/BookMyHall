import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-toastify';

const CoordinatorManagement = () => {
  const { coordinators, fetchCoordinators, addCoordinator, deleteCoordinator } = useContext(AdminContext);
  const [newCoordName, setNewCoordName] = useState('');
  const [newCoordEmail, setNewCoordEmail] = useState('');
  const [newCoordPassword, setNewCoordPassword] = useState('');

  useEffect(() => {
    fetchCoordinators();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 rounded-xl shadow-lg border border-[#123458]/40 mt-12">
      <h1 className="text-2xl font-bold mb-8">Coordinator Management</h1>
      {/* List coordinators */}
      <div className="mb-8">
        <h3 className="font-semibold mb-3">Existing Coordinators</h3>
        <ul className="space-y-2">
          {coordinators.length === 0 && <li className="text-gray-500">No coordinators found.</li>}
          {coordinators.map((coord) => (
            <li key={coord.email} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-[#123458]/10">
              <span className="text-sm">{coord.name} ({coord.email})</span>
              <button
                className="ml-4 px-3 py-1 text-xs bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                onClick={() => deleteCoordinator(coord.email)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Add new coordinator */}
      <div>
        <h3 className="font-semibold mb-3">Add New Coordinator</h3>
        <form className="flex flex-col sm:flex-row gap-3 items-stretch" onSubmit={e => { e.preventDefault(); addCoordinator(newCoordName, newCoordEmail, newCoordPassword); }}>
          <input
            className="border border-[#123458]/20 bg-gray-100 px-4 py-2 rounded focus:outline-none flex-1 min-w-0"
            type="text"
            placeholder="Name"
            value={newCoordName}
            onChange={e => setNewCoordName(e.target.value)}
            required
          />
          <input
            className="border border-[#123458]/20 bg-gray-100 px-4 py-2 rounded focus:outline-none flex-1 min-w-0"
            type="email"
            placeholder="Email"
            value={newCoordEmail}
            onChange={e => setNewCoordEmail(e.target.value)}
            required
          />
          <input
            className="border border-[#123458]/20 bg-gray-100 px-4 py-2 rounded focus:outline-none flex-1 min-w-0"
            type="password"
            placeholder="Password"
            value={newCoordPassword}
            onChange={e => setNewCoordPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-[#123458] text-white px-6 py-2 rounded-lg font-semibold shadow min-w-[80px]"
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default CoordinatorManagement; 