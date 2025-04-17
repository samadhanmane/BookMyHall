import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { HallContext } from '../context/HallContext'

const Slidebar = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(HallContext)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition 
     ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#123458] shadow-sm' : 'hover:bg-gray-100'} 
     text-[#030303]`

  const navTextClass = 'hidden md:block text-sm font-medium'

  return (
    <div className='min-h-screen bg-white border-r border-gray-200 shadow-sm font-poppins'>
      {aToken && (
        <ul className='mt-5'>
          <NavLink to='/admin-dashboard' className={linkClass}>
            <img src={assets.home_icon} alt="dashboard" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Dashboard</p>
          </NavLink>

          <NavLink to='/all-appointments' className={linkClass}>
            <img src={assets.appointment_icon} alt="appointments" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Appointments</p>
          </NavLink>

          <NavLink to='/add-hall' className={linkClass}>
            <img src={assets.add_icon} alt="add hall" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Add Hall</p>
          </NavLink>

          <NavLink to='/hall-list' className={linkClass}>
            <img src={assets.people_icon} alt="hall list" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Hall List</p>
          </NavLink>
        </ul>
      )}

      {dToken && (
        <ul className='mt-5'>
          <NavLink to='/hall-dashboard' className={linkClass}>
            <img src={assets.home_icon} alt="dashboard" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Dashboard</p>
          </NavLink>

          <NavLink to='/hall-appointments' className={linkClass}>
            <img src={assets.appointment_icon} alt="appointments" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Appointments</p>
          </NavLink>

          <NavLink to='/hall-profile' className={linkClass}>
            <img src={assets.people_icon} alt="profile" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Profile</p>
          </NavLink>
        </ul>
      )}
    </div>
  )
}

export default Slidebar
