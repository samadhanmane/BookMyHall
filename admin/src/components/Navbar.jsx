import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { HallContext } from '../context/HallContext'

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(HallContext)
  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b border-gray-300 bg-white shadow-sm font-poppins'>
      {/* Left Section */}
      <div className='flex items-center gap-3'>
        <img
          onClick={() => navigate('/')}
          className='w-36 sm:w-40 cursor-pointer rounded-md object-contain transition-transform duration-200 hover:scale-105'
          src={assets.MITAOE_logo}
          alt='Admin Logo'
        />
        <span className='px-3 py-1 rounded-full text-xs font-medium text-[#030303] border border-[#030303] shadow-sm'>
          {aToken ? 'Admin' : 'Hall-coordinator'}
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className='bg-[#123458] text-white px-6 py-2 rounded-full text-sm font-medium shadow-sm hover:opacity-90 transition'
      >
        Logout
      </button>
    </div>
  )
}

export default Navbar
