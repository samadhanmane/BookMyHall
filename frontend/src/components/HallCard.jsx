import { CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/outline';

const HallCard = ({ hall }) => {
    return (
        <div className="bg-gray-50 rounded-xl shadow-lg overflow-hidden border border-[#123458]/30">
            <div className="w-full aspect-[4/3] overflow-hidden rounded-t-xl">
                <img src={hall.image} alt={hall.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{hall.name}</h3>
                {/* Only show capacity (speciality + experience) for halls */}
                {(!hall.isGuestRoom && !hall.isVehicle) && (
                  <p className="text-gray-600 mb-2">Capacity: {hall.speciality} ({hall.experience})</p>
                )}
                {/* For vehicles, show type and seating */}
                {hall.isVehicle && (
                  <p className="text-gray-600 mb-2">{hall.speciality} ({hall.experience})</p>
                )}
                {/* For guest rooms, show only beds */}
                {hall.isGuestRoom && (
                  <p className="text-gray-600 mb-2">Beds: {hall.experience}</p>
                )}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {hall.available ? '' : ''}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                        hall.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {hall.available ? 'Available' : 'Not Available'}
                    </span>
                </div>
            </div>
        </div>
    )
} 