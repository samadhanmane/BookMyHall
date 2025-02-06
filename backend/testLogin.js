import axios from 'axios';

const testLogin = async () => {
    const backendUrl = 'http://localhost:YOUR_BACKEND_PORT'; // Replace with your backend port

    // Test Admin Login
    try {
        const adminResponse = await axios.post(`${backendUrl}/api/admin/login`, {
            email: 'admin@example.com', // Replace with valid admin email
            password: 'adminpassword' // Replace with valid admin password
        });
        console.log('Admin Login Response:', adminResponse.data);
    } catch (error) {
        console.error('Admin Login Error:', error.message);
    }

    // Test Hall Login
    try {
        const hallResponse = await axios.post(`${backendUrl}/api/hall/login`, {
            email: 'hall@example.com', // Replace with valid hall email
            password: 'hallpassword' // Replace with valid hall password
        });
        console.log('Hall Login Response:', hallResponse.data);
    } catch (error) {
        console.error('Hall Login Error:', error.message);
    }
};

testLogin();
