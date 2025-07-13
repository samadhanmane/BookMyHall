import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AdminContext } from './context/AdminContext'
import Navbar from './components/Navbar'
import Slidebar from './components/Slidebar'
import { Route, Routes, Navigate } from 'react-router-dom'
import Dashboard from './pages/Admin/Dashboard'
import AllAppointment from './pages/Admin/AllAppointment'
import AddHall from './pages/Admin/AddHall'
import HallsList from './pages/Admin/HallsList'
import { HallContext } from './context/HallContext'
import HallDashboard from './pages/Hall/HallDashboard'
import HallAppointments from './pages/Hall/HallAppointments'
import HallProfile from './pages/Hall/HallProfile'
import CoordinatorManagement from './pages/Admin/CoordinatorManagement'
import DirectorDashboard from './pages/DirectorDashboard.jsx'

const App = () => {
  const { aToken: adminToken } = useContext(AdminContext)
  const { dToken: coordinatorToken } = useContext(HallContext)

  return adminToken || coordinatorToken ? (
    <div className='min-h-screen bg-white font-poppins text-[#030303]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Slidebar />
        <div className='flex-1 border-l border-gray-200 p-4'>
          <Routes>
            {/* Default Route: Redirect based on role */}
            <Route path='/' element={<Navigate to={adminToken ? '/admin-dashboard' : '/hall-dashboard'} replace />} />
            {/* Admin Routes */}
            <Route path='/admin-dashboard' element={<Dashboard />} />
            <Route path='/all-appointments' element={<AllAppointment />} />
            <Route path='/add-hall' element={<AddHall />} />
            <Route path='/hall-list' element={<HallsList />} />
            <Route path='/coordinator-management' element={<CoordinatorManagement />} />

            {/* Hall Routes */}
            <Route path='/hall' element={<Navigate to='/hall-dashboard' replace />} />
            <Route path='/hall-dashboard' element={<HallDashboard />} />
            <Route path='/hall-appointments' element={<HallAppointments />} />
            <Route path='/hall-profile' element={<HallProfile />} />
          </Routes>
        </div>
      </div>
    </div>
  ) : (
    <>
      <Routes>
        <Route path="/director/login" element={<Login />} />
        <Route path="/director-dashboard" element={<DirectorDashboard />} />
        <Route path="*" element={<Login />} />
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App
