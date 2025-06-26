import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const Halls = () => {
  const { speciality } = useParams();
  const { halls } = useContext(AppContext);
  const [filterHall, setFilterHall] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: null,
    capacity: null
  });
  const [hallRatings, setHallRatings] = useState({});
  const navigate = useNavigate();

  const applyFilter = () => {
    let filteredHalls = halls;
    
    // Apply type filter
    if (activeFilters.type === 'Halls') {
      filteredHalls = filteredHalls.filter(hall => !hall.isGuestRoom);
    } else if (activeFilters.type === 'Guest Rooms') {
      filteredHalls = filteredHalls.filter(hall => hall.isGuestRoom);
    }

    // Apply capacity filter
    if (activeFilters.capacity) {
      filteredHalls = filteredHalls.filter(hall => hall.speciality === activeFilters.capacity);
    }

    setFilterHall(filteredHalls);
  };

  const handleFilterClick = (filterType, value) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      // Toggle filter if clicking the same value
      if (newFilters[filterType] === value) {
        newFilters[filterType] = null;
      } else {
        newFilters[filterType] = value;
      }
      return newFilters;
    });
  };

  useEffect(() => {
    applyFilter();
  }, [halls, activeFilters]);

  useEffect(() => {
    // Fetch hall ratings
    const fetchRatings = async () => {
      try {
        const { data } = await axios.get(import.meta.env.VITE_BACKEND_URL + '/api/hall/ratings');
        if (data.success) {
          // Map ratings by hallId for quick lookup
          const ratingsMap = {};
          data.ratings.forEach(r => {
            ratingsMap[r._id] = r;
          });
          setHallRatings(ratingsMap);
        }
      } catch (error) {
        // ignore error for now
      }
    };
    fetchRatings();
  }, []);

  return (
    <div className="px-4 md:px-20 py-10 font-[Poppins] bg-white text-[#030303]">
      <p className="text-xl font-semibold mb-6 border-b border-[#123458] pb-2">Browse through the hall specialties</p>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Filter toggle on mobile */}
        <button
          className={`py-2 px-4 border border-[#123458] rounded text-sm sm:hidden font-medium transition-all ${
            showFilter ? 'bg-[#123458] text-white' : 'bg-white text-[#123458]'
          }`}
          onClick={() => setShowFilter(prev => !prev)}
        >
          Filters
        </button>

        {/* Filter options */}
        <div className={`flex-col gap-3 text-sm font-medium ${
            showFilter ? 'flex' : 'hidden sm:flex'
          }`}
        >
          {/* Type Filters */}
          <p className="text-[#123458] font-semibold mb-1">Type:</p>
          {['Halls', 'Guest Rooms'].map(type => (
            <p
              key={type}
              onClick={() => handleFilterClick('type', type)}
              className={`w-[94vw] sm:w-auto pl-4 pr-10 py-2 rounded border border-[#123458] shadow-sm cursor-pointer transition-colors duration-200 ${
                activeFilters.type === type ? 'bg-[#123458] text-white' : 'text-[#123458] bg-white'
              } hover:bg-[#123458] hover:text-white`}
            >
              {type}
            </p>
          ))}

          {/* Capacity Filters */}
          <p className="text-[#123458] font-semibold mb-1 mt-4">Capacity:</p>
          {['High Capacity', 'Low Capacity'].map(type => (
            <p
              key={type}
              onClick={() => handleFilterClick('capacity', type)}
              className={`w-[94vw] sm:w-auto pl-4 pr-10 py-2 rounded border border-[#123458] shadow-sm cursor-pointer transition-colors duration-200 ${
                activeFilters.capacity === type ? 'bg-[#123458] text-white' : 'text-[#123458] bg-white'
              } hover:bg-[#123458] hover:text-white`}
            >
              {type}
            </p>
          ))}

          {/* Clear Filters Button */}
          {(activeFilters.type || activeFilters.capacity) && (
            <button
              onClick={() => setActiveFilters({ type: null, capacity: null })}
              className="w-[94vw] sm:w-auto pl-4 pr-10 py-2 rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-200 mt-4"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* Halls List */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filterHall.map((item, index) => (
            <div
              key={index}
              onClick={() => navigate(`/appointment/${item._id}`)}
              className="border border-[#123458] rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1 shadow-md"
            >
              <img
                className="w-full h-48 object-cover bg-blue-100"
                src={item.image}
                alt={item.name}
              />
              <div className="p-4 bg-white">
                <div className={`flex items-center gap-2 text-sm mb-1 ${
                  item.available ? 'text-green-600' : 'text-red-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    item.available ? 'bg-green-600' : 'bg-red-500'
                  }`}></span>
                  <p>{item.available ? 'Available' : 'Not Available'}</p>
                </div>
                
                <p className="text-lg font-semibold text-[#030303] flex items-center gap-2">
                  {item.name}
                  {hallRatings[item._id] && (
                    <span className="flex items-center gap-1 ml-2">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-base ${star <= Math.round(hallRatings[item._id].averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">({hallRatings[item._id].averageRating.toFixed(1)})</span>
                      <span className="text-xs text-gray-400 ml-1">[{hallRatings[item._id].ratingCount}]</span>
                    </span>
                  )}
                </p>
                <p className="text-sm text-[#123458]">{item.speciality}</p>
                <p className="text-xs text-gray-500 mt-1">{item.isGuestRoom ? 'Guest Room' : 'Hall'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Halls;
