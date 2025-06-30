import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const Dashboard = () => {
  const {
    aToken,
    getDashData,
    cancelAppointment,
    completeAppointment,
    requestAcceptance,
    dashData,
  } = useContext(AdminContext)

  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className='m-5 font-[Poppins] text-[#030303]'>

      <div className='flex flex-wrap gap-4'>
        {/* Cards */}
        {[
          { icon: assets.hall_icon, label: 'Halls', value: dashData.halls },
          { icon: assets.appointments_icon, label: 'Appointments', value: dashData.appointments },
          { icon: assets.patients_icon, label: 'Users', value: dashData.users },
        ].map((card, index) => (
          <div
            key={index}
            className='flex items-center gap-3 bg-white p-4 min-w-52 rounded border border-gray-200 shadow-sm shadow-black hover:shadow-md transition-all duration-200'
          >
            <img className='w-12 h-12 object-contain rounded-md shadow-sm' src={card.icon} alt={card.label} />
            <div>
              <p className='text-xl font-semibold'>{card.value}</p>
              <p className='text-[#123458] font-medium'>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Bookings Section */}
      <div className='mt-10 bg-white rounded shadow-sm shadow-black border'>
        <div className='flex items-center gap-3 px-5 py-4 border-b bg-[#123458] text-white rounded-t'>
          <img src={assets.list_icon} alt="list" className='w-5 h-5' />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='divide-y max-h-[70vh] overflow-y-auto'>
          {dashData.latestAppointments.map((item, index) => (
            <div
              key={index}
              className='flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all'
            >
              <img
                className='rounded-md w-12 h-12 object-cover shadow-sm shadow-black'
                src={item.hallData?.image || assets.hall_icon}
                alt={item.hallData?.name || "hall"}
              />
              <div className='flex-1 text-sm'>
                <p className='font-medium'>{item.hallData?.name || "Unknown Hall"}</p>
                <p className='text-sm text-gray-600'>{slotDateFormat(item.slotDate)}</p>
              </div>

              {item.cancelled ? (
                <p className='text-red-600 text-xs font-medium'>Cancelled</p>
              ) : item.isAccepted ? (
                <p className='text-green-600 text-xs font-medium'>Confirmed</p>
              ) : (
                <div className='flex items-center gap-2'>
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    className='w-6 cursor-pointer'
                    src={assets.cancel_icon}
                    alt="cancel"
                  />
                  <img
                    onClick={() => requestAcceptance(item._id)}
                    className='w-6 cursor-pointer'
                    src={assets.tick_icon}
                    alt="accept"
                  />
                </div>
              )}

              {item.isAccepted && !item.isCompleted && (
                <div className='ml-2'>
                  <img
                    onClick={() => completeAppointment(item._id)}
                    className='w-6 cursor-pointer'
                    src={assets.tick_icon}
                    alt="complete"
                  />
                </div>
              )}

              {item.isAccepted && item.isCompleted && (
                <p className='text-green-600 text-xs font-medium'>Completed</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
