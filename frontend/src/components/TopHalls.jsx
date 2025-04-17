import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopHalls = () => {
    const navigate = useNavigate()
    const { halls } = useContext(AppContext)

    return (
        <div className="flex flex-col items-center gap-4 my-16 text-[#030303] md:mx-10 font-poppins bg-white">
            <h1 className="text-3xl font-semibold">Frequently Booked Halls</h1>
            <p className="sm:w-1/3 text-center text-sm text-[#030303]">
                Browse some of the most commonly reserved halls at MITAOE for seminars, workshops, and student activities.
            </p>

            <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 px-3 sm:px-0">
                {halls.slice(0, 10).map((item) => (
                    <div
                        key={item._id}
                        onClick={() => {
                            navigate(`/appointment/${item._id}`)
                            scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="bg-white border border-[#123458] rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-transform duration-300 hover:-translate-y-1"
                    >
                        <img
                            className="w-full h-40 object-cover rounded-t-lg"
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                        />
                        <div className="p-4 space-y-2 border-t border-[#123458]">
                            <div
                                className={`flex items-center gap-2 text-sm ${
                                    item.available ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        item.available ? 'bg-green-600' : 'bg-red-600'
                                    }`}
                                ></span>
                                <span>{item.available ? 'Available' : 'Not Available'}</span>
                            </div>
                            <p className="text-lg font-medium text-[#030303]">{item.name}</p>
                            <p className="text-sm text-[#555]">{item.speciality}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => {
                    navigate(`/halls`)
                    scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-10 px-8 py-3 rounded-full bg-[#123458] text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
                View All
            </button>
        </div>
    )
}

export default TopHalls
