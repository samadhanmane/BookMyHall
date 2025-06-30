import React, { useContext, useState, useEffect, useRef } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {
  const navigate = useNavigate()
  const { token, setToken, userData } = useContext(AppContext)
  const [showMenu, setShowMenu] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const adminUrl = import.meta.env.VITE_ADMIN_URL

  const handleLogout = () => {
    setToken(false)
    localStorage.removeItem('token')
  }

  const handleAdminLogin = () => {
    window.open(`${adminUrl}`, '_blank')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className='flex items-center justify-between text-base font-bold py-6 mb-5 border-b border-gray-300 font-poppins bg-white px-6' style={{ minHeight: '72px' }}>
      <img
        onClick={() => navigate('/')}
        className='w-44 cursor-pointer mr-10'
        src={assets.mitaoe_logo}
        alt="MITAOE Logo"
      />

      {/* ----------- Desktop Menu ----------- */}
      <div className='flex items-center w-full'>
        <ul className='hidden md:flex items-center gap-8 font-bold text-[#030303] w-full'>
          <NavLink to='/'><li className='hover:text-[#123458]'>Home</li></NavLink>
          <NavLink to='/halls'><li className='hover:text-[#123458]'>Facilities</li></NavLink>
          <NavLink to='/about'><li className='hover:text-[#123458]'>About</li></NavLink>
          <NavLink to='/contact'><li className='hover:text-[#123458]'>Contact</li></NavLink>
          <li>
            <button
              onClick={handleAdminLogin}
              className='text-xs bg-[#123458] text-white px-4 py-2 rounded-full font-bold border border-[#123458]'
            >
              Admin
            </button>
          </li>
        </ul>
        <NavLink to='/login' className='ml-auto'>
          <li className='bg-[#123458] text-white px-4 py-2 rounded-full font-bold border border-[#123458] transition hidden md:block list-none text-xs whitespace-nowrap min-w-[64px] text-center'>Log In</li>
        </NavLink>
      </div>

      {/* ----------- Right Section ----------- */}
      <div className='flex items-center gap-4'>
        {token && userData ? (
          <div className='relative' ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='flex items-center gap-2 cursor-pointer'
            >
              <img className='w-8 h-8 rounded-md object-cover border border-gray-200' src={userData.image} alt="User" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown" />
            </div>

            {dropdownOpen && (
              <div className='absolute top-12 right-0 z-20 bg-white border border-gray-200 rounded-md flex flex-col gap-2 p-3 text-[#030303] min-w-48'>
                <p onClick={() => { navigate('my-profile'); setDropdownOpen(false); }} className='cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded'>
                  My Profile
                </p>
                <p onClick={() => { navigate('my-appointments'); setDropdownOpen(false); }} className='cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded'>
                  My Appointments
                </p>
                <p onClick={() => { handleLogout(); setDropdownOpen(false); }} className='cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded'>
                  Log Out
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* ----------- Hamburger Menu Icon ----------- */}
        <img
          onClick={() => setShowMenu(true)}
          className='w-6 md:hidden cursor-pointer'
          src={assets.menu_icon}
          alt="Menu"
        />

        {/* ----------- Mobile Menu ----------- */}
        <div className={`${showMenu ? 'fixed w-full h-full' : 'h-0 w-0'} md:hidden right-0 top-0 z-30 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-5 border-b border-gray-300'>
            <img className='w-36' src={assets.mitaoe_logo} alt="Logo" />
            <img
              className='w-6 cursor-pointer'
              onClick={() => setShowMenu(false)}
              src={assets.cross_icon}
              alt="Close"
            />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-6 px-5 text-base font-medium text-[#030303]'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><li className='w-full text-center py-2 rounded hover:bg-gray-100'>Home</li></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/halls'><li className='w-full text-center py-2 rounded hover:bg-gray-100'>Facilities</li></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><li className='w-full text-center py-2 rounded hover:bg-gray-100'>About</li></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><li className='w-full text-center py-2 rounded hover:bg-gray-100'>Contact</li></NavLink>
            <li 
              onClick={() => { handleAdminLogin(); setShowMenu(false); }}
              className='w-full text-center py-2 rounded hover:bg-gray-100 cursor-pointer'
            >
              Admin Login
            </li>
            <li
              onClick={() => { navigate('/login'); setShowMenu(false); }}
              className='w-full text-center py-2 rounded hover:bg-gray-100 cursor-pointer'
            >
              Log In
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar
