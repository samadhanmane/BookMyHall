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
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = new FormData();
        for (const key in formData) {
            form.append(key, formData[key]);
        }

        try {
            const response = await axios.post('/add-halls', form, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(response.data.message);
        } catch (error) {
            alert('Error adding hall: ' + error.response.data.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
            <input type="text" name="speciality" placeholder="Speciality" onChange={handleChange} required />
            <input type="text" name="experience" placeholder="Experience" onChange={handleChange} required />
            <textarea name="about" placeholder="About" onChange={handleChange} required></textarea>
            <input type="text" name="address" placeholder="Address" onChange={handleChange} required />
            <input type="file" name="image" onChange={handleFileChange} required />
            <button type="submit">Add Hall</button>
        </form>
    );
};

export default AddHall;
