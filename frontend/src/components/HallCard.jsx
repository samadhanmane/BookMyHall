const HallCard = ({ hall }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={hall.image} alt={hall.name} className="w-full h-48 object-cover" />
            <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{hall.name}</h3>
                <p className="text-gray-600 mb-2">{hall.speciality}</p>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {hall.isGuestRoom ? 'Beds' : 'Seats'}: {hall.experience}
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