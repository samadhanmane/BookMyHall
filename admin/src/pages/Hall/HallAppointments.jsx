import React, { useContext, useEffect } from 'react'
import { HallContext } from '../../context/HallContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets.js'

const HallAppointments = () => {
  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment, requestAppointment } = useContext(HallContext)
  const { calculateAge, slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  useEffect(() => {
    const interval = setInterval(() => {
      if (dToken) {
        getAppointments()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [dToken])

  const handleCancelAppointment = async (appointmentId) => {
    await cancelAppointment(appointmentId)
    getAppointments()
  }

  const handleRequestAppointment = async (appointmentId) => {
    await requestAppointment(appointmentId)
    getAppointments()
  }

  const handleCompleteAppointment = async (appointmentId) => {
    await completeAppointment(appointmentId)
    getAppointments()
  }

  const hallAppointments = appointments.filter(
    (appointment) => appointment.hallId === dToken.hallId
  );

  const downloadCSV = () => {
    if (appointments.length === 0) {
      alert('No appointments available for download.')
      return
    }

    const csvHeaders = ['#', 'User Name', 'User Email', 'Date', 'Time', 'Hall Name', 'Status']
    const csvRows = appointments.slice().reverse().map((appointment, index) => {
      const status = appointment.cancelled
        ? 'Cancelled'
        : appointment.isCompleted
        ? 'Completed'
        : appointment.isAccepted
        ? 'Confirmed'
        : 'Pending'
      return [
        index + 1,
        appointment.userData.name,
        appointment.userData.email,
        slotDateFormat(appointment.slotDate),
        appointment.slotTime,
        appointment.hallData.name,
        status,
      ].join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'all_appointments.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-5 font-[Poppins] text-[#030303]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">All Appointments</h2>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-[#123458] text-white rounded border border-[#123458] shadow-sm hover:shadow-md transition"
        >
          Download CSV
        </button>
      </div>

      <div className="bg-white border rounded-md overflow-y-scroll max-h-[80vh] min-h-[50vh] shadow-sm">
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_2fr_1fr_1fr] px-6 py-3 border-b font-medium text-sm text-[#030303] bg-[#f9f9f9]">
          <p>#</p>
          <p>User</p>
          <p>Email</p>
          <p>Date & Time</p>
          <p>Status</p>
          <p>Action</p>
          <p>Complete</p>
        </div>

        {appointments.length > 0 ? (
          appointments.slice().reverse().map((item, index) => (
            <div
              key={item._id}
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_2fr_2fr_2fr_1fr_1fr] gap-2 px-6 py-3 items-center border-b hover:shadow-sm transition text-sm"
            >
              <p className="sm:block hidden">{index + 1}</p>

              <div className="flex items-center gap-2">
                <img
                  className="w-8 h-8 rounded-full object-cover shadow-sm border"
                  src={item.userData.image}
                  alt="User"
                />
                <p>{item.userData.name}</p>
              </div>

              <p className="sm:block hidden">{item.userData.email}</p>

              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

              <p>
                {item.cancelled ? (
                  <span className="text-red-600 font-semibold text-sm">Cancelled</span>
                ) : item.isAccepted ? (
                  <span className="text-green-600 font-semibold text-sm">Confirmed</span>
                ) : (
                  <span className="text-yellow-600 font-semibold text-sm">Pending</span>
                )}
              </p>

              <div className="flex gap-3 justify-center">
                {!item.cancelled && !item.isAccepted && (
                  <>
                    <img
                      onClick={() => handleCancelAppointment(item._id)}
                      className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                      src={assets.cancel_icon}
                      alt="Cancel"
                    />
                    <img
                      onClick={() => handleRequestAppointment(item._id)}
                      className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                      src={assets.tick_icon}
                      alt="Confirm"
                    />
                  </>
                )}
              </div>

              <div className="flex justify-center">
                {item.isAccepted && !item.isCompleted && (
                  <img
                    onClick={() => handleCompleteAppointment(item._id)}
                    className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                )}
                {item.isCompleted && (
                  <p className="text-green-600 font-semibold text-sm">Completed</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-[#123458] font-medium">No appointments found.</p>
        )}
      </div>
    </div>
  )
}

export default HallAppointments
