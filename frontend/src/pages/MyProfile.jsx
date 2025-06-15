import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)
  const [guestRooms, setGuestRooms] = useState([])
  const [loading, setLoading] = useState(false)

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData()
      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)
      image && formData.append('image', image)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (userData && userData.email) {
      console.log('User data available:', userData)
      fetchGuestRooms()
    }
  }, [userData])

  const fetchGuestRooms = async () => {
    if (!userData || !userData.email) {
        return
    }

    try {
        setLoading(true)
        const response = await axios.post(
            `${backendUrl}/api/admin/coordinator-guest-rooms`,
            { email: userData.email },
            { 
                headers: { 
                    'Content-Type': 'application/json',
                    'token': token 
                } 
            }
        )

        if (response.data.success) {
            setGuestRooms(response.data.data.guestRooms)
        } else {
            toast.error(response.data.message)
        }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message || 'Failed to fetch guest rooms')
    } finally {
        setLoading(false)
    }
  }

  if (!userData) {
    return <div className="min-h-screen px-6 sm:px-10 py-10 bg-white font-poppins text-[#030303]">
      <p>Loading profile data...</p>
    </div>
  }

  return (
    <div className='min-h-screen px-6 sm:px-10 py-10 bg-white font-poppins text-[#030303]'>
      <h2 className='text-2xl font-semibold border-b border-[#ddd] pb-3 mb-6'>My Profile</h2>

      <div className='space-y-6'>
        <div className='p-6 border rounded-lg shadow-md shadow-[#00000010] bg-white'>
          <h3 className='text-xl font-semibold mb-4'>Profile Information</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Name</p>
              <p className='text-base'>{userData.name}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Email</p>
              <p className='text-base'>{userData.email}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Phone</p>
              <p className='text-base'>{userData.phone}</p>
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Address</p>
              <p className='text-base'>
                {userData.address?.line1}<br />
                {userData.address?.line2}
              </p>
            </div>
          </div>
        </div>

        {/* Guest Rooms Section */}
        <div className='p-6 border rounded-lg shadow-md shadow-[#00000010] bg-white'>
          <h3 className='text-xl font-semibold mb-4'>My Guest Rooms</h3>
          
          {loading ? (
            <p className='text-center text-gray-600'>Loading guest rooms...</p>
          ) : guestRooms.length === 0 ? (
            <p className='text-center text-gray-600'>No guest rooms found.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {guestRooms.map((room) => (
                <div
                  key={room._id}
                  className='border border-[#123458] rounded-xl overflow-hidden shadow-md'
                >
                  <img
                    src={room.image}
                    alt={room.name}
                    className='w-full h-48 object-cover'
                  />
                  <div className='p-4'>
                    <div className={`flex items-center gap-2 text-sm mb-1 ${
                      room.available ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        room.available ? 'bg-green-600' : 'bg-red-600'
                      }`}></span>
                      <span>{room.available ? 'Available' : 'Not Available'}</span>
                    </div>
                    <p className='text-lg font-medium text-[#030303]'>{room.name}</p>
                    <p className='text-sm text-[#666]'>{room.speciality}</p>
                    <p className='text-sm text-[#666] mt-2'>{room.experience}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyProfile
