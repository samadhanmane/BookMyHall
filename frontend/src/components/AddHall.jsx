import React, { useState } from 'react';
import axios from 'axios';

const AddHall = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    speciality: '',
    experience: '',
    about: '',
    address: '',
    image: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    for (const key in formData) {
      form.append(key, formData[key]);
    }

    try {
      const response = await axios.post('/add-halls', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(response.data.message);
    } catch (error) {
      alert('Error adding facility: ' + error.response.data.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 border border-[#e0e0e0] rounded-xl shadow-sm font-[Poppins]">
      <h2 className="text-2xl font-semibold mb-6 text-[#123458]">Add a New Facility</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="text" name="speciality" placeholder="Speciality" onChange={handleChange} required />
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="text" name="experience" placeholder="Experience" onChange={handleChange} required />
        <textarea className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none resize-none" name="about" placeholder="About" onChange={handleChange} required></textarea>
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="text" name="address" placeholder="Address" onChange={handleChange} required />
        <input className="border border-[#e0e0e0] px-4 py-2 rounded focus:outline-none" type="file" name="image" onChange={handleFileChange} required />
        <button type="submit" className="bg-[#123458] text-white px-6 py-2 rounded-md hover:opacity-90 transition-all duration-300 mt-2">
          Add Facility
        </button>
      </form>
    </div>
  );
};

export default AddHall;
