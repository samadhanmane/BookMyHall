import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-[#e0e0e0] font-poppins text-[#030303]">
      <div className="container mx-auto px-6 md:px-10 py-12 grid gap-10 md:grid-cols-[3fr_1fr_1fr] text-sm">
        
        {/* Left Section */}
        <div className="border-b md:border-b-0 md:border-r border-[#e0e0e0] pr-0 md:pr-8 pb-6 md:pb-0 flex flex-col items-center md:items-start">
          <img
            src={assets.FacilityBooking}
            alt="Facility Booking Logo"
            className="w-40 mb-4 mt-2"
          />
          <p className="text-[#030303]/80 leading-6 max-w-sm text-center md:text-left">
            The Facility Booking Portal is designed to simplify and digitize the reservation and management of campus facilities—including halls, guest rooms, and vehicles—for academic, residential, and institutional needs.
          </p>
        </div>

        {/* Middle Section */}
        <div className="border-b md:border-b-0 md:border-r border-[#e0e0e0] pr-0 md:pr-8 pb-6 md:pb-0">
          <p className="text-lg font-medium mb-4">MITAOE</p>
          <ul className="flex flex-col gap-2 text-[#030303]/80">
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
            <li>Terms & Policies</li>
          </ul>
        </div>

        {/* Right Section */}
        <div>
          <p className="text-lg font-medium mb-4">Get in Touch</p>
          <ul className="flex flex-col gap-2 text-[#030303]/80">
            <li>MIT Academy of Engineering, Alandi Road, Pune - 412 105</li>
            <li>+91-9071123436</li>
            <li>+91-8793323500</li>
            <li>020-30253500</li>
          </ul>
        </div>
      </div>

      <div className="text-center py-5 text-sm text-[#030303]/70 border-t border-[#e0e0e0]">
        © 2025 MITAOE Hall Booking System. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
