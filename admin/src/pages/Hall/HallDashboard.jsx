import React, { useContext, useEffect } from 'react'
import { HallContext } from '../../context/HallContext'
import { CalendarDaysIcon, UsersIcon, ListBulletIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { AppContext } from '../../context/AppContext'

const HallDashboard = () => {
  const {
    dToken,
    dashData,
    getDashboardData,
    cancelAppointment,
    completeAppointment,
    requestAppointment,
    getAppointments
  } = useContext(HallContext)
  const { slotDateFormat } = useContext(AppContext)

  // Fetch dashboard data when component mounts and when dToken changes
  useEffect(() => {
    if (dToken) {
      getDashboardData()
      getAppointments()
    }
  }, [dToken])

  // Add a useEffect to refresh dashboard data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (dToken) {
        getDashboardData()
        getAppointments()
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [dToken])

  const handleCancelAppointment = async (appointmentId) => {
    await cancelAppointment(appointmentId)
    getDashboardData() // Refresh dashboard data after cancellation
    getAppointments() // Refresh appointments after cancellation
  }

  const handleRequestAppointment = async (appointmentId) => {
    await requestAppointment(appointmentId)
    getDashboardData() // Refresh dashboard data after request
    getAppointments() // Refresh appointments after request
  }

  const handleCompleteAppointment = async (appointmentId) => {
    await completeAppointment(appointmentId)
    getDashboardData() // Refresh dashboard data after completion
    getAppointments() // Refresh appointments after completion
  }

  return dashData && (
    <div className="m-5 font-poppins">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 p-5 min-w-52 rounded-xl border border-[#123458]/30 shadow-lg">
          <CalendarDaysIcon className="w-12 h-12 text-[#123458]" />
          <div>
            <p className="text-xl font-semibold text-[#030303]">{dashData.appointments}</p>
            <p className="text-sm text-gray-500">Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-5 min-w-52 rounded-xl border border-[#123458]/30 shadow-lg">
          <UsersIcon className="w-8 h-8 text-[#123458]" />
          <div>
            <p className="text-xl font-semibold text-[#030303]">{dashData.users}</p>
            <p className="text-sm text-gray-500">Users</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-gray-50 border border-[#123458]/30 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-[#123458] rounded-t-lg">
          <ListBulletIcon className="w-5 h-5 text-white" />
          <p className="text-white font-medium">Latest Bookings</p>
        </div>

        <div className="pt-2">
          {dashData.latestAppointments.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-4 px-5 py-3 border-b border-gray-400 hover:shadow-sm"
            >
              <div className="flex-1 text-sm">
                <p className="font-bold text-lg text-[#123458]">{item.userData && item.userData.name ? item.userData.name : 'User'}</p>
                <p className="text-gray-500">{slotDateFormat(item.slotDate)}</p>
                <p className="font-bold text-base text-[#123458]">{item.hallData?.name || item.facilityName || 'Facility'}</p>
              </div>

              {/* Status */}
              {item.cancelled ? (
                <p className="text-red-600 text-xs font-semibold">Cancelled</p>
              ) : item.isCompleted ? (
                <p className="text-green-600 text-xs font-semibold">Completed</p>
              ) : (item.isAccepted || item.directorDecision === 'approved') ? (
                <p className="text-green-600 text-xs font-semibold">Confirmed</p>
              ) : (
                (item.coordinatorDecision === 'pending' && (!item.directorDecision || item.directorDecision === 'pending')) ? (
                  <div className="flex gap-2">
                    <XCircleIcon
                      onClick={() => handleCancelAppointment(item._id)}
                      className="w-8 h-8 text-red-500 cursor-pointer"
                      aria-label="Cancel"
                    />
                    <CheckCircleIcon
                      onClick={() => handleRequestAppointment(item._id)}
                      className="w-8 h-8 text-green-500 cursor-pointer"
                      aria-label="Accept"
                    />
                  </div>
                ) : null
              )}

              {/* Completion */}
              {(item.isAccepted || item.directorDecision === 'approved') && !item.isCompleted && (
                <div className="ml-2">
                  <CheckCircleIcon
                    onClick={() => handleCompleteAppointment(item._id)}
                    className="w-8 h-8 text-green-500 cursor-pointer"
                    aria-label="Complete"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HallDashboard
