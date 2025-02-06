import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { HallContext } from '../context/HallContext'

const Slidebar = () => {
  
  const {aToken} = useContext(AdminContext)
  const {dToken} = useContext(HallContext)
  


    return (
    <div className='min-h-screen bg-white border-r shadow-sm shadow-black'>
        {
            aToken && <ul className='text-[#515151] mt-5 '>
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer  ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary shadow-sm shadow-black' : ''}` } to={'/admin-dashboard'}>
                    <img src={assets.home_icon} alt="" />
                    <p className='hidden md:block'>Dashboard</p>
                </NavLink>

                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary shadow-sm shadow-black' : ''}` } to={'/all-appointments'}>
                    <img src={assets.appointment_icon} alt="" />
                    <p className='hidden md:block'>Appontments</p>
                </NavLink>
                
<NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary shadow-sm shadow-black' : ''}` } to={'/add-hall'}>
                    <img src={assets.add_icon} alt="" />
                    <p className='hidden md:block'>Add Hall</p>
                </NavLink>
                
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary shadow-sm shadow-black' : ''}` } to={'/hall-list'}>
                    <img src={assets.people_icon} alt="" />
                    <p className='hidden md:block'>Hall List</p>
                </NavLink>
                
                
            </ul>
        }

{
            dToken && <ul className='text-[#515151] mt-5'>
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}` } to={'/hall-dashboard'}>
                    <img src={assets.home_icon} alt="" />
                    <p className='hidden md:block'>Dashboard</p>
                </NavLink>

                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}` } to={'/hall-appointments'}>
                    <img src={assets.appointment_icon} alt="" />
                    <p className='hidden md:block'>Appontments</p>
                </NavLink>
                
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}` } to={'/hall-profile'}>
                    <img src={assets.people_icon} alt="" />
                    <p className='hidden md:block'>Profile</p>
                </NavLink>
                
                
            </ul>
        }

    </div>
  )
}

export default Slidebar