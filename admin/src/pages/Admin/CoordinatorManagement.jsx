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
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6">Coordinator Management</h1>
      {/* List coordinators */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Existing Coordinators</h3>
        <ul>
          {coordinators.length === 0 && <li className="text-gray-500">No coordinators found.</li>}
          {coordinators.map((coord) => (
            <li key={coord.email} className="flex items-center justify-between py-1 border-b last:border-b-0">
              <span>{coord.name} ({coord.email})</span>
              <button
                className="ml-4 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
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
        <h3 className="font-semibold mb-2">Add New Coordinator</h3>
        <form onSubmit={e => {
          e.preventDefault();
          if (!newCoordName || !newCoordEmail || !newCoordPassword) return toast.error('All fields required');
          addCoordinator(newCoordName, newCoordEmail, newCoordPassword);
          setNewCoordName(''); setNewCoordEmail(''); setNewCoordPassword('');
        }} className="flex flex-col gap-2 md:flex-row md:items-end">
          <input type="text" value={newCoordName} onChange={e => setNewCoordName(e.target.value)} placeholder="Name" className="border rounded px-2 py-1" />
          <input type="email" value={newCoordEmail} onChange={e => setNewCoordEmail(e.target.value)} placeholder="Email" className="border rounded px-2 py-1" />
          <input type="password" value={newCoordPassword} onChange={e => setNewCoordPassword(e.target.value)} placeholder="Password" className="border rounded px-2 py-1" />
          <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600">Add</button>
        </form>
      </div>
    </div>
  );
};

export default CoordinatorManagement; 