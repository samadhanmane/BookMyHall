import React, { useContext, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

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
  const { backendUrl, aToken } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {
      if (!hallImg) return toast.error('Image Not Selected')
      const formData = new FormData()
      formData.append('image', hallImg)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('experience', experience)
      formData.append('about', about)
      formData.append('speciality', speciality)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      const { data } = await axios.post(`${backendUrl}/api/admin/add-hall`, formData, {
        headers: { aToken }
      })

      if (data.success) {
        toast.success(data.message)
        setHallImg(false)
        setName('')
        setEmail('')
        setPassword('')
        setAbout('')
        setAddress1('')
        setAddress2('')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className="m-5 font-[Poppins] w-full">
      <p className="mb-3 text-xl font-semibold text-[#030303]">Add Hall</p>

      <div className="bg-white border border-[#123458] rounded-lg p-6 shadow-md w-full max-w-4xl max-h-[80vh] overflow-y-auto space-y-6">

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
          <p className="text-sm text-[#030303]">Upload hall <br /> picture</p>
        </div>

        {/* Inputs */}
        <div className="flex flex-col lg:flex-row gap-10 border-b pb-6">
          {/* Left Side */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div>
              <p className="mb-1 text-sm text-[#030303]">Hall Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                type="text"
                placeholder="Name"
                required
              />
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">Hall Coordinator Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">Hall Coordinator Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">Seating Capacity</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
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
          </div>

          {/* Right Side */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div>
              <p className="mb-1 text-sm text-[#030303]">Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
              >
                <option value="High Capacity">High Capacity</option>
                <option value="Low Capacity">Low Capacity</option>
              </select>
            </div>

            <div>
              <p className="mb-1 text-sm text-[#030303]">Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="w-full border border-[#123458] rounded px-3 py-2 mb-2 text-[#030303] shadow-sm"
                type="text"
                placeholder="Address 1"
                required
              />
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="w-full border border-[#123458] rounded px-3 py-2 text-[#030303] shadow-sm"
                type="text"
                placeholder="Address 2"
                required
              />
            </div>
          </div>
        </div>

        {/* About Hall */}
        <div className="border-b pb-6">
          <p className="mb-2 text-sm text-[#030303]">About Hall</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="w-full border border-[#123458] rounded px-4 pt-2 text-[#030303] shadow-sm"
            rows={5}
            placeholder="Write about hall"
            required
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            className="bg-[#123458] text-white font-medium px-8 py-3 rounded shadow hover:opacity-90 transition duration-200"
          >
            Add Hall
          </button>
        </div>
      </div>
    </form>
  )
}

export default AddHall
