import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { assets } from '@/assets/assets';

const Header = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();

  const handleBookFacility = () => {
    if (orgId) {
      navigate(`/org/${orgId}/facilities`);
    } else {
      navigate('/facilities');
    }
  };

  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between bg-white/60 border border-white/40 backdrop-blur-md rounded-3xl px-8 md:px-16 lg:px-24 py-16 shadow-2xl shadow-slate-100/40 gap-10 md:gap-8 my-4">
      {/* Left Section */}
      <div className="md:w-1/2 flex flex-col items-start gap-6">
        <img
          src={assets.mitaoe_booking}
          alt="MITAOE Booking Logo"
          className="w-56 mb-2 object-contain"
        />
        <h1 className="text-4xl md:text-5xl font-black text-[#123458] leading-tight tracking-tight">
          Book Campus Facilities Effortlessly
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
          Reserve seminar halls, guest rooms, laboratories, and vehicles for all your academic, research, and institutional activities in just a few clicks.
        </p>
        <Button
          onClick={handleBookFacility}
          size="lg"
          className="bg-gradient-to-r from-[#123458] to-[#0f2c48] hover:from-[#1b436d] hover:to-[#123458] text-white font-bold px-8 py-6 rounded-full text-lg shadow-md hover:scale-105 hover:shadow-lg active:scale-98 transition-all duration-300"
        >
          Book a Facility
        </Button>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#123458]" />
          <span className="text-slate-500 text-sm font-semibold tracking-wide uppercase">
            For the MITAOE Community
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 flex items-center justify-center pt-6 md:pt-0 pl-0 md:pl-10">
        <div className="relative group w-full max-w-3xl md:max-w-2xl lg:max-w-3xl">
          <div className="absolute inset-0 bg-[#123458]/10 rounded-3xl filter blur-xl group-hover:blur-2xl transition duration-500"></div>
          <img
            src={assets.header_hall}
            alt="MITAOE Facility Showcase"
            className="relative w-full shadow-2xl border border-white/60 object-cover rounded-3xl transition-all duration-500 group-hover:scale-[1.02]"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
