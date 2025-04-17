import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)

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

  return userData && (
    <div className='max-w-lg w-full bg-white border border-gray-200 rounded-lg p-8 shadow-md font-[Poppins] text-[#030303]'>

      <div className='flex justify-center mb-6'>
        {
          isEdit ? (
            <label htmlFor='image' className='cursor-pointer relative'>
              <img className='w-36 h-36 object-cover rounded-full opacity-50 border border-gray-300' src={image ? URL.createObjectURL(image) : userData.image} alt="Profile" />
              <img className='w-8 absolute bottom-2 right-2' src={image ? '' : assets.upload_icon} alt="Upload" />
              <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
            </label>
          ) : (
            <img className='w-36 h-36 object-cover rounded-full border border-gray-300' src={userData.image} alt="Profile" />
          )
        }
      </div>

      <div className='text-center'>
        {
          isEdit
            ? <input className='text-2xl font-semibold border border-gray-300 px-2 py-1 rounded w-full text-center' type='text' value={userData.name} onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))} />
            : <p className='text-2xl font-semibold'>{userData.name}</p>
        }
      </div>

      <hr className='my-6 border-gray-300' />

      <div>
        <p className='text-sm text-[#123458] font-medium mb-2'>Contact Information</p>
        <div className='grid grid-cols-[1fr_2fr] gap-y-4 text-sm'>

          <p>Email:</p>
          <p className='text-[#123458] font-medium'>{userData.email}</p>

          <p>Phone:</p>
          {
            isEdit
              ? <input className='border border-gray-300 px-2 py-1 rounded' type='text' value={userData.phone} onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))} />
              : <p>{userData.phone}</p>
          }

          <p>Address:</p>
          {
            isEdit
              ? <div className='flex flex-col gap-2'>
                  <input className='border border-gray-300 px-2 py-1 rounded' value={userData.address.line1} onChange={e => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} />
                  <input className='border border-gray-300 px-2 py-1 rounded' value={userData.address.line2} onChange={e => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} />
                </div>
              : <p>{userData.address.line1}<br />{userData.address.line2}</p>
          }
        </div>
      </div>

      <hr className='my-6 border-gray-300' />

      <div>
        <p className='text-sm text-[#123458] font-medium mb-2'>Basic Information</p>
        <div className='grid grid-cols-[1fr_2fr] gap-y-4 text-sm'>

          <p>Gender:</p>
          {
            isEdit
              ? <select className='border border-gray-300 px-2 py-1 rounded' value={userData.gender} onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              : <p>{userData.gender}</p>
          }

          <p>Date of Birth:</p>
          {
            isEdit
              ? <input className='border border-gray-300 px-2 py-1 rounded' type="date" value={userData.dob} onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} />
              : <p>{userData.dob}</p>
          }
        </div>
      </div>

      <div className='mt-8 text-center'>
        {
          isEdit
            ? <button className='bg-[#123458] text-white px-6 py-2 rounded-full shadow-sm hover:shadow-md transition-all' onClick={updateUserProfileData}>Save Information</button>
            : <button className='border border-[#123458] text-[#123458] px-6 py-2 rounded-full hover:bg-[#123458] hover:text-white transition-all' onClick={() => setIsEdit(true)}>Edit</button>
        }
      </div>

    </div>
  )
}

export default MyProfile
