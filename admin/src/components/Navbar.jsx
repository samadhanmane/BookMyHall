import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { HallContext } from '../context/HallContext'

const Navbar = () => {

    const {aToken,setAToken} = useContext(AdminContext)
    const {dToken,setDToken} = useContext(HallContext)
    
    const navigate = useNavigate()
      
    const logout = () =>{
      navigate('/')
      aToken && setAToken('')
      aToken && localStorage.removeItem('aToken')
      dToken && setDToken('')
      dToken && localStorage.removeItem('dToken')
    }
  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
        <div className='flex items-center gap-2 text-xs'>
            <img className='w-36 sm:w-40 cursor-pointer mr-2 ' src={assets.MITAOE_logo} alt='Admin Logo'/>
            <p className='border px-2.5 py-0.5 rounded-full border-black-500 text-black-600 shadow-sm shadow-black'>{aToken ? 'Admin' : 'Hall-coordinator'}</p>
        </div>
        <button onClick={logout} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>Logout</button>
    </div>
  )
}

export default Navbar