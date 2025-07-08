import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
  return (
    <div className="font-[Poppins] bg-white text-[#030303] px-6 md:px-20">
      {/* Heading */}
      <div className="text-center text-3xl font-bold pt-12">
        <p>
          About <span className="text-[#123458]">US</span>
        </p>
      </div>

      {/* About Section */}
      <div className="my-12 flex flex-col md:flex-row gap-12 items-center">
        <img
          className="w-full md:max-w-[400px] rounded-lg object-cover transition-transform duration-300 hover:scale-105"
          src={assets.mitaoe}
          alt="MITAOE"
        />
        <div className="flex flex-col justify-center gap-6 md:w-3/5 text-base leading-relaxed">
          <h1 className="text-2xl font-bold mb-4">About Facility Booking</h1>
          <p className="mb-4 text-gray-700 text-base">
            Facility Booking is MITAOE's internal platform for reserving campus resources such as seminar halls, guest rooms, and vehicles. The goal is to make the reservation process for events, stays, and transportation simple, transparent, and efficient for the entire MITAOE community.
          </p>
          <p>
            This portal is developed to digitize and streamline the facility booking process for academic, departmental, and student-led activities within MITAOE. By providing real-time availability and a user-friendly interface, it helps faculty, staff, and students coordinate and reserve resources with ease.
          </p>
          <p>
            Facility Booking ensures optimal utilization of institutional resources, reduces manual work, and promotes better coordination for events across departments and clubs. Our commitment is to make campus facility management accessible and hassle-free for everyone at MITAOE.
          </p>
          <div>
            <h3 className="text-xl font-semibold text-[#123458] mb-1">Our Purpose</h3>
            <p>
              To empower the MITAOE community with a seamless, transparent, and efficient facility booking experience—enabling better event planning, resource management, and collaboration across the campus.
            </p>
          </div>
        </div>
      </div>

      {/* About the Team Section */}
      <div className="bg-[#f5f7fa] rounded-xl shadow-md px-6 py-10 md:px-16 md:py-12 mb-16">
        <h2 className="text-2xl font-bold text-center mb-6 text-[#123458]">About the Team</h2>
        <p className="text-center text-gray-700 max-w-3xl mx-auto mb-8 text-base">
          Facility Booking is a student-driven project developed as part of the Computer Engineering program at MIT Academy of Engineering. Our team is dedicated to building practical solutions that enhance campus life and streamline institutional processes. This project was completed under the guidance of our esteemed project coordinator.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 items-center mb-8">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">Chaitanya Retawade</span>
            <span className="text-sm text-gray-500">Backend Developer</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">Samadhan Mane</span>
            <span className="text-sm text-gray-500">Fullstack Developer</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">Krishna Gadhave</span>
            <span className="text-sm text-gray-500">Backend Developer</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-base">Vivek Borade</span>
            <span className="text-sm text-gray-500">Frontend Developer</span>
          </div>
        </div>
        <div className="text-center mt-4">
          <span className="font-semibold text-base text-[#123458]">Project Coordinator:</span>
          <span className="ml-2 text-base">Pranav Shriram Sir</span>
        </div>
        <div className="mt-8 text-center text-gray-600 text-sm max-w-2xl mx-auto">
          We are proud to contribute to MITAOE's digital transformation journey. Our collaborative effort reflects our passion for technology, teamwork, and delivering real value to our academic community.
        </div>
      </div>

      {/* Why Choose Us Section - Removed as requested */}
    </div>
  );
};

export default About;
