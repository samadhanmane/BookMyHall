import React from 'react'
import { useContext } from 'react'
import { useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'



const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, completeAppointment, requestAcceptance, dashData } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)
  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return dashData && (
    <div className='m-5'>
      <div className='flex flex-wrap gap-3'>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm shadow-black'>
          <img className='w-14' src={assets.hall_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.halls}</p>
            <p className='text-black-400'>Halls</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm shadow-black'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-black-400'>Appointments</p>
          </div>
        </div>

        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all shadow-sm shadow-black'>
          <img className='w-14' src={assets.patients_icon} alt="" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.users}</p>
            <p className='text-black-400'>Users</p>
          </div>
        </div>

      </div>

      <div className='bg-white shadow-sm shadow-black'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border shadow-sm shadow-black'>
          <img src={assets.list_icon} alt="" />
          <p>Latest Bookings</p>
        </div>
        <div className='pt-4 border border-t-0 shadow-sm shadow-black'>
           
          {
            dashData.latestAppointments.map((item, index) => (
              <div className='flex items-center gap-3 px-6 py-3 border-b border-gray-100 hover:bg-gray-50 hover:shadow-md hover:shadow-black' key={index}>
                <img className='rounded-md w-10 shadow-sm shadow-black' src={item.hallData.image} alt="" />
                <div className='flex-1 text-sm'>
                  <p className='text-gray-800 font-medium'>{item.hallData.name}</p>
                  <p className='text-gray-600'>{slotDateFormat(item.slotDate)}</p>
                </div>
                {item.cancelled
                  ? <p className='text-red-600 text-xs font-medium'>Cancelled</p>
                  :  item.isAccepted
                    ? <p className='text-green-600 text-xs font-medium '>Confirmed</p>
                    : <div className='flex '>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => requestAcceptance(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
                }
                {
                  item.isAccepted
                    ? item.isCompleted
                      ? <p className='text-green-600 text-xs font-medium '>Completed</p>
                      : <div className='flex '>
                          <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                        </div>
                    : null
                }

              </div>

            ))
          }


        </div>
      </div>
    </div>
  )
}

export default Dashboard