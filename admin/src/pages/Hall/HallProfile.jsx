import React, { useContext, useEffect, useState } from 'react'
import { HallContext } from '../../context/HallContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const HallProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData, backendUrl, setDToken } = useContext(HallContext)
  const [isEdit, setIsEdit] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const navigate = useNavigate()

  const updateProfile = async () => {
    try {
      const updateData = {
        address: profileData.address,
        available: profileData.available,
        speciality: profileData.speciality,
        about: profileData.about,
        name: profileData.name,
        experience: profileData.experience
      }
      const { data } = await axios.post(backendUrl + '/api/hall/update-profile', updateData, { headers: { dToken } })
      if (data.success) {
        toast.success(data.message)
        setIsEdit(false)
        getProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }

  const handleEmailUpdate = async () => {
    try {
      if (!profileData.email) {
        return toast.error('Please enter a new email address')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        return toast.error('Invalid email format');
      }

      setIsUpdatingEmail(true)
      
      // Show a loading toast
      const loadingToast = toast.loading('Updating email...');
      
      const { data } = await axios.post(
        backendUrl + '/api/hall/update-email',
        { newEmail: profileData.email },
        { headers: { dToken } }
      )

      // Dismiss the loading toast
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success(data.message)
        
        // Show a success message before logging out
        toast.info('You will be logged out. Please log in again with your new email.', {
          autoClose: 3000,
          onClose: () => {
            // Logout user after email update
            setDToken('')
            localStorage.removeItem('dToken')
            navigate('/')
          }
        });
      } else {
        toast.error(data.message || 'Failed to update email')
        setIsUpdatingEmail(false)
      }
    } catch (error) {
      // Dismiss any loading toasts
      toast.dismiss();
      
      // Show error message
      toast.error(error.response?.data?.message || error.message || 'An error occurred while updating email')
      console.log(error)
      setIsUpdatingEmail(false)
    }
  }

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  return (
    <div>
      <div className='flex flex-col gap-4 m-5 '>
        <div>
          <img className='bg-primary/80 w-full sm:max-w-64 rounded-lg shadow-lg shadow-black ' src={profileData?.image} alt="" />
        </div>

        <div className='flex-1 border border-stone-100 rounded-lg p-8 py-7 bg-white shadow-lg shadow-black'>
          {/* Hall Info */}
          <p className='flex items-center ga-2 text-3xl font-medium text-gray-700'>
            {isEdit ? (
              <input
                type="text"
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                value={profileData?.name || ''}
                className='border rounded px-3 py-2 bg-gray-50 '
              />
            ) : (
              profileData?.name || 'name not available'
            )}</p>

          {/* Email Section */}
          <div className='mt-4'>
            <p className='text-sm font-medium text-gray-700'>Email:</p>
            {isEdit ? (
              <div className='flex gap-2 mt-1'>
                <input
                  type="email"
                  value={profileData?.email || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  className='border rounded px-3 py-2 bg-gray-50 w-64'
                />
                <button
                  onClick={handleEmailUpdate}
                  disabled={isUpdatingEmail}
                  className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-all text-sm ${isUpdatingEmail ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isUpdatingEmail ? 'Updating...' : 'Update Email'}
                </button>
              </div>
            ) : (
              <p className='text-sm text-gray-600 mt-1'>{profileData?.email || 'Email not available'}</p>
            )}
          </div>

          <div className='flex items-center gap-2 mt-2 text-gray-600'>
            <button className='py-0.5 px-2 border text-xs rounded-full'>
              {isEdit ? (
                <select 
                  onChange={(e) => setProfileData(prev => ({ ...prev, speciality: e.target.value }))}
                  value={profileData?.speciality || ''}
                  className='bg-transparent'
                >
                  <option value="High Capacity">High Capacity</option>
                  <option value="Low Capacity">Low Capacity</option>
                </select>
              ) : (
                profileData?.speciality || 'Speciality not available'
              )}
            </button>
            <button className='py-0.5 px-2 border text-xs rounded-full'>
              {isEdit ? (
                <select 
                  onChange={(e) => setProfileData(prev => ({ ...prev, experience: e.target.value }))}
                  value={profileData?.experience || ''}
                  className='bg-transparent'
                >
                  <option value="10 Seats">10 Seats</option>
                  <option value="20 Seats">20 Seats</option>
                  <option value="30 Seats">30 Seats</option>
                  <option value="40 Seats">40 Seats</option>
                  <option value="50 Seats">50 Seats</option>
                  <option value="100 Seats">100 Seats</option>
                  <option value="200 Seats">200 Seats</option>
                </select>
              ) : (
                profileData?.experience || 'Seats not available'
              )}
            </button>
          </div>

          {/* Hall about */}
          <div>
            <p className='flex items-center gap-1 text-sm font-medium text-neutral-800 mt-3'>About</p>
            <p className='text-sm text-gray-600 max-w-[700] mt-1'>
              {isEdit ? (
                <input
                  type="text"
                  onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                  value={profileData?.about || ''}
                  className='border rounded px-3 py-2 bg-gray-50 w-full'
                />
              ) : (
                profileData?.about || 'About not available'
              )}
            </p>
          </div>

          <div className='flex gap-2 py-2'>
            <p>Address:</p>
            <p className='text-sm'>
              {isEdit ? (
                <>
                  <input 
                    type="text" 
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      address: { 
                        ...prev?.address, 
                        line1: e.target.value 
                      } 
                    }))} 
                    value={profileData?.address?.line1 || ''} 
                    className='border rounded px-3 py-2 bg-gray-50 w-full mb-2'
                  />
                  <input 
                    type="text" 
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      address: { 
                        ...prev?.address, 
                        line2: e.target.value 
                      } 
                    }))} 
                    value={profileData?.address?.line2 || ''} 
                    className='border rounded px-3 py-2 bg-gray-50 w-full'
                  />
                </>
              ) : (
                <>
                  {profileData?.address?.line1 || 'Address line 1 not available'}
                  <br />
                  {profileData?.address?.line2 || 'Address line 2 not available'}
                </>
              )}
            </p>
          </div>

          <div className='flex-gap-1 pt-2'>
            <input 
              onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))} 
              checked={profileData?.available || false} 
              type="checkbox" 
            />
            <label htmlFor="">Available</label>
          </div>

          {isEdit ? (
            <button 
              onClick={updateProfile} 
              className='px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all'
            >
              Save Information
            </button>
          ) : (
            <button 
              onClick={() => setIsEdit(true)} 
              className='px-4 py-1 border border-primary text-sm rounded-full mt-5 hover:bg-primary hover:text-white transition-all'
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default HallProfile
