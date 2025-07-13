import React, { createContext, useState } from 'react';
import axios from 'axios';

export const DirectorContext = createContext();

const DirectorContextProvider = ({ children }) => {
  const [dToken, setDToken] = useState(localStorage.getItem('directorToken') || '');
  const [director, setDirector] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const loginDirector = async (email, password) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/director/login`, { email, password });
      if (data.success && data.token) {
        setDToken(data.token);
        setDirector(data.director);
        localStorage.setItem('directorToken', data.token);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  };

  const logoutDirector = () => {
    setDToken('');
    setDirector(null);
    localStorage.removeItem('directorToken');
  };

  return (
    <DirectorContext.Provider value={{ dToken, setDToken, director, setDirector, loginDirector, logoutDirector, backendUrl }}>
      {children}
    </DirectorContext.Provider>
  );
};

export default DirectorContextProvider; 