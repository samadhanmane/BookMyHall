import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const RelatedHalls = ({ speciality, hallsId }) => {
  const { halls } = useContext(AppContext)
  const [relHalls, setRelHalls] = useState([])
  const [relVehicles, setRelVehicles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (halls.length > 0 && speciality) {
      const hallsData = halls.filter(
        (hall) => hall.speciality === speciality && hall._id !== hallsId && !hall.isVehicle
      )
      setRelHalls(hallsData)
      const vehiclesData = halls.filter(
        (hall) => hall.speciality === speciality && hall._id !== hallsId && hall.isVehicle
      )
      setRelVehicles(vehiclesData)
    }
  }, [halls, speciality, hallsId])

  const hallsToDisplay = relHalls.slice(0, 5)

  return (
    <div className="flex flex-col items-center gap-4 my-16 text-[#030303] font-poppins bg-white md:mx-10">
      <h1 className="text-3xl font-semibold">Top Facilities to Book</h1>
      <p className="sm:w-1/3 text-center text-sm text-[#555]">
        Simply browse through our extensive list of trusted facilities.
      </p>

      <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5 px-3 sm:px-0">
        {hallsToDisplay.length === 0 && (
          <p className="text-gray-600 text-center col-span-full">No related facilities found.</p>
        )}

        {hallsToDisplay.map((item) => (
          <div
            key={item._id}
            onClick={() => {
              navigate(`/appointment/${item._id}`)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="border border-[#123458] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-md"
          >
            <img
              src={item.image}
              alt={item.name}
              onError={(e) => { e.target.src = '/default-hall.jpg' }}
              className="w-full h-40 object-cover bg-blue-50"
            />
            <div className="p-4">
              <div className={`flex items-center gap-2 text-sm mb-1 ${item.available ? 'text-green-500' : 'text-red-500'}`}>
                <span className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
                <span>{item.available ? 'Available' : 'Not Available'}</span>
              </div>
              <p className="text-lg font-medium text-[#030303]">{item.name}</p>
              <p className="text-sm text-[#666]">{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          navigate(`/halls`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        className="bg-[#123458] text-white px-10 py-2 rounded-full mt-10 shadow-md hover:shadow-lg transition"
        aria-label="View more facilities"
      >
        View More
      </button>

      {/* Related Vehicles Section */}
      <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5 px-3 sm:px-0 mt-10">
        {relVehicles.slice(0, 5).length === 0 && (
          <p className="text-gray-600 text-center col-span-full">No related vehicles found.</p>
        )}
        {relVehicles.slice(0, 5).map((item) => (
          <div
            key={item._id}
            onClick={() => {
              navigate(`/appointment/${item._id}`)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="border border-[#123458] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-md"
          >
            <img
              src={item.image}
              alt={item.name}
              onError={(e) => { e.target.src = '/default-hall.jpg' }}
              className="w-full h-40 object-cover bg-blue-50"
            />
            <div className="p-4">
              <div className={`flex items-center gap-2 text-sm mb-1 ${item.available ? 'text-green-500' : 'text-red-500'}`}>
                <span className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></span>
                <span>{item.available ? 'Available' : 'Not Available'}</span>
              </div>
              <p className="text-lg font-medium text-[#030303]">{item.name}</p>
              <p className="text-sm text-[#666]">{item.speciality}</p>
              <p className="text-xs text-gray-500 mt-1">Vehicle</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RelatedHalls
