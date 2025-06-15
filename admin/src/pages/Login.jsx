import React, { useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../context/AdminContext'
import { HallContext } from '../context/HallContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {
    const [state, setState] = useState('Admin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [forgotPassword, setForgotPassword] = useState(false)
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { setAToken, backendUrl } = useContext(AdminContext)
    const { setDToken, dToken } = useContext(HallContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (dToken) navigate('/')
    }, [dToken, navigate])

    const validateForm = () => {
        const errors = {}
        if (!email) errors.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email address'
        if (!password) errors.password = 'Password is required'
        else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
        setErrors(errors)
        return Object.keys(errors).length === 0
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        if (forgotPassword || !validateForm()) return
        setLoading(true)
        try {
            const url = `${backendUrl}/api/${state === 'Admin' ? 'admin' : 'hall'}/login`
            console.log('Login URL:', url);
            const { data } = await axios.post(url, { email, password })
            console.log('Login response:', data);
            if (data.success) {
                const tokenKey = state === 'Admin' ? 'aToken' : 'dToken';
                console.log('Storing token with key:', tokenKey);
                localStorage.setItem(tokenKey, data.token)
                state === 'Admin' ? setAToken(data.token) : setDToken(data.token)
                console.log('Token stored in localStorage:', localStorage.getItem(tokenKey));
            } else toast.error(data.message)
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) return toast.error('Enter your email first')
        setIsLoading(true)
        try {
            const { data } = await axios.post(`${backendUrl}/api/hall/forgot-password`, { 
                email,
                type: 'hall'
            })
            data.success ? (toast.success('OTP sent'), setForgotPassword(true)) : toast.error(data.message)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error sending OTP')
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!otp || !newPassword) return toast.error('Fill all fields')
        try {
            const { data } = await axios.post(`${backendUrl}/api/hall/reset-password`, { 
                email, 
                otp, 
                newPassword,
                type: 'hall'
            })
            if (data.success) {
                toast.success('Password reset successfully')
                setForgotPassword(false)
                setOtp('')
                setNewPassword('')
                setState('Login')
            } else toast.error(data.message)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white font-poppins px-4">
            <div className="w-full max-w-md border border-zinc-200 shadow-md rounded-xl p-6">
                {forgotPassword ? (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4 text-sm text-blackText">
                        <h2 className="text-2xl font-semibold text-blackText">Reset Password</h2>
                        <div>
                            <label className="block mb-1">Enter OTP</label>
                            <input
                                type="text"
                                placeholder="OTP"
                                className="w-full border border-zinc-300 rounded px-3 py-2"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block mb-1">New Password</label>
                            <input
                                type="password"
                                placeholder="New Password"
                                className="w-full border border-zinc-300 rounded px-3 py-2"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-primary text-white py-2 rounded-md">
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button
                            type="button"
                            className="text-primary underline text-sm"
                            onClick={() => setForgotPassword(false)}
                        >
                            Back to Login
                        </button>
                    </form>
                ) : (
                    <form onSubmit={onSubmitHandler} className="flex flex-col gap-4 text-sm text-blackText">
                        <h2 className="text-3xl font-semibold text-center">
                            <span className="text-primary">{state}</span> Login
                        </h2>
                        <div>
                            <label className="block mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border border-zinc-300 rounded px-3 py-2"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full border border-zinc-300 rounded px-3 py-2"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>
                        <button type="submit" className="bg-primary text-white py-2 rounded-md">
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <div className="flex justify-between items-center text-sm">
                            {state === 'Admin' ? (
                                <span>
                                    Co-ordinator?{' '}
                                    <button type="button" className="text-primary underline" onClick={() => setState('Co-ordinator')}>
                                        Click here
                                    </button>
                                </span>
                            ) : (
                                <span>
                                    Admin?{' '}
                                    <button type="button" className="text-primary underline" onClick={() => setState('Admin')}>
                                        Click here
                                    </button>
                                </span>
                            )}
                            {state !== 'Admin' && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-primary underline"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Sending OTP...' : 'Forgot Password?'}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Login
