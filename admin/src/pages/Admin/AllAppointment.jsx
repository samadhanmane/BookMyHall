import React, { useEffect, useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

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
      "Hall Name",
      "Status",
    ]

    const rows = appointments.slice().reverse().map((item, index) => [
      index + 1,
      item.userData.name,
      item.userData?.email || "No Email",
      slotDateFormat(item.slotDate),
      item.slotTime,
      item.hallData.name,
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
    <div className="w-full max-w-6xl m-5 p-4 rounded-lg shadow-md border border-gray-200 bg-white font-[Poppins]">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xl font-semibold text-[#030303]">All Appointments</p>
        <button
          onClick={handleDownloadCSV}
          className="px-4 py-2 bg-[#123458] text-white text-sm rounded hover:bg-[#0e2e47] transition"
        >
          Download CSV
        </button>
      </div>

      <div className="border rounded overflow-y-scroll max-h-[80vh] text-sm">
        <div className="hidden sm:grid grid-cols-[0.5fr_3fr_3fr_3fr_3fr_1fr_1fr] py-3 px-6 bg-[#f9f9f9] border-b text-[#030303] font-medium">
          <p>#</p>
          <p>User</p>
          <p>Email</p>
          <p>Date * Time</p>
          <p>Hall</p>
          <p>Status</p>
          <p>Actions</p>
        </div>

        {appointments.slice().reverse().map((item, index) => (
          <div
            key={index}
            className="hidden sm:grid grid-cols-[0.5fr_3fr_3fr_3fr_3fr_1fr_1fr] items-center py-3 px-6 border-b hover:bg-gray-50 transition"
          >
            <p>{index + 1}</p>
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 object-cover rounded-full border shadow-sm"
                src={item.userData?.image || assets.patients_icon}
                alt={item.userData?.name || "user"}
              />
              <p className="text-[#030303]">{item.userData?.name || "Unknown User"}</p>
            </div>
            <p className="text-[#030303]">{item.userData?.email || "No Email"}</p>
            <p className="text-[#030303]">
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
            <div className="flex items-center gap-2">
              <img
                className="w-8 h-8 object-cover border shadow-sm bg-gray-200"
                src={item.hallData?.image || assets.hall_icon}
                alt={item.hallData?.name || "hall"}
              />
              <p className="text-[#030303]">{item.hallData?.name || "Unknown Hall"}</p>
            </div>

            {item.cancelled ? (
              <p className="text-red-600 text-sm font-semibold">Cancelled</p>
            ) : item.isAccepted ? (
              <p className="text-green-600 text-sm font-semibold">Accepted</p>
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

            {item.isAccepted && !item.cancelled && (
              item.isCompleted ? (
                <p className="text-green-600 text-sm font-semibold">Completed</p>
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
        ))}

        <div className="block sm:hidden">
          {appointments.slice().reverse().map((item, index) => (
            <div key={index} className="bg-white border-b p-4 flex flex-col gap-2 shadow-sm rounded mb-2">
              <div className="flex items-center gap-3">
                <img className="w-10 h-10 object-cover rounded-full border" src={item.userData?.image || assets.patients_icon} alt={item.userData?.name || 'user'} />
                <div>
                  <p className="font-semibold text-base">{item.userData?.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500">{item.userData?.email || 'No Email'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <img className="w-10 h-10 object-cover rounded border bg-gray-200" src={item.hallData?.image || assets.hall_icon} alt={item.hallData?.name || 'hall'} />
                <div>
                  <p className="font-medium text-sm">{item.hallData?.name || 'Unknown Hall'}</p>
                  <p className="text-xs text-gray-500">{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold">
                  {item.cancelled ? (
                    <span className="text-red-600">Cancelled</span>
                  ) : item.isAccepted ? (
                    <span className="text-green-600">Accepted</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </span>
                {item.isAccepted && item.isCompleted && (
                  <span className="text-green-600 text-xs font-semibold ml-2">Completed</span>
                )}
              </div>
              <div className="flex gap-3 mt-2">
                {!item.cancelled && !item.isAccepted && (
                  <>
                    <img onClick={() => cancelAppointment(item._id)} className="w-8 h-8 cursor-pointer" src={assets.cancel_icon} alt="cancel" />
                    <img onClick={() => requestAcceptance(item._id)} className="w-8 h-8 cursor-pointer" src={assets.tick_icon} alt="accept" />
                  </>
                )}
                {item.isAccepted && !item.cancelled && !item.isCompleted && (
                  <img onClick={() => completeAppointment(item._id)} className="w-8 h-8 cursor-pointer" src={assets.tick_icon} alt="complete" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AllAppointment
