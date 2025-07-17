import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import MyProfile from './pages/MyProfile'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import Halls from './pages/Halls'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

const App = () => {
  return (
    <div className='bg-[#f8fafc] min-h-screen px-2 sm:px-8 py-4'>
      <ToastContainer />
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/halls' element={<Halls />} />
        <Route path='/halls/:speciality' element={<Halls />} />
        <Route path='/login' element={<Login />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/my-profile' element={<MyProfile />} />
        <Route path='/my-appointments' element={<MyAppointments />} />
        <Route path='/appointment/:hallId' element={<Appointment />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App