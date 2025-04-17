import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Halls = () => {
  const { speciality } = useParams();
  const { halls } = useContext(AppContext);
  const [filterHall, setFilterHall] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const applyFilter = () => {
    if (speciality) {
      setFilterHall(halls.filter(hall => hall.speciality === speciality));
    } else {
      setFilterHall(halls);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [halls, speciality]);

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
          {['High Capacity', 'Low Capacity'].map(type => (
            <p
              key={type}
              onClick={() =>
                speciality === type
                  ? navigate('/halls')
                  : navigate(`/halls/${type}`)
              }
              className={`w-[94vw] sm:w-auto pl-4 pr-10 py-2 rounded border border-[#123458] shadow-sm cursor-pointer transition-colors duration-200 ${
                speciality === type ? 'bg-[#123458] text-white' : 'text-[#123458] bg-white'
              } hover:bg-[#123458] hover:text-white`}
            >
              {type}
            </p>
          ))}
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
                <p className="text-lg font-semibold text-[#030303]">{item.name}</p>
                <p className="text-sm text-[#123458]">{item.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Halls;
