import axios from 'axios';

const testOtpFunctionality = async () => {
    const email = 'samadhanmane2324@gmail.com'; // Your email address
    const newPassword = '12345678';

    console.log('Testing OTP functionality...');
    console.log('Sending OTP to:', email);

    try {
        const sendOtpResponse = await axios.post('http://localhost:4000/api/user/forgot-password', { email });
        console.log('Send OTP Response:', sendOtpResponse.data);
        
        if (sendOtpResponse.data.success) {
            console.log('Please check your email for the OTP');
            console.log('Update the receivedOtp variable with the OTP you received and run the script again');
        }
    } catch (error) {
        console.error('Error sending OTP:', error.response?.data || error.message);
    }
};

testOtpFunctionality();
