import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const Halls = () => {
  const {speciality} = useParams()
  const {halls} = useContext(AppContext)
  const [filterHall,setFilterHall] = useState([])
  const [showFilter,setShowFilter] = useState(false)
  const navigate = useNavigate()

  const applyFilter = () => {
    if(speciality) {
      setFilterHall(halls.filter(hall => hall.speciality === speciality))
    }else{
      setFilterHall(halls)
    }
  }

  useEffect(()=>{
    applyFilter()
  },[halls,speciality])
  
  return (
    <div>
        <p className='text-black-600 '>Browse through the halls specialist</p>
        <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
          <button className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`} onClick={()=>setShowFilter(prev=> !prev)}>Filters</button>
          <div className={` flex-col gap-4 text-sm text-black-600  ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
            <p onClick={()=> speciality === 'High Capacity' ? navigate('/halls') : navigate('/halls/High Capacity')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer shadow-md shadow-black ${speciality === "High Capacity" ? "bg-indigo-100 text-black" : ""}`}>High Capacity</p>
            <p onClick={()=> speciality === 'Low Capacity' ? navigate('/halls') : navigate('/halls/Low Capacity')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer shadow-md shadow-black ${speciality === "Low Capacity" ? "bg-indigo-100 text-black" : ""}`}>Low Capacity</p>
           
          </div>
          <div className='w-full grid grid-cols-auto gap-4 gap-y-6 '>
            {
              filterHall.map((item,index)=>( 
                <div onClick={()=>navigate(`/appointment/${item._id}`)} className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500 shadow-lg shadow-black' key={index}>
                    <img className='bg-blue-50' src={item.image} alt="" />
                    <div className='p-4'>
                    <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : 'text-red-500'}`}>
                        <p className={`w-2 h-2 ${item.available ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></p><p>{item.available ? 'Available' : 'Not Available'}</p>
                    </div>
                        <p className='text-black-900 text-lg font-medium'>{item.name}</p>
                        <p className='text-black-600 text-sm'>{item.speciality}</p>
                    </div>
                </div>
              ))
            }
          </div>
        </div>
    </div>
  )
}

export default Halls
