import React, { useContext, useEffect, useState } from 'react'
import { HallContext } from '../../context/HallContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const HallProfile = () => {
  const { dToken, profileData, setProfileData, getProfileData, backendUrl, setDToken } = useContext(HallContext)
  const [isEdit, setIsEdit] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [guestRooms, setGuestRooms] = useState([])
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRoom, setEditingRoom] = useState(null)
  const [editingHall, setEditingHall] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    speciality: '',
    experience: '',
    about: '',
    address: { line1: '', line2: '' },
    available: true,
    image: ''
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const navigate = useNavigate()

  // Function to handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${backendUrl}/api/hall/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        const imageUrl = `${backendUrl}${response.data.imageUrl}`;
        setEditForm(prev => ({ ...prev, image: imageUrl }));
        setImagePreview(imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Function to handle edit click for guest rooms
  const handleEditRoomClick = (room) => {
    setEditingRoom(room._id);
    setEditForm({
      name: room.name,
      email: room.email,
      speciality: room.speciality,
      experience: room.experience,
      about: room.about,
      address: { ...room.address },
      available: room.available,
      image: room.image
    });
    setImagePreview(room.image);
  };

  // Function to handle edit click for halls
  const handleEditHallClick = (hall) => {
    setEditingHall(hall._id);
    setEditForm({
      name: hall.name,
      email: hall.email,
      speciality: hall.speciality,
      experience: hall.experience,
      about: hall.about,
      address: { ...hall.address },
      available: hall.available,
      image: hall.image
    });
    setImagePreview(hall.image);
  };

  // Function to handle edit submit for guest rooms
  const handleEditRoomSubmit = async (roomId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/hall/update-guest-room`,
        {
          roomId,
          ...editForm
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        toast.success('Guest room updated successfully');
        setEditingRoom(null);
        setImagePreview(null);
        // Refresh guest rooms data
        await fetchGuestRooms();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating guest room:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update guest room');
    }
  };

  // Function to handle edit submit for halls
  const handleEditHallSubmit = async (hallId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/hall/update-profile`,
        {
          hallId,
          ...editForm
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        toast.success('Hall updated successfully');
        setEditingHall(null);
        setImagePreview(null);
        // Refresh halls data
        await fetchHalls();
        // Also refresh profile data since it might be affected
        await getProfileData();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error updating hall:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update hall');
    }
  };

  // Function to handle cancel edit
  const handleCancelEdit = () => {
    setEditingRoom(null);
    setEditingHall(null);
    setImagePreview(null);
    setEditForm({
      name: '',
      email: '',
      speciality: '',
      experience: '',
      about: '',
      address: { line1: '', line2: '' },
      available: true,
      image: ''
    });
  };

  // Function to fetch halls
  const fetchHalls = async () => {
    try {
      if (!profileData || !profileData.email) return;

      console.log('Fetching halls for email:', profileData.email);
      const response = await axios.get(
        `${backendUrl}/api/hall/get-halls`,
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        console.log('Halls fetched:', response.data);
        // Only show halls in the halls section, never show guest rooms here
        const filteredHalls = response.data.halls.filter(hall => !hall.isGuestRoom);
        setHalls(filteredHalls.filter(hall => hall && hall._id)); // Filter out invalid halls
      } else {
        console.error('Failed to fetch halls:', response.data);
        toast.error(response.data.message || 'Failed to fetch halls');
        setHalls([]);
      }
    } catch (error) {
      console.error('Error fetching halls:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch halls');
      setHalls([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestRooms = async () => {
    try {
      if (!profileData || !profileData.email) return;

      console.log('Fetching guest rooms for email:', profileData.email);
      const response = await axios.get(
        `${backendUrl}/api/hall/get-halls`,
        {
          headers: {
            'Content-Type': 'application/json',
            'dToken': dToken
          }
        }
      );

      if (response.data.success) {
        console.log('Guest rooms fetched:', response.data);
        // Only show guest rooms in the guest rooms section
        const filteredGuestRooms = response.data.halls.filter(hall => hall.isGuestRoom);
        setGuestRooms(filteredGuestRooms.filter(room => room && room._id)); // Filter out invalid rooms
      } else {
        console.error('Failed to fetch guest rooms:', response.data);
        toast.error(response.data.message || 'Failed to fetch guest rooms');
        setGuestRooms([]);
      }
    } catch (error) {
      console.error('Error fetching guest rooms:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch guest rooms');
      setGuestRooms([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Load profile data and fetch related data when component mounts
  useEffect(() => {
    const loadData = async () => {
    if (dToken) {
        await getProfileData();
      }
    };
    loadData();
  }, [dToken]);

  // Fetch guest rooms and halls when profile data is available
  useEffect(() => {
    if (profileData) {
      fetchGuestRooms();
      fetchHalls();
    }
  }, [profileData]);

  // Render edit form
  const renderEditForm = (item, isHall = false) => (
    <div className="space-y-4">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {isHall ? 'Hall' : 'Room'} Image
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden">
            <img 
              src={imagePreview || item.image || 'https://placehold.co/300x200/e2e8f0/475569?text=No+Image'}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id={`image-upload-${item._id}`}
            />
            <label
              htmlFor={`image-upload-${item._id}`}
              className="block w-full px-4 py-2 text-sm text-center text-white bg-blue-500 rounded hover:bg-blue-600 cursor-pointer"
            >
              {uploadingImage ? 'Uploading...' : 'Change Image'}
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Max size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
        </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
          value={editForm.name}
          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
          value={editForm.email}
          onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
          </div>

      {/* Speciality */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Speciality</label>
                <select 
          value={editForm.speciality}
          onChange={(e) => setEditForm(prev => ({ ...prev, speciality: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="High Capacity">High Capacity</option>
                  <option value="Low Capacity">Low Capacity</option>
                </select>
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Experience</label>
                <select 
          value={editForm.experience}
          onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="10 Seats">10 Seats</option>
                  <option value="20 Seats">20 Seats</option>
                  <option value="30 Seats">30 Seats</option>
                  <option value="40 Seats">40 Seats</option>
                  <option value="50 Seats">50 Seats</option>
                  <option value="100 Seats">100 Seats</option>
                  <option value="200 Seats">200 Seats</option>
                </select>
          </div>

      {/* About */}
          <div>
        <label className="block text-sm font-medium text-gray-700">About</label>
        <textarea
          value={editForm.about}
          onChange={(e) => setEditForm(prev => ({ ...prev, about: e.target.value }))}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
          </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 1</label>
                  <input 
                    type="text" 
          value={editForm.address.line1}
          onChange={(e) => setEditForm(prev => ({
                      ...prev, 
            address: { ...prev.address, line1: e.target.value }
                    }))} 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                  <input 
                    type="text" 
          value={editForm.address.line2}
          onChange={(e) => setEditForm(prev => ({
                      ...prev, 
            address: { ...prev.address, line2: e.target.value }
          }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
          </div>

      {/* Available */}
      <div className="flex items-center">
            <input 
              type="checkbox" 
          checked={editForm.available}
          onChange={(e) => setEditForm(prev => ({ ...prev, available: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
        <label className="ml-2 block text-sm text-gray-900">Available</label>
          </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => isHall ? handleEditHallSubmit(item._id) : handleEditRoomSubmit(item._id)}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save
        </button>
            <button 
          onClick={handleCancelEdit}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
          Cancel
            </button>
      </div>
    </div>
  );

  // If profileData is not loaded yet, show loading state
  if (!profileData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no guest rooms or halls found, show message
  if (guestRooms.length === 0 && halls.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">No Data Found</h2>
          <p className="text-gray-600">No guest rooms or halls found for this email.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Guest Rooms Section */}
      {guestRooms && guestRooms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Guest Rooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guestRooms.map((room) => (
              room && room._id && (
                <div key={room._id} className="bg-white rounded-lg shadow-lg p-6">
                  {editingRoom === room._id ? (
                    renderEditForm(room, false)
                  ) : (
                    <>
                      <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                        <img 
                          src={room.image || 'https://placehold.co/300x200/e2e8f0/475569?text=No+Image'} 
                          alt={room.name || 'Guest Room'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{room.name || 'Unnamed Room'}</h3>
                          <p className="text-gray-600">{room.speciality || 'No speciality'}</p>
                          <p className="text-gray-600">{room.experience || 'No experience'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">{room.about || 'No description available'}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>Address:</p>
                          <p>{room.address?.line1 || 'No address line 1'}</p>
                          <p>{room.address?.line2 || 'No address line 2'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {room.available ? 'Available' : 'Not Available'}
                          </span>
            <button 
                            onClick={() => handleEditRoomClick(room)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit
            </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Halls Section */}
      {halls && halls.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Halls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.map((hall) => (
              hall && hall._id && (
                <div key={hall._id} className="bg-white rounded-lg shadow-lg p-6">
                  {editingHall === hall._id ? (
                    renderEditForm(hall, true)
                  ) : (
                    <>
                      <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                        <img 
                          src={hall.image || 'https://placehold.co/300x200/e2e8f0/475569?text=No+Image'} 
                          alt={hall.name || 'Hall'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{hall.name || 'Unnamed Hall'}</h3>
                          <p className="text-gray-600">{hall.speciality || 'No speciality'}</p>
                          <p className="text-gray-600">{hall.experience || 'No experience'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">{hall.about || 'No description available'}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          <p>Address:</p>
                          <p>{hall.address?.line1 || 'No address line 1'}</p>
                          <p>{hall.address?.line2 || 'No address line 2'}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            hall.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {hall.available ? 'Available' : 'Not Available'}
                          </span>
                          <button
                            onClick={() => handleEditHallClick(hall)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default HallProfile;
