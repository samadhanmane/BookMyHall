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
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

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
      fetchUserFeedbacks()
    }
  }, [userData])

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

  if (!userData) {
    return <div className="min-h-screen px-6 sm:px-10 py-10 bg-white font-poppins text-[#030303]">
      <p>Loading profile data...</p>
      </div>
  }

  return userData && (
    <div className='min-h-screen flex flex-col items-center justify-start bg-white font-[Poppins] text-[#030303] px-4 py-10'>
      <div className='max-w-lg w-full bg-white border border-gray-200 rounded-lg p-8 shadow-md'>
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
      {/* Feedback Section */}
      <div className='max-w-4xl w-full mt-10'>
        <div className='p-6 border rounded-lg shadow-md shadow-[#00000010] bg-white'>
          <h3 className='text-xl font-semibold mb-4'>My Feedback</h3>
          {feedbacksLoading ? (
            <p className='text-center text-gray-600'>Loading feedbacks...</p>
          ) : feedbacks.length === 0 ? (
            <p className='text-center text-gray-600'>No feedbacks submitted yet.</p>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {feedbacks.map((fb) => (
                <div key={fb._id} className='border border-[#123458] rounded-xl overflow-hidden shadow-md bg-white'>
                  <div className='p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <span className='font-semibold text-[#123458]'>{fb.hallId?.name || 'Hall/Room'}</span>
                      <span className='flex gap-1 ml-2'>
                        {[1,2,3,4,5].map(star => (
                          <span key={star} className={`text-lg ${star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                      </span>
                    </div>
                    <div className='text-sm text-gray-700 mb-1'><b>Cleanliness:</b> {fb.cleanliness}</div>
                    <div className='text-sm text-gray-700 mb-1'><b>Description Match:</b> {fb.descriptionMatch}</div>
                    <div className='text-sm text-gray-700 mb-1'><b>Electricity:</b> {fb.electricity}</div>
                    <div className='text-sm text-gray-700 mb-1'><b>Other Comments:</b> {fb.otherComments}</div>
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
