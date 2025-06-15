import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AdminContext } from './context/AdminContext'
import Navbar from './components/Navbar'
import Slidebar from './components/Slidebar'
import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Admin/Dashboard'
import AllAppointment from './pages/Admin/AllAppointment'
import AddHall from './pages/Admin/AddHall'
import HallsList from './pages/Admin/HallsList'
import { HallContext } from './context/HallContext'
import HallDashboard from './pages/Hall/HallDashboard'
import HallAppointments from './pages/Hall/HallAppointments'
import HallProfile from './pages/Hall/HallProfile'

const App = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(HallContext)

  return aToken || dToken ? (
    <div className='min-h-screen bg-white font-poppins text-[#030303]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Slidebar />
        <div className='flex-1 border-l border-gray-200 shadow-inner p-4'>
          <Routes>
            {/* Admin Routes */}
            <Route path='/' element={<></>} />
            <Route path='/admin-dashboard' element={<Dashboard />} />
            <Route path='/all-appointments' element={<AllAppointment />} />
            <Route path='/add-hall' element={<AddHall />} />
            <Route path='/hall-list' element={<HallsList />} />

            {/* Hall Routes */}
            <Route path='/hall-dashboard' element={<HallDashboard />} />
            <Route path='/hall-appointments' element={<HallAppointments />} />
            <Route path='/hall-profile' element={<HallProfile />} />
          </Routes>
        </div>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App
