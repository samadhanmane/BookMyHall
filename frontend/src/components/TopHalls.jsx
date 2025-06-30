import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import hall1 from '../assets/hall1.jpeg';
import guestroom from '../assets/guestroom.jpg';
import vehicle from '../assets/vehicle.jpg';

const TopHalls = () => {
    const navigate = useNavigate()
    const { halls } = useContext(AppContext)

    // Separate halls and guest rooms
    const regularHalls = halls.filter(hall => hall.category === 'hall').slice(0, 4);
    const guestRooms = halls.filter(hall => hall.category === 'guest_room').slice(0, 4);
    const vehicles = halls.filter(hall => hall.category === 'vehicle').slice(0, 4);

    const HallCard = ({ item }) => (
        <div
            key={item._id}
            onClick={() => {
                navigate(`/appointment/${item._id}`)
                scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="bg-white border border-[#123458] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-transform duration-300 hover:-translate-y-1"
        >
            <img
                className="w-full h-40 object-cover rounded-t-lg"
                src={item.image}
                alt={item.name}
                loading="lazy"
            />
            <div className="p-4 space-y-2 border-t border-[#123458]">
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
                <p className="text-xs text-gray-500">{item.category === 'guest_room' ? 'Guest Room' : item.category === 'vehicle' ? 'Vehicle' : 'Hall'}</p>
            </div>
        </div>
    );

    // Remove top halls/guest rooms/vehicles display, show only type options
    const types = [
        { label: 'Halls', value: 'Halls', description: 'Browse all available halls for seminars, workshops, and events.', image: hall1 },
        { label: 'Guest Rooms', value: 'Guest Rooms', description: 'Explore our guest rooms for comfortable stays and accommodations.', image: guestroom },
        { label: 'Vehicles', value: 'Vehicles', description: 'Check out available vehicles for your needs.', image: vehicle }
    ];

    const handleTypeClick = (type) => {
        navigate(`/halls?type=${encodeURIComponent(type)}`);
        scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col items-center gap-8 my-16 text-[#030303] md:mx-10 font-poppins bg-white">
            <h1 className="text-3xl font-semibold text-center mb-2">Choose a Type</h1>
            <div className="w-full flex flex-col md:flex-row justify-center gap-8">
                {types.map(type => (
                    <div
                        key={type.value}
                        onClick={() => handleTypeClick(type.value)}
                        className="flex-1 cursor-pointer bg-white border border-[#123458] rounded-lg shadow-md hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 p-8 flex flex-col items-center text-center"
                    >
                        <img src={type.image} alt={type.label} className="w-24 h-24 object-cover rounded-full mb-4 border-2 border-[#123458]" />
                        <h2 className="text-2xl font-bold mb-2">{type.label}</h2>
                        <p className="text-gray-600 mb-4">{type.description}</p>
                        <button className="px-6 py-2 rounded-full bg-[#123458] text-white shadow hover:shadow-lg transition-all duration-300">
                            View {type.label}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TopHalls
