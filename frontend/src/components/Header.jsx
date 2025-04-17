import React from 'react';
import { assets } from '../assets/assets';

const Header = () => {
  return (
    <header className="flex flex-col md:flex-row items-stretch justify-between bg-white border border-[#e0e0e0] rounded-xl px-6 md:px-12 lg:px-20 py-10 font-[Poppins] shadow-md gap-6 md:gap-0">
      
      {/* Left Section */}
      <div className="md:w-1/2 flex flex-col gap-6 text-[#030303] border-b md:border-b-0 md:border-r border-[#e0e0e0] pr-0 md:pr-10 pb-6 md:pb-0">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold leading-snug">
        MITAOE | 

<br />
Hall Reservation <br/>System
        </h1>

        <p className="text-sm text-[#030303]/80 leading-relaxed">
          Discover and reserve institutional venues with ease. <br className="hidden sm:block" />
          Ideal for meetings, training programs, and official college events.
        </p>

        <a
          href="#speciality"
          className="inline-flex items-center gap-2 bg-[#123458] text-white font-medium text-sm px-6 py-3 rounded-full w-fit hover:scale-105 transition duration-300 shadow-sm"
        >
          Reserve a Hall <img className="w-3" src={assets.arrow_icon} alt="arrow" />
        </a>
      </div>

      {/* Right Section */}
      <div className="md:w-1/2 flex items-center justify-center pt-6 md:pt-0 pl-0 md:pl-10">
        <img
          src={assets.header_hall}
          alt="MITAOE Hall"
          className="w-full max-w-lg rounded-lg shadow-sm border border-[#e0e0e0] object-cover"
        />
      </div>
    </header>
  );
};

export default Header;
