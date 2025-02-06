import React from 'react'
import { useEffect } from 'react'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const AllAppointment = () => {

  const {aToken, appointments,getAllAppointments,cancelAppointment,completeAppointment,requestAcceptance} = useContext(AdminContext)
  const {calculateAge, slotDateFormat} = useContext(AppContext)
  useEffect(()=>{
    if(aToken){
      getAllAppointments()
    }
  },[aToken])



  const handleDownloadCSV = () => {
    if (appointments.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = [
      "S.No",
      "User Name",
      "Age",
      "Slot Date",
      "Slot Time",
      "Hall Name",
      "Status",
    ];

    const rows = appointments.map((item, index) => [
      index + 1,
      item.userData.name,
      calculateAge(item.userData.dob),
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
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "appointments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='w-full max-w-6xl m-5 shadow-sm shadow-black px-2 py-3 rounded-lg'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

       {/* Button to download CSV */}
       <button
        onClick={handleDownloadCSV}
        className="mb-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Download CSV
      </button>

      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll '>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>User</p>
          <p>Age</p>
          <p>Date * Time</p>
          <p>Hall</p>
          <p>Actions</p>
        </div>

        {appointments.reverse().map((item,index)=>( 
          <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col items-center text-black py-3 px-6 border-b hover:bg-gray-50 hover:shadow-md hover:shadow-black' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full shadow-sm shadow-black' src={item.userData.image} alt="" /><p>{item.userData.name}</p>
            </div>
            <p className='max-sm:hidden text-black'>{calculateAge(item.userData.dob)}</p>
            <p>{slotDateFormat(item.slotDate)},{item.slotTime}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-none bg-gray-200 shadow-sm shadow-black' src={item.hallData.image} alt="" /><p>{item.hallData.name}</p>
            </div>
            {item.cancelled
                  ? <p className='text-red-600 text-xs font-medium'>Cancelled</p>
                  :  item.isAccepted
                    ? <p className='text-green-600 text-xs font-medium '>Accepted</p>
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

        ))}
      </div>

    </div>
  )
}

export default AllAppointment