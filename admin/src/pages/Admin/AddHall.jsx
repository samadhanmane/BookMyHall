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

  // Coordinator selection now uses email
  const handleCoordinatorChange = (e) => {
    const value = e.target.value;
    setSelectedCoordinator(value);
    if (value === 'new') {
      setIsNewCoordinator(true);
      setEmail('');
      setPassword('');
      setNewCoordName('');
      setNewCoordEmail('');
      setNewCoordPassword('');
    } else {
      setIsNewCoordinator(false);
      setEmail(value); // Use coordinator email for guest room/vehicle
      setPassword('');
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!hallImg) {
      toast.error('Please upload an image');
      setLoading(false);
      return;
    }

    if (!name || !about || (!isVehicle && (!address1 || !address2))) {
      toast.error('Please fill all required fields');
      setLoading(false);
      return;
    }

    let coordinatorEmail = '';
    if (isGuestRoom || isVehicle) {
      if (!selectedCoordinator && !isNewCoordinator) {
        toast.error('Please select a coordinator or create a new one');
        setLoading(false);
        return;
      }
      if (isNewCoordinator) {
        if (!newCoordName || !newCoordEmail || !newCoordPassword) {
          toast.error('Please fill in all new coordinator details');
          setLoading(false);
          return;
        }
        // Create new coordinator first
        try {
          const { data } = await axios.post(
            backendUrl + '/api/admin/add-coordinator',
            { name: newCoordName, email: newCoordEmail, password: newCoordPassword },
            { headers: { aToken } }
          );
          if (data.success && data.coordinator) {
            coordinatorEmail = data.coordinator.email;
            setSelectedCoordinator(data.coordinator.email);
            setEmail(data.coordinator.email);
            setIsNewCoordinator(false);
          } else {
            toast.error(data.message || 'Failed to add coordinator');
            setLoading(false);
            return;
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to add coordinator');
          setLoading(false);
          return;
      }
    } else {
        coordinatorEmail = selectedCoordinator;
      }
    }

    // For halls, require email and password
    if (!isGuestRoom && !isVehicle) {
      if (!email || !password) {
        toast.error('Please fill in email and password for the hall');
        setLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append('image', hallImg);
    formData.append('name', name);
    if (!isGuestRoom && !isVehicle) {
      formData.append('email', email);
      formData.append('password', password);
    }
    formData.append('speciality', speciality);
    formData.append('experience', experience);
    formData.append('about', about);
    formData.append('address', JSON.stringify(
      isVehicle
        ? {}
        : { line1: address1, line2: address2 }
    ));
    formData.append('isGuestRoom', isGuestRoom.toString());
    formData.append('isVehicle', isVehicle.toString());
    if ((isGuestRoom || isVehicle)) {
      // Always use coordinator email for guest room/vehicle
      formData.append('email', isNewCoordinator ? newCoordEmail : coordinatorEmail);
    }

    try {
      const { data } = await axios.post(backendUrl + '/api/admin/add-hall', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          token: aToken
        }
      });
      if (data.success) {
        toast.success(data.message);
        // Reset form
        setHallImg(false);
        setName('');
        setEmail('');
        setPassword('');
        setExperience('10 Seats');
        setAbout('');
        setSpeciality('High Capacity');
        setAddress1('');
        setAddress2('');
        setSelectedCoordinator('');
        setIsNewCoordinator(false);
        setNewCoordName('');
        setNewCoordEmail('');
        setNewCoordPassword('');
        navigate('/hall-list');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add hall/room');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown options
  const capacityOptions = [
    { label: 'High Capacity', value: 'High Capacity' },
    { label: 'Low Capacity', value: 'Low Capacity' },
  ];
  const hallSeatOptions = ['10', '20', '30', '40', '50', '100', '200'];
  const guestRoomBedOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const vehicleSeatOptions = [
    '2-seater', '4-seater', '5-seater', '7-seater', '12-seater', '20-seater', '30-seater', '50-seater'
  ];
  const vehicleTypeOptions = [
    'Bus', 'Car', 'Van', 'Mini Bus', 'SUV', 'Tempo Traveller', 'Auto', 'Bike'
  ];

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 border border-[#123458]/30 rounded-xl shadow-lg p-10 mt-10 font-[Poppins]">
      <h1 className="text-3xl font-bold mb-8 text-[#123458]">Add {isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}</h1>
      <form onSubmit={onSubmitHandler} className="space-y-8">
        {/* Type Selection */}
        <div className="flex flex-wrap gap-6 mb-6">
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
              className="accent-[#123458] w-5 h-5"
            />
            <label htmlFor="hall" className="text-base font-semibold text-[#123458]">Hall</label>
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
              className="accent-[#123458] w-5 h-5"
            />
            <label htmlFor="guestRoom" className="text-base font-semibold text-[#123458]">Guest Room</label>
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
                setEmail('202301040256@mitaoe.ac.in');
              }}
              className="accent-[#123458] w-5 h-5"
            />
            <label htmlFor="vehicle" className="text-base font-semibold text-[#123458]">Vehicle</label>
          </div>
        </div>

        {/* Coordinator selection for Guest Room/Vehicle */}
        {(isGuestRoom || isVehicle) && (
          <div className="mb-6">
            <label className="mb-2 block text-[#123458] font-semibold">Coordinator *</label>
            <select
              value={selectedCoordinator}
              onChange={handleCoordinatorChange}
              className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
              required={!isNewCoordinator}
            >
              <option value="">Select Coordinator</option>
              {coordinators.map((coord) => (
                <option key={coord.email} value={coord.email}>{coord.name} ({coord.email})</option>
              ))}
            </select>
            {isNewCoordinator && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <input
                    type="text"
                    value={newCoordName}
                  onChange={e => setNewCoordName(e.target.value)}
                  className="p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Coordinator Name"
                  required
                />
                  <input
                    type="email"
                    value={newCoordEmail}
                  onChange={e => setNewCoordEmail(e.target.value)}
                  className="p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Coordinator Email"
                  required
                />
                  <input
                    type="password"
                    value={newCoordPassword}
                  onChange={e => setNewCoordPassword(e.target.value)}
                  className="p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Coordinator Password"
                  required
                  />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-[#123458] font-semibold">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                placeholder={`Enter ${isGuestRoom ? 'guest room' : isVehicle ? 'vehicle' : 'hall'} name`}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[#123458] font-semibold">About *</label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458] resize-none"
                placeholder={`Enter ${isGuestRoom ? 'guest room' : isVehicle ? 'vehicle' : 'hall'} description`}
                rows="3"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-[#123458] font-semibold">Image *</label>
              <input
                type="file"
                onChange={(e) => setHallImg(e.target.files[0])}
                className="w-full p-2 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                required
              />
            </div>
          </div>
          {/* Right Side */}
          <div className="space-y-6">
            {/* Email field for Hall only */}
            {!isGuestRoom && !isVehicle && (
                <div>
                <label className="mb-2 block text-[#123458] font-semibold">Email *</label>
                  <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Enter email"
                    required
                  />
                </div>
            )}
            {/* Password field for Hall only */}
            {!isGuestRoom && !isVehicle && (
                <div>
                <label className="mb-2 block text-[#123458] font-semibold">Password *</label>
                  <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Enter password"
                    required
                  />
                </div>
            )}
            {/* Capacity/No. of Beds/No. of Seats dropdowns */}
            {/* Hall & Guest Room: Capacity */}
            {(!isVehicle) && (
              <div>
                <label className="mb-2 block text-[#123458] font-semibold">Capacity *</label>
                <select
                  value={speciality}
                  onChange={e => setSpeciality(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  required
                >
                  <option value="">Select Capacity</option>
                  {capacityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Hall: No. of Seats */}
            {!isGuestRoom && !isVehicle && (
              <div>
                <label className="mb-2 block text-[#123458] font-semibold">No. of Seats *</label>
              <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                required
              >
                  <option value="">Select No. of Seats</option>
                  {hallSeatOptions.map(opt => (
                    <option key={opt} value={`${opt} Seats`}>{opt} Seats</option>
                  ))}
              </select>
            </div>
            )}
            {/* Guest Room: No. of Beds */}
            {isGuestRoom && (
              <div>
                <label className="mb-2 block text-[#123458] font-semibold">No. of Beds *</label>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                required
              >
                  <option value="">Select No. of Beds</option>
                  {guestRoomBedOptions.map(opt => (
                    <option key={opt} value={`${opt} Bed${opt === '1' ? '' : 's'}`}>{opt} Bed{opt === '1' ? '' : 's'}</option>
                  ))}
              </select>
          </div>
        )}
            {/* Vehicle: Type */}
           {isVehicle && (
             <div>
               <label className="mb-2 block text-[#123458] font-semibold">Vehicle Type *</label>
               <select
                 value={speciality}
                 onChange={e => setSpeciality(e.target.value)}
                 className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                 required
               >
                 <option value="">Select Vehicle Type</option>
                 {vehicleTypeOptions.map(opt => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
           )}
            {/* Vehicle: No. of Seats */}
            {isVehicle && (
              <div>
                <label className="mb-2 block text-[#123458] font-semibold">No. of Seats *</label>
            <select
              value={experience}
              onChange={e => setExperience(e.target.value)}
              className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
              required
            >
              <option value="">Select No. of Seats</option>
              {vehicleSeatOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
            {/* Address for Hall and Guest Room only */}
            {(!isVehicle) && (
              <div>
                <label className="mb-2 block text-[#123458] font-semibold">Address *</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458] mb-2"
                  placeholder="Address line 1"
                  required
                />
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full p-3 border border-[#123458]/20 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  placeholder="Address line 2"
                  required
                />
              </div>
            )}
          </div>
        </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-8 py-3 bg-[#123458] text-white text-lg font-bold rounded-lg shadow hover:bg-[#0e2e47] transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            } flex items-center justify-center gap-3`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-2xl" />
                <span>Adding {isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}...</span>
              </>
            ) : (
              `Add ${isGuestRoom ? 'Guest Room' : isVehicle ? 'Vehicle' : 'Hall'}`
            )}
          </button>
      </form>
    </div>
  )
}

export default AddHall
