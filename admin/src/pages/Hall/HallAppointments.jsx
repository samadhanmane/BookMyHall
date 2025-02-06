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


  const hallAppointments = appointments.filter(
    (appointment) => appointment.hallId === dToken.hallId
  );
  

  // Function to download all appointments as CSV
  const downloadCSV = () => {
    if (appointments.length === 0) {
      alert('No appointments available for download.')
      return
    }

    const csvHeaders = ['#', 'User Name', 'User Age', 'Date', 'Time', 'Hall Name', 'Status']
    const csvRows = appointments.map((appointment, index) => {
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
        calculateAge(appointment.userData.dob),
        slotDateFormat(appointment.slotDate),
        appointment.slotTime,
        appointment.hallData.name, // Hall Name
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
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>
      <button
        onClick={downloadCSV}
        className="mb-5 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Download CSV
      </button>
      <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>User</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Action</p>
        </div>

        {appointments.length > 0 ? (
          appointments.reverse().map((item, index) => (
            <div
              className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 item-center text-black-500 py-3 px-6 border-b hover:shadow-md hover:shadow-black"
              key={index}
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img className='w-8 rounded-full shadow-sm shadow-black' src={item.userData.image} alt="" />
                <p>{item.userData.name}</p>
              </div>
              
                <p className='max-sm:hidden'>
                  {calculateAge(item.userData.dob)}
                </p>
                <p>
                  {slotDateFormat(item.slotDate)}, {item.slotTime}
                </p>
                {item.cancelled
                  ? <p className='text-red-600 text-xs font-medium'>Cancelled</p>
                  :  item.isAccepted
                    ? <p className='text-green-600 text-xs font-medium '>Confirmed</p>
                    : <div className='flex '>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => requestAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
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
        ) : (
          <p>No appointments found.</p>
        )}
      </div>
    </div>
  )
}

export default HallAppointments