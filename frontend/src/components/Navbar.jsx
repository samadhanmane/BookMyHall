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

  // Always use the default icon
  const getProfileImage = () => assets.upload_icon;

  return (
    <div className='relative flex items-center justify-between text-lg font-bold py-8 mb-7 border-b-2 border-gray-300 font-poppins bg-white px-10' style={{ minHeight: '96px' }}>
      <img
        onClick={() => navigate('/')}
        className='w-56 cursor-pointer mr-14 drop-shadow-lg'
        src={assets.mitaoe_logo}
        alt="MITAOE Logo"
      />

      {/* ----------- Desktop Menu ----------- */}
      <div className='hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <ul className='flex items-center gap-12 text-[#030303] text-xl'>
          <NavLink to='/'><li className='font-bold hover:text-[#123458]'>Home</li></NavLink>
          <NavLink to='/halls'><li className='font-bold hover:text-[#123458]'>Facilities</li></NavLink>
          <NavLink to='/about'><li className='font-bold hover:text-[#123458]'>About</li></NavLink>
          <NavLink to='/contact'><li className='font-bold hover:text-[#123458]'>Contact</li></NavLink>
          <li>
            <button
              onClick={handleAdminLogin}
              className='text-xs bg-[#123458] text-white px-4 py-2 rounded-full font-bold border border-[#123458]'
            >
              Admin
            </button>
          </li>
        </ul>
      </div>

      {/* ----------- Log In Button (right corner) ----------- */}
      {!token && (
        <div className='hidden md:flex items-center ml-auto'>
          <button
            onClick={() => navigate('/login')}
            className='bg-[#123458] text-white px-4 py-2 rounded-full font-bold border border-[#123458] transition text-xs whitespace-nowrap min-w-[64px] text-center cursor-pointer'
          >
            Log In
          </button>
        </div>
      )}

      {/* ----------- Right Section ----------- */}
      <div className='flex items-center gap-4'>
        {/* Profile Icon and Dropdown for logged in users (mobile) */}
        {token && (
          <div className='relative md:hidden ml-2' ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className='flex items-center gap-2 cursor-pointer select-none'
            >
              <img
                className='w-12 h-12 rounded-full object-cover border-2 border-gray-300 shadow-md'
                src={getProfileImage()}
                alt='Profile'
              />
              <img className='w-4' src={assets.dropdown_icon} alt='Dropdown' />
            </div>
            {dropdownOpen && (
              <div className='absolute top-12 right-0 z-20 bg-white border border-gray-200 rounded-md flex flex-col gap-2 p-3 text-[#030303] min-w-48 shadow-lg'>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); setShowMenu(false); navigate('/my-profile'); }}
                  className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); setShowMenu(false); navigate('/my-appointments'); }}
                  className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
                >
                  My Appointments
                </button>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); setShowMenu(false); handleLogout(); }}
                  className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}

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
            {/* Show only login button when not logged in (mobile) */}
            {!token && (
              <li
                onClick={() => { navigate('/login'); setShowMenu(false); }}
                className='w-full text-center py-2 rounded hover:bg-gray-100 cursor-pointer'
              >
                Log In
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ----------- Profile Icon and Dropdown for logged in users (desktop) ----------- */}
      {token && (
        <div className='relative ml-8 hidden md:block' ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className='flex items-center gap-2 cursor-pointer select-none'
          >
            <img
              className='w-14 h-14 rounded-full object-cover border-2 border-gray-300 shadow-md'
              src={getProfileImage()}
              alt='Profile'
            />
            <img className='w-4' src={assets.dropdown_icon} alt='Dropdown' />
          </div>
          {dropdownOpen && (
            <div className='absolute top-12 right-0 z-20 bg-white border border-gray-200 rounded-md flex flex-col gap-2 p-3 text-[#030303] min-w-48 shadow-lg'>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); navigate('/my-profile'); }}
                className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
              >
                My Profile
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); navigate('/my-appointments'); }}
                className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
              >
                My Appointments
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setDropdownOpen(false); handleLogout(); }}
                className='text-left cursor-pointer hover:bg-[#f4f4f4] px-3 py-1 rounded w-full'
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Navbar
