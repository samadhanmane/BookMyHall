import React, { useContext, useEffect } from 'react'
import { HallContext } from '../../context/HallContext'
import { assets } from '../../assets/assets'
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
        <div className="flex items-center gap-3 bg-white p-5 min-w-52 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <img className="w-12 h-12" src={assets.appointments_icon} alt="appointments" />
          <div>
            <p className="text-xl font-semibold text-[#030303]">{dashData.appointments}</p>
            <p className="text-sm text-gray-500">Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-5 min-w-52 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
          <img className="w-8 h-8" src={assets.people_icon} alt="users" />
          <div>
            <p className="text-xl font-semibold text-[#030303]">{dashData.users}</p>
            <p className="text-sm text-gray-500">Users</p>
          </div>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-[#123458] rounded-t-lg">
          <img className="w-5" src={assets.list_icon} alt="list icon" />
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
              ) : (item.isAccepted || item.directorDecision === 'approved') ? (
                <p className="text-green-600 text-xs font-semibold">Confirmed</p>
              ) : (
                (item.coordinatorDecision === 'pending' && (!item.directorDecision || item.directorDecision === 'pending')) ? (
                  <div className="flex gap-2">
                    <img
                      onClick={() => handleCancelAppointment(item._id)}
                      className="w-8 cursor-pointer"
                      src={assets.cancel_icon}
                      alt="cancel"
                    />
                    <img
                      onClick={() => handleRequestAppointment(item._id)}
                      className="w-8 cursor-pointer"
                      src={assets.tick_icon}
                      alt="accept"
                    />
                  </div>
                ) : null
              )}

              {/* Completion */}
              {(item.isAccepted || item.directorDecision === 'approved') && !item.isCompleted && (
                <div className="ml-2">
                  <img
                    onClick={() => handleCompleteAppointment(item._id)}
                    className="w-8 cursor-pointer"
                    src={assets.tick_icon}
                    alt="complete"
                  />
                </div>
              )}
              {item.isAccepted && item.isCompleted && (
                <p className="text-green-600 text-xs font-semibold">Completed</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HallDashboard
