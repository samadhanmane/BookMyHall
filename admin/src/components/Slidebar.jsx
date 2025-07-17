import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { HomeIcon, CalendarDaysIcon, PlusCircleIcon, UsersIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { HallContext } from '../context/HallContext'

const Slidebar = () => {
  const { aToken: adminToken } = useContext(AdminContext)
  const { dToken: coordinatorToken } = useContext(HallContext)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer transition 
     ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#123458]' : 'hover:bg-gray-100'} 
     text-[#030303]`

  const navTextClass = 'hidden md:block text-sm font-medium'

  const iconClass = (isActive) => `w-5 h-5 object-contain ${isActive ? 'text-blue-500' : 'text-[#123458]'}`;

  return (
    <div className='min-h-screen bg-gray-50 border-r border-[#123458]/20 font-poppins'>
      {adminToken && (
        <ul className='mt-5'>
          <NavLink to='/admin-dashboard' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <HomeIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Dashboard</p>
              </>
            )}
          </NavLink>
          <NavLink to='/all-appointments' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <CalendarDaysIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Appointments</p>
              </>
            )}
          </NavLink>
          <NavLink to='/add-hall' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <PlusCircleIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Add Facility</p>
              </>
            )}
          </NavLink>
          <NavLink to='/hall-list' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <UsersIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Facility List</p>
              </>
            )}
          </NavLink>
          <NavLink to='/coordinator-management' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <ListBulletIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Coordinator Management</p>
              </>
            )}
          </NavLink>
        </ul>
      )}
      {coordinatorToken && (
        <ul className='mt-5'>
          <NavLink to='/hall-dashboard' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <HomeIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Dashboard</p>
              </>
            )}
          </NavLink>
          <NavLink to='/hall-appointments' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <CalendarDaysIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Appointments</p>
              </>
            )}
          </NavLink>
          <NavLink to='/hall-profile' className={linkClass}>
            {({ isActive }) => (
              <>
                <span className={iconClass(isActive)}>
                  <UsersIcon className={iconClass(isActive)} aria-hidden="true" />
                </span>
            <p className={navTextClass}>Profile</p>
              </>
            )}
          </NavLink>
        </ul>
      )}
    </div>
  )
}

export default Slidebar
