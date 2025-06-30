import React from 'react';
import Header from '../components/Header';
import TopHalls from '../components/TopHalls';
import { FaSearch, FaCalendarCheck, FaRegEdit, FaCheckCircle, FaMoneyCheckAlt, FaBolt, FaShieldAlt, FaThumbsUp, FaClock } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="bg-white text-[#030303] font-[Poppins]">
      <section className="bg-[#f5f8fa] pb-8">
        <Header />
      </section>

      {/* Booking Process Guide */}
      <section className="px-4 md:px-20 py-10 border-b border-[#123458] shadow-sm bg-white">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-[#123458]">How to Book</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="flex flex-col items-center">
            <FaSearch className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">1. Browse & Select</span>
            <span className="text-xs text-gray-500 text-center">Find the perfect hall, guest room, or vehicle for your needs.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaCalendarCheck className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">2. Check Availability</span>
            <span className="text-xs text-gray-500 text-center">See available dates and slots instantly.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">3. Get Confirmation</span>
            <span className="text-xs text-gray-500 text-center">Receive instant confirmation and details by email.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaThumbsUp className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">4. Give Feedback</span>
            <span className="text-xs text-gray-500 text-center">Share your experience after your booking to help us improve!</span>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-20 py-10">
        <TopHalls />
      </section>

      {/* Why Book With Us Section */}
      <section className="px-4 md:px-20 py-10 border-b border-[#123458] shadow-sm bg-white">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 text-[#123458]">Why Book With Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 justify-center items-center">
          <div className="flex flex-col items-center">
            <FaBolt className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">Instant Booking</span>
            <span className="text-xs text-gray-500 text-center">Book in seconds with real-time availability.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaShieldAlt className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">Verified Venues</span>
            <span className="text-xs text-gray-500 text-center">All venues are verified for quality and safety.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaThumbsUp className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">Trusted by Many</span>
            <span className="text-xs text-gray-500 text-center">Thousands of happy users and successful bookings.</span>
          </div>
          <div className="flex flex-col items-center">
            <FaClock className="text-4xl text-[#123458] mb-2" />
            <span className="font-semibold">24/7 Support</span>
            <span className="text-xs text-gray-500 text-center">Our team is here to help you anytime.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
