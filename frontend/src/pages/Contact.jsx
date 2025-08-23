import React from 'react';
import { assets } from '../assets/assets';

const Contact = () => {
  return (
    <div className="px-4 md:px-20 font-[Poppins] bg-white text-[#030303]">
      <div className="text-center mt-20 mb-16 text-[#123458]">
        <h1 className="text-5xl font-bold">Contact <span className="text-[#123458] font-semibold">Us</span></h1>
      </div>

      <div className="my-14 flex flex-col md:flex-row gap-12 md:gap-20 border border-gray-200 rounded-xl p-6 shadow-sm">
        <img
          className="w-full md:max-w-[360px] rounded-lg shadow-md object-cover"
          src={assets.High_Capacity_img}
          alt="Office"
        />

        <div className="flex flex-col justify-center gap-6 text-base">
          <div>
            <p className="text-xl font-semibold text-[#123458] mb-2">Our Office</p>
            <p className="text-[#030303]">
              Student Section, Design Building <br />
              MITAOE, Alandi, Pune 412105, Maharashtra, India
            </p>
          </div>

          <div>
            <p className="text-[#030303]">
              Tel: +91-9071123436, +91-8793323500, 020-30253500 <br />
              Email: admissions@mitaoe.ac.in
            </p>
          </div>

          <div>
            <p className="text-xl font-semibold text-[#123458] mb-2">Have any doubt?</p>
            <p className="text-[#030303]">To learn more about our team</p>
          </div>

          <button
            className="mt-2 w-fit px-6 py-2 bg-[#123458] text-white border border-[#123458] hover:bg-white hover:text-[#123458] transition-all duration-300 rounded-md shadow text-base"
            onClick={() => window.location.href = 'mailto:admissions@mitaoe.ac.in'}
          >
            Contact Office
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contact;
