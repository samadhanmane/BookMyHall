import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
  return (
    <div className="font-[Poppins] bg-white text-[#030303] px-6 md:px-20">
      {/* Heading */}
      <div className="text-center text-3xl font-semibold pt-12">
        <p>
          About <span className="text-[#123458]">US</span>
        </p>
      </div>

      {/* About Section */}
      <div className="my-12 flex flex-col md:flex-row gap-12 items-center">
        <img
          className="w-full md:max-w-[400px] rounded-lg shadow-md object-cover transition-transform duration-300 hover:scale-105"
          src={assets.mitaoe}
          alt="MITAOE"
        />
        <div className="flex flex-col justify-center gap-6 md:w-3/5 text-[15px] leading-relaxed">
          <p>
            Welcome to the official Seminar Hall Booking Portal of MIT Academy of Engineering.
            This platform has been developed to simplify and digitize the booking process of
            seminar halls for various academic, departmental, and student-led activities within
            the campus.
          </p>
          <p>
            Designed to be user-friendly and efficient, the portal allows faculty, staff, and
            students to view hall availability and make reservations with ease. With a commitment
            to streamlining internal operations, this system ensures optimal utilization of
            institutional resources.
          </p>
          <div>
            <h3 className="text-lg font-semibold text-[#123458] mb-1">Our Purpose</h3>
            <p>
              Our aim is to enable a seamless booking experience for the MITAOE community by
              providing transparent scheduling, reducing manual work, and promoting better
              coordination for events across departments and clubs.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="text-2xl font-semibold mb-6 text-center">
        <p>
          WHY <span className="text-[#123458]">CHOOSE US</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-6 pb-20">
        {[
          {
            title: 'EFFICIENCY:',
            desc: 'Digitized scheduling that saves time and avoids booking conflicts.',
          },
          {
            title: 'TRANSPARENCY:',
            desc: 'Real-time availability of halls and accessible reservation history.',
          },
          {
            title: 'SIMPLICITY:',
            desc: 'A clean interface for quick and easy booking, even for first-time users.',
          },
        ].map((item, index) => (
          <div
            key={index}
            className="border border-[#123458] rounded-lg px-8 py-10 flex flex-col gap-4 hover:bg-[#123458] hover:text-white transition-all duration-300 text-[#030303] shadow-sm"
          >
            <b className="text-base">{item.title}</b>
            <p className="text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
