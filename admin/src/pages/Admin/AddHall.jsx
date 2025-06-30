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
  const [isVehicle, setIsVehicle] = useState(false)
  const [selectedCoordinator, setSelectedCoordinator] = useState('')
  const [isNewCoordinator, setIsNewCoordinator] = useState(false)
  const { backendUrl, aToken, coordinators } = useContext(AdminContext)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [newCoordName, setNewCoordName] = useState('')
  const [newCoordEmail, setNewCoordEmail] = useState('')
  const [newCoordPassword, setNewCoordPassword] = useState('')

  // Update experience when switching between hall, guest room, and vehicle
  useEffect(() => {
    if (isGuestRoom) {
      setExperience('1 Bed')
    } else if (isVehicle) {
      setExperience('4 Seater')
    } else {
      setExperience('10 Seats')
    }
  }, [isGuestRoom, isVehicle])

  // When isVehicle is selected, set email to the fixed manager email and make it read-only
  useEffect(() => {
    if (isVehicle) {
      setEmail('202301040256@mitaoe.ac.in');
    }
  }, [isVehicle]);

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

    if (!name || !about || (!isVehicle && (!address1 || !address2))) {
      toast.error('Please fill all required fields')
      setLoading(false)
      return
    }

    if (isGuestRoom || isVehicle) {
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
    if (!isGuestRoom && !isVehicle) {
      formData.append('password', password)
    } else if (isNewCoordinator) {
      formData.append('password', password)
    }
    formData.append('speciality', speciality)
    formData.append('experience', experience)
    formData.append('about', about)
    formData.append('address', JSON.stringify(
      isVehicle
        ? {}
        : { line1: address1, line2: address2 }
    ))
    formData.append('isGuestRoom', isGuestRoom.toString())
    formData.append('isVehicle', isVehicle.toString())

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
      <h1 className="text-2xl font-bold mb-4">Add {isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}</h1>
      <form onSubmit={onSubmitHandler} className="space-y-4">
        {/* Type Selection */}
        <div className="flex items-center gap-4 border-b pb-6">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="hall"
              name="type"
              checked={!isGuestRoom && !isVehicle}
              onChange={() => {
                setIsGuestRoom(false);
                setIsVehicle(false);
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
                setIsVehicle(false);
                setEmail('');
                setPassword('');
              }}
              className="accent-[#123458]"
            />
            <label htmlFor="guestRoom" className="text-sm text-[#030303]">Guest Room</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="vehicle"
              name="type"
              checked={isVehicle}
              onChange={() => {
                setIsVehicle(true);
                setIsGuestRoom(false);
                setEmail('');
                setPassword('');
              }}
              className="accent-[#123458]"
            />
            <label htmlFor="vehicle" className="text-sm text-[#030303]">Vehicle</label>
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
          <p className="text-sm text-[#030303]">Upload {isGuestRoom ? 'guest room' : isVehicle ? 'vehicle' : 'hall'} <br /> picture</p>
        </div>

        {/* Guest Room Coordinator Selection or Hall Email/Password */}
        {(isGuestRoom || isVehicle) ? (
          <div className="border-b pb-6">
            <p className="mb-2 text-sm text-[#030303]">Select Coordinator</p>
            <select
              value={selectedCoordinator}
              onChange={handleCoordinatorChange}
              className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
            >
              <option value="">Select a coordinator</option>
              {coordinators.map((coord) => (
                <option key={coord.email} value={coord.email}>
                  {coord.name} ({coord.email})
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
              <p className="mb-1 text-sm text-[#030303]">{isVehicle ? 'Vehicle Email' : 'Hall Email'} *</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder={`Enter unique ${isVehicle ? 'vehicle' : 'hall'} email`}
                readOnly={isVehicle}
              />
              <p className="text-xs text-gray-500 mt-1">{isVehicle ? 'All vehicles can be managed by a single manager email.' : 'Email must be unique for halls'}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-[#030303]">{isVehicle ? 'Vehicle Password' : 'Hall Password'} *</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder={`Enter ${isVehicle ? 'vehicle' : 'hall'} password`}
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
                placeholder={`Enter ${isGuestRoom ? 'guest room' : isVehicle ? 'vehicle' : 'hall'} name`}
              />
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">About *</p>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                placeholder={`Enter ${isGuestRoom ? 'guest room' : isVehicle ? 'vehicle' : 'hall'} description`}
                rows="3"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            {!isVehicle && (
              <>
                <div>
                  <p className="mb-1 text-sm text-[#030303]">Address Line 1 *</p>
                  <input
                    type="text"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                    placeholder="Enter address line 1"
                    required
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
                    required
                  />
                </div>
              </>
            )}
            {/* Hall Capacity */}
            {!isGuestRoom && !isVehicle && (
              <div className="flex flex-col">
                <label className="font-medium mb-1">Capacity</label>
                <select
                  value={speciality}
                  onChange={e => setSpeciality(e.target.value)}
                  className="border rounded px-3 py-2"
                  required
                >
                  <option value="">Select Capacity</option>
                  <option value="High Capacity">High Capacity</option>
                  <option value="Low Capacity">Low Capacity</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Type and Seating Capacity */}
        {isVehicle && (
          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="font-medium mb-1">Type</label>
              <select
                value={speciality}
                onChange={e => setSpeciality(e.target.value)}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Type</option>
                <option value="Bus">Bus</option>
                <option value="Car">Car</option>
                <option value="Van">Van</option>
                <option value="Mini Bus">Mini Bus</option>
                <option value="SUV">SUV</option>
                <option value="Tempo Traveller">Tempo Traveller</option>
                <option value="Auto">Auto</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1">Seating Capacity</label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Capacity</option>
                <option value="2-seater">2-seater</option>
                <option value="4-seater">4-seater</option>
                <option value="5-seater">5-seater</option>
                <option value="7-seater">7-seater</option>
                <option value="12-seater">12-seater</option>
                <option value="20-seater">20-seater</option>
                <option value="30-seater">30-seater</option>
                <option value="50-seater">50-seater</option>
              </select>
            </div>
          </div>
        )}
        {/* Guest Room No. of Beds */}
        {isGuestRoom && (
          <div className="flex flex-col">
            <label className="font-medium mb-1">No. of Beds</label>
            <select
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="border rounded px-3 py-2"
              required
            >
              <option value="">Select Beds</option>
              <option value="1 Bed">1 Bed</option>
              <option value="2 Bed">2 Bed</option>
              <option value="3 Bed">3 Bed</option>
              <option value="4 Bed">4 Bed</option>
              <option value="5 Bed">5 Bed</option>
              <option value="6 Bed">6 Bed</option>
              <option value="7 Bed">7 Bed</option>
              <option value="8 Bed">8 Bed</option>
              <option value="9 Bed">9 Bed</option>
            </select>
          </div>
        )}

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
                Adding {isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}...
              </>
            ) : (
              `Add ${isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddHall
