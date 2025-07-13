import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const HallsList = () => {
  const { halls, guestRooms, vehicles, aToken, getAllHalls, changeAvailability, deleteHallOrRoom, coordinators } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getAllHalls()
    }
  }, [aToken])

  // Helper to get coordinator email by id
  const getCoordinatorEmail = (id) => {
    const coord = coordinators.find(c => c._id === id)
    return coord ? coord.email : id
  }

  const handleDelete = async (hallId, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      await deleteHallOrRoom(hallId);
    }
  };

  const renderVenueCard = (item, index) => (
    <div
      key={index}
      className="border border-[#123458] rounded-lg max-w-56 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-full h-36 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="object-cover w-full h-full transition-all duration-300 group-hover:opacity-90"
        />
      </div>
      <div className="p-3">
        <p className="text-[#030303] text-base font-semibold">{item.name}</p>
        <p className="text-sm text-gray-600">{item.speciality}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#030303]">
            <input
              type="checkbox"
              checked={item.available}
              onChange={() => changeAvailability(item._id)}
              className="accent-[#123458] cursor-pointer"
            />
            <label>Available</label>
          </div>
          <button
            onClick={() => handleDelete(item._id, item.name)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="m-5 max-h-[90vh] overflow-y-auto font-poppins">
      {/* Halls Section */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#030303] mb-4 border-b border-[#123458] pb-2">All Halls</h1>
        <div className="w-full flex flex-wrap gap-6">
          {halls.map((item, index) => renderVenueCard(item, index))}
        </div>
      </div>

      {/* Guest Rooms Section */}
      <div>
        <h1 className="text-xl font-semibold text-[#030303] mb-4 border-b border-[#123458] pb-2">All Guest Rooms</h1>
        {Object.entries(guestRooms || {}).map(([email, rooms]) => (
          <div key={email} className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-3">Managed by: {email}</h2>
            <div className="w-full flex flex-wrap gap-6">
              {rooms.map((room, index) => renderVenueCard(room, index))}
            </div>
          </div>
        ))}
      </div>

      {/* Vehicles Section */}
      <div>
        <h1 className="text-xl font-semibold text-[#030303] mb-4 border-b border-[#123458] pb-2">All Vehicles</h1>
        {Object.entries(vehicles || {}).map(([email, vehicleList]) => (
          <div key={email} className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-3">Managed by: {email}</h2>
            <div className="w-full flex flex-wrap gap-6">
              {vehicleList.map((vehicle, index) => renderVenueCard(vehicle, index))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HallsList
