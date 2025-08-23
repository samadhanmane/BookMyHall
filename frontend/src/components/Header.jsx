import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="flex flex-col md:flex-row items-center justify-between bg-white border-b-2 border-[#123458] rounded-xl px-6 md:px-12 lg:px-20 py-14 font-[Poppins] shadow-md gap-10 md:gap-0">
      {/* Left Section */}
      <div className="md:w-1/2 flex flex-col items-start gap-6">
        <img src={assets.FacilityBooking} alt="Facility Booking Logo" className="w-32 mb-2" />
        <h1 className="text-4xl md:text-5xl font-bold text-[#123458] leading-tight">
          Book Campus Facilities Effortlessly
        </h1>
        <p className="text-lg text-[#030303]/80 max-w-xl">
          Reserve halls, guest rooms, and vehicles for all your academic and institutional needs in just a few clicks.
        </p>
        <button
          onClick={() => navigate('/halls')}
          className="bg-[#123458] text-white font-semibold px-8 py-3 rounded-full text-lg shadow hover:scale-105 transition"
        >
          Book a Facility
        </button>
        <div className="flex gap-4 mt-4">
          <button onClick={() => navigate('/about')} className="text-[#123458] underline text-base font-medium">Learn More</button>
          <button onClick={() => navigate('/contact')} className="text-[#123458] underline text-base font-medium">Contact Support</button>
        </div>
        <div className="mt-4 text-sm text-gray-500">For the MITAOE Community</div>
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
