import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopFacilities = () => {
    const navigate = useNavigate()
    const { halls } = useContext(AppContext)

    // Separate facilities
    const regularHalls = halls.filter(facility => !facility.isGuestRoom && !facility.isVehicle).slice(0, 4);
    const guestRooms = halls.filter(facility => facility.isGuestRoom).slice(0, 4);
    const vehicles = halls.filter(facility => facility.isVehicle).slice(0, 4);

    const FacilityCard = ({ item }) => (
        <div
            key={item._id}
            onClick={() => {
                navigate(`/appointment/${item._id}`)
                scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="bg-white border-2 border-[#123458] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-transform duration-300 hover:-translate-y-1"
        >
            <img
                className="w-full h-40 object-cover rounded-t-lg"
                src={item.image}
                alt={item.name}
                loading="lazy"
            />
            <div className="p-4 space-y-2 border-t-2 border-[#123458]">
                <div
                    className={`flex items-center gap-2 text-sm ${
                        item.available ? 'text-green-600' : 'text-red-600'
                    }`}
                >
                    <span
                        className={`w-2 h-2 rounded-full ${
                            item.available ? 'bg-green-600' : 'bg-red-600'
                        }`}
                    ></span>
                    <span>{item.available ? 'Available' : 'Not Available'}</span>
                </div>
                <p className="text-lg font-medium text-[#030303]">{item.name}</p>
                <p className="text-sm text-[#555]">{item.speciality}</p>
                <p className="text-xs text-gray-500">{item.isGuestRoom ? 'Guest Room' : item.isVehicle ? 'Vehicle' : 'Hall'}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-4 my-16 text-[#030303] md:mx-10 font-poppins bg-white">
            {/* Top Facilities Section (no halls) */}
            <div className="w-full">
                <h1 className="text-3xl font-semibold text-center mb-2">Top Facilities</h1>
                <p className="sm:w-1/3 text-center text-sm text-[#030303] mx-auto mb-6">
                    Browse some of the most commonly reserved facilities for events, stays, and transportation.
                </p>
                <div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 px-3 sm:px-0">
                    {/* Only show non-hall facilities here, e.g., vehicles or guest rooms if needed */}
                    {vehicles.length === 0 && guestRooms.length === 0 && (
                        <p className="col-span-4 text-center text-gray-400">No facilities to display.</p>
                    )}
                </div>
            </div>
            {/* Top Halls Section */}
            <div className="w-full mt-12">
                <h1 className="text-2xl font-semibold text-center mb-2">Top Halls</h1>
                <div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 px-3 sm:px-0">
                    {regularHalls.map((item) => (
                        <FacilityCard key={item._id} item={item} />
                    ))}
                </div>
            </div>
            {/* Top Guest Rooms Section */}
            <div className="w-full mt-12">
                <h1 className="text-2xl font-semibold text-center mb-2">Top Guest Rooms</h1>
                <div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 px-3 sm:px-0">
                    {guestRooms.map((item) => (
                        <FacilityCard key={item._id} item={item} />
                    ))}
                </div>
            </div>
            {/* Top Vehicles Section */}
            <div className="w-full mt-12">
                <h1 className="text-2xl font-semibold text-center mb-2">Top Vehicles</h1>
                <div className="w-full grid sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 px-3 sm:px-0">
                    {vehicles.map((item) => (
                        <FacilityCard key={item._id} item={item} />
                    ))}
                </div>
            </div>
            <button
                onClick={() => {
                    navigate(`/facilities`)
                    scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-10 px-8 py-3 rounded-full bg-[#123458] text-white border-2 border-[#123458] hover:bg-white hover:text-[#123458] transition-all duration-300"
            >
                View All Facilities
            </button>
        </div>
    )
}

export default TopFacilities
