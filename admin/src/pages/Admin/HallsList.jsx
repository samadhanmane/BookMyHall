import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'

const HallsList = () => {
  const { halls, aToken, getAllHalls, changeAvailability } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getAllHalls()
    }
  }, [aToken])

  return (
    <div className="m-5 max-h-[90vh] overflow-y-auto font-poppins">
      <h1 className="text-xl font-semibold text-[#030303] mb-4 border-b border-[#123458] pb-2">All Halls</h1>
      <div className="w-full flex flex-wrap gap-6">
        {halls.map((item, index) => (
          <div
            key={index}
            className="border border-[#123458] rounded-lg max-w-56 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-full h-36 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="object-cover w-full h-full transition-all duration-300 group-hover:opacity-90"
              />
            </div>
            <div className="p-3">
              <p className="text-[#030303] text-base font-semibold">{item.name}</p>
              <p className="text-sm text-gray-600">{item.speciality}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-[#030303]">
                <input
                  type="checkbox"
                  checked={item.available}
                  onChange={() => changeAvailability(item._id)}
                  className="accent-[#123458] cursor-pointer"
                />
                <label>Available</label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HallsList
