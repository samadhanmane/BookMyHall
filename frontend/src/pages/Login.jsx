import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('Sign Up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [forgotPassword, setForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (authMode === 'Sign Up' && !name) errors.name = 'Name is required';
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setOtp('');
    setNewPassword('');
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (forgotPassword) return;
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      let response;

      if (authMode === 'Sign Up') {
        response = await axios.post(backendUrl + '/api/user/register', { name, password, email });
      } else {
        response = await axios.post(backendUrl + '/api/user/login', { password, email });
      }

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        clearForm();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(backendUrl + '/api/user/forgot-password', { 
        email,
        type: 'user'
      });
      if (response.data.success) {
        toast.success('OTP sent to your email');
        setForgotPassword(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!otp || !newPassword) {
      toast.error('Please enter both OTP and new password');
      return;
    }

    try {
      const response = await axios.post(backendUrl + '/api/user/reset-password', {
        email,
        otp,
        newPassword,
        type: 'user'
      });

      if (response.data.success) {
        toast.success('Password reset successfully');
        clearForm();
        setForgotPassword(false);
        setAuthMode('Login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center font-poppins bg-white text-[#030303]">
      <div className="w-full max-w-md border border-gray-200 shadow-md rounded-lg p-8">
        {forgotPassword ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-[#123458]">Reset Password</h2>

            <div>
              <label className="block text-sm mb-1">OTP sent to your email</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleResetPassword}
              className="bg-[#123458] text-white w-full py-2 rounded-md hover:opacity-90 transition-all duration-150"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              onClick={() => setForgotPassword(false)}
              className="text-[#123458] underline text-sm hover:opacity-80"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-[#123458]">
              {authMode === 'Sign Up' ? 'Create Account' : 'Login'}
            </h2>
            <p className="text-sm">Please {authMode === 'Sign Up' ? 'sign up' : 'log in'} to book a seminar hall</p>

            {authMode === 'Sign Up' && (
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#123458]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="bg-[#123458] text-white w-full py-2 rounded-md hover:opacity-90 transition-all duration-150"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait...' : authMode === 'Sign Up' ? 'Create Account' : 'Login'}
            </button>

            {authMode === 'Sign Up' ? (
              <p className="text-sm">
                Already have an account?{' '}
                <span onClick={() => setAuthMode('Login')} className="text-[#123458] underline cursor-pointer">
                  Login here
                </span>
              </p>
            ) : (
              <>
                <p className="text-sm">
                  New user?{' '}
                  <span onClick={() => setAuthMode('Sign Up')} className="text-[#123458] underline cursor-pointer">
                    Sign up
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#123458] underline mt-1 hover:opacity-80"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Forgot Password?'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
