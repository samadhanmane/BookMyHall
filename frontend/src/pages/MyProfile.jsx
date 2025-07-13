import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const MyProfile = () => {
  const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)
  const [isEdit, setIsEdit] = useState(false)
  const [guestRooms, setGuestRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [position, setPosition] = useState('')
  const [changePassword, setChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const navigate = useNavigate();

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData()
      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData();
        setIsEdit(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Always use the default icon
  const getProfileImage = () => assets.upload_icon;

  useEffect(() => {
    if (!userData) {
      loadUserProfileData().catch(err => {
        // Do nothing for 404, suppress toast
      });
      return;
    }
    if (userData.email) {
      fetchUserFeedbacks();
    }
    setPosition(userData.position || '');
  }, [userData]);

  const fetchUserFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/user/feedbacks`, { headers: { token } });
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch feedbacks');
    } finally {
      setFeedbacksLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const update = {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        position
      }
      const { data } = await axios.post(backendUrl + '/api/user/update-profile', update, { headers: { token } })
      if (data.success) {
        toast.success('Profile updated successfully')
        await loadUserProfileData()
        setIsEdit(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setPasswordLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/user/change-password', {
        currentPassword,
        newPassword
      }, { headers: { token } })
      if (data.success) {
        toast.success('Password changed successfully')
        setChangePassword(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  if (userData === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-poppins text-[#030303]">
        <div className="text-lg font-semibold mb-4">Profile not found or you are not logged in.</div>
        <button
          className="bg-[#123458] text-white px-6 py-2 rounded-full hover:bg-[#0e2740] transition-all"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex flex-col items-center justify-start bg-white font-poppins text-[#030303] px-4 py-10'>
      <div className='max-w-lg w-full bg-white border border-gray-200 rounded-lg p-8 shadow'>
        <div className='flex flex-col items-center mb-6'>
          <img className='w-32 h-32 object-cover rounded-full border border-gray-300 mb-2' src={getProfileImage()} alt="Profile" />
          <div className='text-xl font-bold mt-2'>{userData?.name || ''}</div>
          <div className='text-sm text-gray-500'>{position || <span className='text-gray-300'>No position set</span>}</div>
        </div>
        <hr className='my-6 border-gray-300' />
        <form className='flex flex-col gap-4'>
          <div>
            <label className='block text-sm mb-1 font-medium'>Full Name</label>
            <input
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
              type='text'
              value={userData?.name || ''}
              disabled={!isEdit}
              onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className='block text-sm mb-1 font-medium'>Email</label>
            <input
              className='w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500'
              type='email'
              value={userData?.email || ''}
              disabled
            />
          </div>
          <div>
            <label className='block text-sm mb-1 font-medium'>Phone Number</label>
            <input
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
              type='text'
              value={userData?.phone || ''}
              disabled={!isEdit}
              onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className='block text-sm mb-1 font-medium'>Position</label>
            <input
              className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
              type='text'
              value={position}
              disabled={!isEdit}
              onChange={e => setPosition(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2 mt-4'>
            <div className='flex flex-row gap-4'>
              {isEdit ? (
                <>
                  <button type='button' className='bg-[#123458] text-white px-6 py-2 rounded-full hover:bg-[#0e2740] transition-all' onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button type='button' className='border border-[#123458] text-[#123458] px-6 py-2 rounded-full hover:bg-[#123458] hover:text-white transition-all' onClick={() => setIsEdit(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type='button' className='border border-[#123458] text-[#123458] px-6 py-2 rounded-full hover:bg-[#123458] hover:text-white transition-all' onClick={() => setIsEdit(true)}>
                  Edit Profile
                </button>
              )}
            </div>
            <button type='button' className='self-end text-[#123458] underline' onClick={() => setChangePassword(!changePassword)}>
              {changePassword ? 'Hide Password Change' : 'Change Password'}
            </button>
          </div>
        </form>
        {changePassword && (
          <div className='mt-8 border-t pt-6'>
            <h3 className='text-lg font-semibold mb-4'>Change Password</h3>
            <div className='flex flex-col gap-3'>
              <input
                className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
                type='password'
                placeholder='Current Password'
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <input
                className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
                type='password'
                placeholder='New Password'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <input
                className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]'
                type='password'
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type='button'
                className='bg-[#123458] text-white px-6 py-2 rounded-full hover:bg-[#0e2740] transition-all mt-2'
                onClick={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Feedback Section */}
      <div className='max-w-4xl w-full mt-10'>
        <div className='p-6 border rounded-lg bg-white'>
          <h3 className='text-xl font-semibold mb-4'>My Feedback</h3>
          {feedbacksLoading ? (
            <p className='text-center text-gray-600'>Loading feedbacks...</p>
          ) : feedbacks.length === 0 ? (
            <p className='text-center text-gray-600'>No feedbacks submitted yet.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {feedbacks.map((fb) => (
                <div key={fb._id} className='border border-gray-400 rounded-xl overflow-hidden bg-white'>
                  <div className='p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='font-semibold text-[#123458]'>{fb.facilityId?.name || 'Facility/Room'}</span>
                      <span className='flex gap-1 ml-2'>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={`text-lg ${star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </span>
                    </div>
                    <div className='text-sm text-gray-700 mb-1'><b>Cleanliness:</b> {fb.cleanliness}</div>
                    <div className='text-sm text-gray-700 mb-1'><b>Helpfulness:</b> {fb.helpful}</div>
                    {/* Facility-specific fields */}
                    {fb.audioVisual && <div className='text-sm text-gray-700 mb-1'><b>Audio/Visual:</b> {fb.audioVisual}</div>}
                    {fb.seatingComfort && <div className='text-sm text-gray-700 mb-1'><b>Seating Comfort:</b> {fb.seatingComfort}</div>}
                    {fb.bedComfort && <div className='text-sm text-gray-700 mb-1'><b>Bed Comfort:</b> {fb.bedComfort}</div>}
                    {fb.amenities && <div className='text-sm text-gray-700 mb-1'><b>Amenities:</b> {fb.amenities}</div>}
                    {fb.vehicleCondition && <div className='text-sm text-gray-700 mb-1'><b>Vehicle Condition:</b> {fb.vehicleCondition}</div>}
                    {fb.timeliness && <div className='text-sm text-gray-700 mb-1'><b>Timeliness:</b> {fb.timeliness}</div>}
                    <div className='text-sm text-gray-700 mb-1'><b>Suggestions for Improvement:</b> {fb.improvement}</div>
                    <div className='text-xs text-gray-400 mt-2'>Submitted on {new Date(fb.createdAt).toLocaleString()}</div>
                    {fb.adminMessage || fb.adminRating ? (
                      <div className='mt-4 p-3 rounded bg-gray-50 border border-gray-200'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='font-semibold text-[#123458]'>Coordinator Review</span>
                          {fb.adminRating && (
                            <span className='flex gap-1 ml-2'>
                              {[1,2,3,4,5].map(star => (
                                <span key={star} className={`text-lg ${star <= fb.adminRating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                              ))}
                            </span>
                          )}
                        </div>
                        {fb.adminMessage && <div className='text-sm text-gray-700'>{fb.adminMessage}</div>}
                        {fb.adminReviewedAt && <div className='text-xs text-gray-400 mt-1'>Reviewed on {new Date(fb.adminReviewedAt).toLocaleString()}</div>}
                      </div>
                    ) : null}
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
