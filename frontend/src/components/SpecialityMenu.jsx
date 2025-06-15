import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-[#030303] font-poppins bg-white" id="speciality">
      <h1 className="text-3xl font-semibold">Book Halls by Seating Capacity</h1>
      <p className="sm:w-1/3 text-center text-sm text-[#555]">
        Select a hall based on the number of attendees. Plan your college events with ease and efficiency.
      </p>

      <div className="flex sm:justify-center gap-6 pt-6 w-full overflow-x-auto px-4">
        {specialityData.map((item, index) => (
          <Link
            key={index}
            to={`/halls/${item.speciality}`}
            onClick={() => scrollTo(0, 0)}
            className="flex flex-col items-center text-sm text-center text-[#030303] cursor-pointer flex-shrink-0 transition-all duration-300 hover:-translate-y-1"
          >
            <img
              src={item.image}
              alt={item.speciality}
              className="w-20 h-20 sm:w-24 sm:h-24 mb-2 rounded-full object-cover border border-[#123458] shadow-md"
            />
            <p>{item.speciality}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SpecialityMenu
