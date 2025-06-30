import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const FACILITY_TYPES = [
  { label: 'Halls', value: 'hall' },
  { label: 'Guest Rooms', value: 'guestroom' },
  { label: 'Vehicles', value: 'vehicle' },
];

const Halls = () => {
  const { halls } = useContext(AppContext);
  const [selectedType, setSelectedType] = useState('hall');
  const [activeFilters, setActiveFilters] = useState({});
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [facilityRatings, setFacilityRatings] = useState({});
  const navigate = useNavigate();

  // Type-specific filter options
  const filterOptions = {
    hall: [
      { label: 'Capacity', key: 'capacity', options: ['High Capacity', 'Low Capacity'] },
    ],
    guestroom: [
      { label: 'No. of Beds', key: 'beds', options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
    ],
    vehicle: [
      { label: 'Type', key: 'vehicleType', options: ['Bus', 'Car', 'Van', 'Mini Bus', 'SUV', 'Tempo Traveller', 'Auto', 'Bike'] },
      { label: 'Seating Capacity', key: 'vehicleSeating', options: ['2-seater', '4-seater', '5-seater', '7-seater', '12-seater', '20-seater', '30-seater', '50-seater'] },
    ],
  };

  // Filtering logic
  useEffect(() => {
    let facilities = [];
    if (selectedType === 'hall') {
      facilities = halls.filter(f => !f.isGuestRoom && !f.isVehicle);
    } else if (selectedType === 'guestroom') {
      facilities = halls.filter(f => f.isGuestRoom);
    } else if (selectedType === 'vehicle') {
      facilities = halls.filter(f => f.isVehicle);
    }
    // Apply active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        facilities = facilities.filter(f => {
          if (selectedType === 'hall' && key === 'capacity') return f.speciality === value;
          if (selectedType === 'guestroom' && key === 'beds') return f.experience && f.experience.includes(value + ' Bed');
          if (selectedType === 'vehicle' && key === 'vehicleType') return f.speciality === value;
          if (selectedType === 'vehicle' && key === 'vehicleSeating') return f.experience && f.experience.includes(value);
          return true;
        });
      }
    });
    setFilteredFacilities(facilities);
  }, [halls, selectedType, activeFilters]);

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const { data } = await axios.get(import.meta.env.VITE_BACKEND_URL + '/api/hall/ratings');
        if (data.success) {
          const ratingsMap = {};
          data.ratings.forEach(r => {
            ratingsMap[r._id] = r;
          });
          setFacilityRatings(ratingsMap);
        }
      } catch (error) {}
    };
    fetchRatings();
  }, []);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  // Reset all filters
  const clearFilters = () => setActiveFilters({});

  return (
    <div className="px-4 md:px-20 py-10 font-poppins bg-white text-[#030303]">
      <h1 className="text-2xl font-bold mb-6 border-b-2 border-[#123458] pb-2">Browse and Book Facilities</h1>
      {/* Type Selector */}
      <div className="flex gap-4 mb-8">
        {FACILITY_TYPES.map(type => (
          <button
            key={type.value}
            className={`px-6 py-2 rounded-full border-2 font-medium transition-all ${selectedType === type.value ? 'bg-[#123458] text-white border-[#123458]' : 'bg-white text-[#123458] border-[#123458]'}`}
            onClick={() => { setSelectedType(type.value); clearFilters(); }}
          >
            {type.label}
          </button>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        {filterOptions[selectedType].map(filter => (
          <div key={filter.key} className="flex flex-col">
            <span className="font-semibold mb-1">{filter.label}:</span>
            <div className="flex gap-2">
              {filter.options.map(option => (
                <button
                  key={option}
                  className={`px-4 py-2 rounded border-2 text-sm font-medium transition-all ${activeFilters[filter.key] === option ? 'bg-[#123458] text-white border-[#123458]' : 'bg-white text-[#123458] border-[#123458]'}`}
                  onClick={() => handleFilterChange(filter.key, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
        {Object.values(activeFilters).some(Boolean) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-medium transition-all"
          >
            Clear All Filters
          </button>
        )}
      </div>
      {/* Facility List */}
      <div className="w-full flex flex-col gap-10">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{FACILITY_TYPES.find(t => t.value === selectedType).label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredFacilities.length === 0 && (
              <p className="col-span-3 text-center text-gray-500">No facilities found for the selected filters.</p>
            )}
            {filteredFacilities.map((item, index) => (
              <div
                key={index}
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(`/appointment/${item._id}`); }}
                className="border-2 border-[#123458] rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1 bg-white"
              >
                <img
                  className="w-full h-48 object-cover bg-blue-100"
                  src={item.image}
                  alt={item.name}
                />
                <div className="p-4 bg-white">
                  <div className={`flex items-center gap-2 text-sm mb-1 ${item.available ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-600' : 'bg-red-500'}`}></span>
                    <p>{item.available ? 'Available' : 'Not Available'}</p>
                  </div>
                  <p className="text-lg font-semibold text-[#030303] flex items-center gap-2">
                    {item.name}
                    {facilityRatings[item._id] && (
                      <span className="flex items-center gap-1 ml-2">
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={`text-base ${star <= Math.round(facilityRatings[item._id].averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({facilityRatings[item._id].averageRating.toFixed(1)})</span>
                        <span className="text-xs text-gray-400 ml-1">[{facilityRatings[item._id].ratingCount}]</span>
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[#123458]">{item.speciality}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedType === 'hall' ? 'Hall' : selectedType === 'guestroom' ? 'Guest Room' : 'Vehicle'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Halls;
