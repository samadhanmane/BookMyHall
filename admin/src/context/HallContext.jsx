import { createContext,useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'



export const HallContext = createContext()

const HallContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken,setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const [appointments,setAppointments] = useState([])

    const [dashData,setDashData] = useState(false)

    const [profileData,setProfileData] = useState(false)

    const getAppointments = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/api/hall/appointments',{headers:{dToken}})
            if(data.success){
                setAppointments(data.appointments)
                console.log(data.appointments)

            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error);
            toast.error(error.message)
        }
    }


    const completeAppointment = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/hall/complete-appointment',{appointmentId},{headers:{dToken}})
            if(data.success){
                toast.success(data.message)
                getAppointments()
                getDashboardData() // Added to refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/hall/cancel-appointment',{appointmentId},{headers:{dToken}})
            if(data.success){
                toast.success(data.message)
                getAppointments()
                getDashboardData() // Added to refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
        }
    }

    const requestAppointment = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/hall/request-appointment',{appointmentId},{headers:{dToken}})
            if(data.success){
                toast.success(data.message)
                getAppointments()
                getDashboardData() // Added to refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
        }
    }


    const getDashboardData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/api/hall/dashboard',{headers:{dToken}})
           
            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData)
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
            toast.error(error.message)
        }
    }

    const getProfileData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/api/hall/profile',{headers:{dToken}})
            if(data.success){
                setProfileData(data.profileData)
                console.log(data.profileData)
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
            toast.error(error.message)
        }
    }

    const value = {
        backendUrl,
        dToken,
        setDToken,
        appointments,
        setAppointments,
        getAppointments,
        completeAppointment,
        cancelAppointment,
        dashData,setDashData,
        getDashboardData,
        profileData,setProfileData,
        getProfileData,
        requestAppointment
    }

    return (
        <HallContext.Provider value={value}>
            {props.children}
        </HallContext.Provider>
    )

} 


export default HallContextProvider
