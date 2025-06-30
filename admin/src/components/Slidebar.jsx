import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { HallContext } from '../context/HallContext'

const Slidebar = () => {
  const { aToken: adminToken } = useContext(AdminContext)
  const { dToken: coordinatorToken } = useContext(HallContext)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition 
     ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#123458]' : 'hover:bg-gray-100'} 
     text-[#030303]`

  const navTextClass = 'hidden md:block text-sm font-medium'

  return (
    <div className='min-h-screen bg-white border-r border-gray-200 font-poppins'>
      {adminToken && (
        <ul className='mt-5'>
          <NavLink to='/admin-dashboard' className={linkClass}>
            <img src={assets.home_icon} alt="Dashboard" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Dashboard</p>
          </NavLink>
          <NavLink to='/all-appointments' className={linkClass}>
            <img src={assets.appointment_icon} alt="Appointments" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Appointments</p>
          </NavLink>
          <NavLink to='/add-hall' className={linkClass}>
            <img src={assets.add_icon} alt="Add Facility" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Add Facility</p>
          </NavLink>
          <NavLink to='/hall-list' className={linkClass}>
            <img src={assets.people_icon} alt="Facility List" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Facility List</p>
          </NavLink>
          <NavLink to='/coordinator-management' className={linkClass}>
            <img src={assets.list_icon} alt="Coordinator Management" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Coordinator Management</p>
          </NavLink>
        </ul>
      )}
      {coordinatorToken && (
        <ul className='mt-5'>
          <NavLink to='/hall-dashboard' className={linkClass}>
            <img src={assets.home_icon} alt="Dashboard" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Dashboard</p>
          </NavLink>
          <NavLink to='/hall-appointments' className={linkClass}>
            <img src={assets.appointment_icon} alt="Appointments" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Appointments</p>
          </NavLink>
          <NavLink to='/hall-profile' className={linkClass}>
            <img src={assets.people_icon} alt="Profile" className='w-5 h-5 object-contain' />
            <p className={navTextClass}>Profile</p>
          </NavLink>
        </ul>
      )}
    </div>
  )
}

export default Slidebar
