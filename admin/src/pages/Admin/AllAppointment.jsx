import React, { useEffect, useContext, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

// Tooltip component
const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  return (
    <span className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      tabIndex={0}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{ outline: 'none' }}
    >
      {children}
      {show && (
        <span className="absolute left-1/2 -translate-x-1/2 -top-6 px-2 py-0.5 bg-black text-white text-[11px] rounded shadow whitespace-pre pointer-events-none" style={{ minWidth: 'max-content' }}>
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-black rotate-45" />
        </span>
      )}
    </span>
  );
};

const AllAppointment = () => {
  const {
    aToken,
    appointments,
    getAllAppointments,
    cancelAppointment,
    completeAppointment,
    requestAcceptance,
  } = useContext(AdminContext)

  const { calculateAge, slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) getAllAppointments()
  }, [aToken])

  const handleDownloadCSV = () => {
    if (appointments.length === 0) {
      alert("No data available to download.")
      return
    }

    const headers = [
      "S.No",
      "User Name",
      "Email",
      "Slot Date",
      "Slot Time",
      "Facility Name",
      "Status",
    ]

    const rows = appointments.slice().reverse().map((item, index) => [
      index + 1,
      item.userData && item.userData.name ? item.userData.name : 'N/A',
      item.userData && item.userData.email ? item.userData.email : 'N/A',
      slotDateFormat(item.slotDate),
      item.slotTime,
      item.facilityData ? item.facilityData.name : "N/A",
      item.isCompleted
        ? "Completed"
        : item.isAccepted
        ? "Accepted"
        : item.cancelled
        ? "Cancelled"
        : "Pending",
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "appointments.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-7xl m-5 p-4 rounded-lg shadow-md border border-gray-200 bg-white font-[Poppins]">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-semibold text-[#030303]">All Appointments</p>
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-[#123458] text-white text-sm rounded hover:bg-[#0e2e47] transition"
        >
          Download CSV
        </button>
      </div>

      <div className="border rounded overflow-x-auto max-h-[80vh] text-sm">
        <div className="min-w-[1100px] grid grid-cols-[3rem_2.5fr_3fr_3fr_3fr_1.5fr_1.5fr] py-3 px-8 bg-[#f9f9f9] border-b text-[#030303] font-medium">
          <p className="truncate border-r border-gray-300 px-6">#</p>
          <p className="truncate border-r border-gray-300 px-6">User</p>
          <p className="truncate border-r border-gray-300 px-6">Email</p>
          <p className="truncate border-r border-gray-300 px-6">Date & Time</p>
          <p className="truncate border-r border-gray-300 px-6">Facility</p>
          <p className="truncate border-r border-gray-300 px-6">Status</p>
          <p className="truncate px-6">Actions</p>
        </div>

        {appointments.slice().reverse().map((item, index) => {
          const facilityImage = item.facilityData && item.facilityData.image ? item.facilityData.image : assets.cross_icon;
          const facilityName = item.facilityData && item.facilityData.name ? item.facilityData.name : 'N/A';
          const userImage = item.userData && item.userData.image ? item.userData.image : assets.cross_icon;
          const userName = item.userData && item.userData.name ? item.userData.name : 'N/A';
          const userEmail = item.userData && item.userData.email ? item.userData.email : 'N/A';

          return (
            <div
              key={index}
              className="min-w-[1100px] grid grid-cols-[3rem_2.5fr_3fr_3fr_3fr_1.5fr_1.5fr] items-center py-4 px-8 border-b hover:bg-gray-50 transition-all min-h-[60px] bg-white"
              style={{ lineHeight: 1.5 }}
            >
              <p className="truncate text-center border-r border-gray-300 px-6">{index + 1}</p>
              <div className="flex items-center gap-3 min-w-0 border-r border-gray-300 px-6">
                <img
                  className="w-9 h-9 object-cover rounded-full border shadow-sm bg-gray-100"
                  src={userImage}
                  alt="user"
                />
                <span className="truncate font-medium text-base" title={userName}>{userName}</span>
              </div>
              <p className="truncate border-r border-gray-300 px-6" title={userEmail}>{userEmail}</p>
              <div className="flex flex-col truncate border-r border-gray-300 px-6" title={`${slotDateFormat(item.slotDate)}, ${item.slotTime}`}> 
                <span className="text-base">{slotDateFormat(item.slotDate)}</span>
                <span className="text-xs text-black">{item.slotTime}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0 border-r border-gray-400 px-6">
                <span className="truncate font-bold text-base text-[#123458]" title={facilityName}>{facilityName}</span>
              </div>
              <div className="flex items-center justify-center border-r border-gray-300 px-6">
                {item.cancelled ? (
                  <span className="text-red-600 text-sm font-semibold">Cancelled</span>
                ) : item.isAccepted ? (
                  <span className="text-green-600 text-sm font-semibold">Accepted</span>
                ) : (
                  <div className="flex gap-3">
                    <img
                      onClick={() => cancelAppointment(item._id)}
                      className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                      src={assets.cancel_icon}
                      alt="cancel"
                    />
                    <img
                      onClick={() => requestAcceptance(item._id)}
                      className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                      src={assets.tick_icon}
                      alt="accept"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center px-6">
                {item.isAccepted && !item.cancelled && (
                  item.isCompleted ? (
                    <span className="text-green-600 text-sm font-semibold">Completed</span>
                  ) : (
                    <img
                      onClick={() => completeAppointment(item._id)}
                      className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                      src={assets.tick_icon}
                      alt="complete"
                    />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export default AllAppointment
