import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaSpinner } from 'react-icons/fa'

const AddHall = () => {
  const [hallImg, setHallImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('10 Seats')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('High Capacity')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [isGuestRoom, setIsGuestRoom] = useState(false)
  const [existingCoordinators, setExistingCoordinators] = useState([])
  const [selectedCoordinator, setSelectedCoordinator] = useState('')
  const [isNewCoordinator, setIsNewCoordinator] = useState(false)
  const { backendUrl, aToken } = useContext(AdminContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Update experience when switching between hall and guest room
  useEffect(() => {
    if (isGuestRoom) {
      setExperience('1 Bed')
    } else {
      setExperience('10 Seats')
    }
  }, [isGuestRoom])

  // Fetch existing guest room coordinators
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const { data } = await axios.post(backendUrl + '/api/admin/all-halls', {}, {
          headers: {
            aToken
          }
        })
        if (data.success) {
          // Get unique coordinator emails from guestRooms object
          const coordinators = Object.keys(data.guestRooms || {})
          setExistingCoordinators(coordinators)
          console.log('Found coordinators:', coordinators)
        }
      } catch (error) {
        console.error('Error fetching coordinators:', error)
        toast.error('Failed to fetch existing coordinators')
      }
    }

    fetchCoordinators()
  }, [aToken, backendUrl])

  const handleCoordinatorChange = (e) => {
    const value = e.target.value
    setSelectedCoordinator(value)
    if (value === 'new') {
      setIsNewCoordinator(true)
      setEmail('')
      setPassword('')
    } else {
      setIsNewCoordinator(false)
      setEmail(value) // Set the email to the selected coordinator's email
      setPassword('') // Clear password as we don't store it
    }
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)

    if (!hallImg) {
      toast.error('Please upload an image')
      setLoading(false)
      return
    }

    if (!name || !about || !address1 || !address2) {
      toast.error('Please fill all required fields')
      setLoading(false)
      return
    }

    if (isGuestRoom) {
      if (!selectedCoordinator) {
        toast.error('Please select a coordinator or create a new one')
        setLoading(false)
        return
      }
      if (isNewCoordinator && (!email || !password)) {
        toast.error('Please fill in coordinator details')
        setLoading(false)
        return
      }
    } else {
      if (!email || !password) {
        toast.error('Please fill in email and password for the hall')
        setLoading(false)
        return
      }
    }

    const formData = new FormData()
    formData.append('image', hallImg)
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    formData.append('speciality', speciality)
    formData.append('experience', experience)
    formData.append('about', about)
    formData.append('address', JSON.stringify({
      line1: address1,
      line2: address2
    }))
    formData.append('isGuestRoom', isGuestRoom.toString())

    try {
      const { data } = await axios.post(backendUrl + '/api/admin/add-hall', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          aToken
        }
      })
      if (data.success) {
        toast.success(data.message)
        // Reset form
        setHallImg(false)
        setName('')
        setEmail('')
        setPassword('')
        setExperience('10 Seats')
        setAbout('')
        setSpeciality('High Capacity')
        setAddress1('')
        setAddress2('')
        setSelectedCoordinator('')
        setIsNewCoordinator(false)
        navigate('/hall-list')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add hall/room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Add {isGuestRoom ? 'Guest Room' : 'Hall'}</h1>
      <form onSubmit={onSubmitHandler} className="space-y-4">
        {/* Type Selection */}
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="hall"
              name="type"
              checked={!isGuestRoom}
              onChange={() => {
                setIsGuestRoom(false);
                setSelectedCoordinator('');
                setIsNewCoordinator(false);
                setEmail('');
                setPassword('');
              }}
              className="accent-[#123458]"
            />
            <label htmlFor="hall" className="text-sm text-[#030303]">Hall</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="guestRoom"
              name="type"
              checked={isGuestRoom}
              onChange={() => {
                setIsGuestRoom(true);
                setEmail('');
                setPassword('');
              }}
              className="accent-[#123458]"
            />
            <label htmlFor="guestRoom" className="text-sm text-[#030303]">Guest Room</label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-4 border-b pb-6">
          <label htmlFor="hall-img">
            <img
              className="w-20 h-20 object-cover border rounded-full cursor-pointer"
              src={hallImg ? URL.createObjectURL(hallImg) : assets.upload_area}
              alt="Upload"
            />
          </label>
          <input onChange={(e) => setHallImg(e.target.files[0])} type="file" id="hall-img" hidden />
          <p className="text-sm text-[#030303]">Upload {isGuestRoom ? 'guest room' : 'hall'} <br /> picture</p>
        </div>

        {/* Guest Room Coordinator Selection or Hall Email/Password */}
        {isGuestRoom ? (
          <div className="border-b pb-6">
            <p className="mb-2 text-sm text-[#030303]">Select Coordinator</p>
            <select
              value={selectedCoordinator}
              onChange={handleCoordinatorChange}
              className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
            >
              <option value="">Select a coordinator</option>
              {existingCoordinators.map((coordinator) => (
                <option key={coordinator} value={coordinator}>
                  {coordinator}
                </option>
              ))}
              <option value="new">Add New Coordinator</option>
            </select>
            {isNewCoordinator && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-1 text-sm text-[#030303]">New Coordinator Email *</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                    placeholder="Enter coordinator email"
                  />
                </div>
                <div>
                  <p className="mb-1 text-sm text-[#030303]">New Coordinator Password *</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                    placeholder="Enter coordinator password"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-b pb-6 space-y-4">
            <div>
              <p className="mb-1 text-sm text-[#030303]">Hall Email *</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder="Enter unique hall email"
              />
              <p className="text-xs text-gray-500 mt-1">Email must be unique for halls</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-[#030303]">Hall Password *</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder="Enter hall password"
              />
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm text-[#030303]">Name *</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder={`Enter ${isGuestRoom ? 'guest room' : 'hall'} name`}
              />
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">About *</p>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder={`Enter ${isGuestRoom ? 'guest room' : 'hall'} description`}
                rows="3"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm text-[#030303]">Address Line 1 *</p>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder="Enter address line 1"
              />
            </div>
            <div>
              <p className="mb-1 text-sm text-[#030303]">Address Line 2 *</p>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder="Enter address line 2"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Capacity ({isGuestRoom ? 'Beds' : 'Seats'})</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="border rounded p-2"
              >
                {isGuestRoom ? (
                  <>
                    <option value="1 Bed">1 Bed</option>
                    <option value="5 Beds">2 Beds</option>
                    <option value="10 Beds">3 Beds</option>
                    <option value="15 Beds">4 Beds</option>
                    <option value="20 Beds">5 Beds</option>
                    <option value="25 Beds">6 Beds</option>
                    <option value="30 Beds">7 Beds</option>
                    <option value="40 Beds">8 Beds</option>
                    <option value="50 Beds">9 Beds</option>
                  </>
                ) : (
                  <>
                    <option value="10 Seats">10 Seats</option>
                    <option value="20 Seats">20 Seats</option>
                    <option value="30 Seats">30 Seats</option>
                    <option value="40 Seats">40 Seats</option>
                    <option value="50 Seats">50 Seats</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Adding {isGuestRoom ? 'Guest Room' : 'Hall'}...
              </>
            ) : (
              `Add ${isGuestRoom ? 'Guest Room' : 'Hall'}`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddHall
