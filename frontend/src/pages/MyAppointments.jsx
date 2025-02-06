import React, { useContext, useEffect, useState } from 'react'
import {AppContext} from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyAppointments = () => {

  

  const {backendUrl,token, getHallsData,getAppointments} = useContext(AppContext)
  const [appointments,setAppointments] = useState([])
  useEffect(()=>{
    if(token){
      getAppointments()
    }
  },[token])
  const months = ["","Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('-')
    return dateArray[0] + ' ' + months[Number(dateArray[1])] + ' ' + dateArray[2]
  }

  const getUserAppointments = async () => {
    try{
      const {data} = await axios.get(backendUrl+'/api/user/appointments',{headers:{token}})
      if(data.success){
        setAppointments(data.appointments.reverse())
        console.log(data.appointments);
      }
    }catch(error){
      console.error(error);
      toast.error(error.message)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    try{
      const {data} = await axios.post(backendUrl + '/api/user/cancel-appointment', {userId: token.id, appointmentId},{headers:{token}}) 
      if(data.success){
        toast.success(data.message)
        setAppointments(prev =>
          prev.map(appointment =>
            appointment._id === appointmentId
              ? { ...appointment, cancelled: true }
              : appointment
          )
        );
        getHallsData()
      }else{
        toast.error(data.message)
      }
    }catch(error){
      console.error(error);
      toast.error(error.message)
    }
  }


  useEffect(()=>{
    if(token){
      getUserAppointments()
    }
  },[token])
  return (
    <div className='px-10 py-10'>
        <p className='pb-3 mt-12 font-medium text-zinc-700 border-b text-2xl'>My appointments</p>
        <div>
          {appointments.map((item,index)=>(
            <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 border-b shadow-sm px-10 py-10 shadow-black' key={index}>
                    <div>
                      <img className='w-32 bg-indigo-50 shadow-lg shadow-black' src={item.hallData.image} alt="" />
                    </div>
                    <div className='flex-1 text-sm text-zinc-600'>
                      <p className='text-neutral-800 font-semibold'>{item.hallData.name}</p>
                      <p>{item.speciality}</p>
                      <p className='text-zinc-700 font-medium mt-1'>Address:</p>
                      <p className='text-xs'>{item.hallData.address.line1}</p>
                      <p className='text-xs'>{item.hallData.address.line2}</p>
                      <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                    </div>
                    <div></div>
                    <div className='flex flex-col gap-2 justify-end'>
                    {!item.cancelled && !item.isCompleted && !item.isAccepted && <button className='text-sm text-center sm:min-w-48 py-2 border rounded bg-primary text-white transition-all duration-300 shadow-md shadow-black'>Request Pending</button>}
                    {!item.cancelled && !item.isCompleted && !item.isAccepted && <button onClick={()=>cancelAppointment(item._id)} className='text-sm text-center sm:min-w-48 py-2 border rounded bg-red-600 text-white transition-all duration-300 shadow-md shadow-black'>Cancel appointment</button>}
                    {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500 shadow-md shadow-red-300'>Appointment Cancelled</button>}
                    {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500 shadow-md shadow-green-300'>Appointment Completed</button>}
                    {item.isAccepted && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500 shadow-md shadow-green-300'>Appointment Confirmed</button>}
                    </div>
            </div>
          ))}
        </div>

    </div>
  )
}

export default MyAppointments
