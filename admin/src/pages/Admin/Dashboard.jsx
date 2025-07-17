import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { BuildingOffice2Icon, CalendarDaysIcon, UsersIcon, ListBulletIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
          { icon: <BuildingOffice2Icon className="w-12 h-12 text-[#123458]" />, label: 'Facilities', value: dashData.halls },
          { icon: <CalendarDaysIcon className="w-12 h-12 text-[#123458]" />, label: 'Bookings', value: dashData.appointments },
          { icon: <UsersIcon className="w-12 h-12 text-[#123458] p-2" />, label: 'Users', value: dashData.users },
        ].map((card, index) => (
          <div
            key={index}
            className='flex items-center gap-3 bg-gray-50 p-4 min-w-52 rounded-xl border border-[#123458]/30 shadow-lg'
          >
            {card.icon}
            <div>
              <p className='text-xl font-semibold'>{card.value}</p>
              <p className='text-[#123458] font-medium'>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Bookings Section */}
      <div className='mt-10 bg-gray-50 rounded-xl shadow-lg border border-[#123458]/30'>
        <div className='flex items-center gap-3 px-5 py-4 border-b bg-[#123458] text-white rounded-t'>
          <ListBulletIcon className='w-5 h-5' />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='divide-y max-h-[70vh] overflow-y-auto'>
          {dashData.latestAppointments.map((item, index) => (
            item.hallData ? (
              <div
                key={index}
                className='flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all border-b border-gray-400'
              >
                <div className='flex-1 text-sm'>
                  <p className='font-bold text-lg text-[#123458]'>{item.hallData.name}</p>
                  <p className='text-sm text-gray-600'>{slotDateFormat(item.slotDate)}</p>
                </div>

                {item.cancelled ? (
                  <p className='text-red-600 text-xs font-medium'>Cancelled</p>
                ) : item.isCompleted ? (
                  <p className='text-green-600 text-xs font-medium'>Completed</p>
                ) : item.isAccepted ? (
                  <p className='text-green-600 text-xs font-medium'>Confirmed</p>
                ) : (
                  <p className='text-yellow-600 text-xs font-medium'>Pending</p>
                )}
                {/* Actions */}
                  <div className='flex items-center gap-2'>
                  {item.cancelled || item.isCompleted ? null : (
                    item.isAccepted ? (
                      <CheckCircleIcon
                        onClick={() => completeAppointment(item._id)}
                        className='w-6 h-6 text-green-500 cursor-pointer'
                        aria-label="Complete"
                      />
                    ) : (
                      <>
                        <XCircleIcon
                      onClick={() => cancelAppointment(item._id)}
                          className='w-6 h-6 text-red-500 cursor-pointer'
                          aria-label="Cancel"
                    />
                        <CheckCircleIcon
                      onClick={() => requestAcceptance(item._id)}
                          className='w-6 h-6 text-green-500 cursor-pointer'
                          aria-label="Accept"
                    />
                      </>
                    )
                  )}
                  </div>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
