import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="flex flex-col md:flex-row items-stretch justify-between bg-white border border-[#e0e0e0] rounded-xl px-6 md:px-12 lg:px-20 py-10 font-[Poppins] shadow-md gap-6 md:gap-0">
      
      {/* Left Section */}
      <div className="md:w-1/2 flex flex-col gap-6 text-[#030303] border-b md:border-b-0 md:border-r border-[#e0e0e0] pr-0 md:pr-10 pb-6 md:pb-0">
        <h1 className="text-4xl font-bold leading-tight">
          MITAOE |<br />
          Facility Reservation Platform
        </h1>
        <p className="text-base text-[#030303]/80 leading-relaxed">
          Discover and reserve institutional facilities with ease.<br className="hidden sm:block" />
          Ideal for meetings, stays, transportation, and official college events.
        </p>
        <button
          onClick={() => navigate('/halls')}
          className="inline-flex items-center gap-2 bg-[#123458] text-white font-medium text-base px-6 py-2 rounded-full w-fit hover:scale-105 transition duration-300 shadow-sm"
        >
          Reserve a Facility <img className="w-4" src={assets.arrow_icon} alt="arrow" />
        </button>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 flex items-center justify-center pt-6 md:pt-0 pl-0 md:pl-10">
        <img
          src={assets.header_hall}
          alt="MITAOE Facility"
          className="w-full max-w-3xl md:max-w-2xl lg:max-w-3xl shadow-2xl border-4 border-[#123458] object-cover rounded-2xl"
        />
      </div>
    </header>
  );
};

export default Header;
