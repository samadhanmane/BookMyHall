import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const [state, setState] = useState('Sign Up');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!email) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (state === 'Sign Up' && !name) errors.name = 'Name is required';
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (forgotPassword) return; // Don't handle regular login if in forgot password mode

    if (!validateForm()) return;

    try {
      let response;
      if (state === 'Sign Up') {
        response = await axios.post(backendUrl + '/api/user/register', { name, password, email });
      } else {
        response = await axios.post(backendUrl + '/api/user/login', { password, email });
       
      }

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const [forgotPassword, setForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first');
      return;
    }
  
    try {
      const response = await axios.post(backendUrl + '/api/user/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      
      if (response.data.success) {
        toast.success('OTP sent to your email');
        setForgotPassword(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    }
  };
  

  const handleResetPassword = async (event) => {
    event.preventDefault();
  
    if (!otp || !newPassword) {
      toast.error('Please enter both OTP and new password');
      return;
    }
  
    try {
      console.log('Sending reset request with:', { email, otp, newPassword });
      
      const response = await axios.post(backendUrl + '/api/user/reset-password', {
        email,
        otp,
        newPassword
      });
      
  

      if (response.data.success) {
        toast.success('Password reset successfully');
        setForgotPassword(false);
        setOtp('');
        setNewPassword('');
        setState('Login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };
  
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token]);

  return (
    <div className="min-h-[80vh] flex items-center">
      {forgotPassword ? (
        // Separate form for password reset
        <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
          <p className="text-2xl font-semibold">Reset Password</p>
          <div className="w-full">
            <p>Enter OTP sent to your email</p>
            <input 
              className="border border-zinc-300 rounded w-full p-2 mt-1" 
              type="text" 
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="w-full">
            <p>New Password</p>
            <input 
              className="border border-zinc-300 rounded w-full p-2 mt-1" 
              type="password" 
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button 
            onClick={handleResetPassword}
            className="bg-primary text-white w-full py-2 rounded-md text-base"
          >
            Reset Password
          </button>
          <button 
            onClick={() => setForgotPassword(false)}
            className="text-primary underline cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      ) : (
        // Regular login/signup form
        <form onSubmit={onSubmitHandler} className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
          <p className="text-2xl font-semibold">{state === 'Sign Up' ? "Create Account" : "Login"}</p>
          <p>Please {state === 'Sign Up' ? "Sign up" : "log in"} to book an appointment</p>

          {state === 'Sign Up' && (
            <div className="w-full">
              <p>Full Name</p>
              <input className="border border-zinc-300 rounded w-full p-2 mt-1" type="text" onChange={(e) => setName(e.target.value)} value={name} />
              {errors.name && <p className="text-red-500">{errors.name}</p>}
            </div>
          )}

          <div className="w-full">
            <p>Email</p>
            <input className="border border-zinc-300 rounded w-full p-2 mt-1" type="email" onChange={(e) => setEmail(e.target.value)} value={email} />
            {errors.email && <p className="text-red-500">{errors.email}</p>}
          </div>

          <div className="w-full">
            <p>Password</p>
            <input className="border border-zinc-300 rounded w-full p-2 mt-1" type="password" onChange={(e) => setPassword(e.target.value)} value={password} />
            {errors.password && <p className="text-red-500">{errors.password}</p>}
          </div>

          <button type="submit" className="bg-primary text-white w-full py-2 rounded-md text-base">
            {state === 'Sign Up' ? 'Create Account' : 'Login'}
          </button>

          {state === 'Sign Up' ? (
            <p>
              Already have an account?{' '}
              <span onClick={() => setState('Login')} className="text-primary cursor-pointer underline">
                Login here
              </span>
            </p>
          ) : (
            <>
              <p>
                Create a new account?{' '}
                <span onClick={() => setState('Sign Up')} className="text-primary cursor-pointer underline">
                  Click here
                </span>
              </p>
              {state === 'Login' && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-primary underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default Login; 