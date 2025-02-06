import { createContext, useEffect, useState } from "react";
import axios from "axios"
import {toast} from 'react-toastify'

export const AppContext =createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '$'  
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [halls,setHalls] = useState([])
    const [token,setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):false)
    const [userData,setUserData] = useState(false)
    const [appointment, setAppointment] = useState([]);
   

    const getHallsData = async () => {

        try{
            const {data} = await axios.get(backendUrl+ '/api/hall/list')
            if (data.success){
                setHalls(data.halls)

            }else{
                toast.error(data.message)
            }
        }catch (error){
            console.log(error)
            toast.error(error.message)
        }

    }

   

    const loadUserProfileData = async () => {
        try{

            const {data} = await axios.get(backendUrl+ '/api/user/get-profile',{headers:{token}})
            if(data.success){
                setUserData(data.userData)
            }else{
                toast.error(data.message)
            }

        }catch(error){
            console.log(error)
            toast.error(error.message)
        }
    }

     // Fetch appointments
  const getAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });
      if (data.success) {
        setAppointment(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // Update a specific appointment's status
  const updateAppointmentStatus = (appointmentId, status) => {
    setAppointment((prev) =>
      prev.map((appointment) =>
        appointment._id === appointmentId ? { ...appointment, ...status } : appointment
      )
    );
  };
    
    const value = {
        halls,
        getHallsData,
        currencySymbol,
        token,
        setToken,
        backendUrl,
        userData,
        setUserData,
        loadUserProfileData,
        appointment,setAppointment,
        getAppointments,
        updateAppointmentStatus
    }

    useEffect(()=>{
        getHallsData()
    },[])

    useEffect (()=>{
        if(token){
        loadUserProfileData()
        getAppointments()
        } else{
            setUserData(false)
            setAppointment([])
        }
    },[token])

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}



export default AppContextProvider