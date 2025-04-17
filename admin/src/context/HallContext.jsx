import { createContext,useState, useEffect } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'



export const HallContext = createContext()

const HallContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken,setDToken] = useState(localStorage.getItem('dToken') ? localStorage.getItem('dToken') : '')

    const [appointments,setAppointments] = useState([])

    const [dashData,setDashData] = useState(false)

    // Initialize profileData with default values to prevent uncontrolled to controlled input warning
    const [profileData,setProfileData] = useState({
        name: '',
        email: '',
        speciality: '',
        experience: '',
        about: '',
        address: { line1: '', line2: '' },
        available: false,
        image: ''
    })

    // Add axios interceptor to log requests
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            config => {
                console.log('Request being sent:', config.url, config.headers);
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    const getAppointments = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/api/hall/appointments',{headers:{dToken}})
            if(data.success){
                setAppointments(data.appointments)
                

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
            // Get the hallId from the dToken
            const decodedToken = JSON.parse(atob(dToken.split('.')[1]));
            const hallId = decodedToken.hallId;
            
            const {data} = await axios.post(
                backendUrl + '/api/hall/appointment-complete',
                {appointmentId, hallId},
                {headers:{dToken}}
            )
            
            if(data.success){
                toast.success(data.message)
                // Immediately update the appointments list
                const updatedAppointments = appointments.map(appointment => 
                    appointment._id === appointmentId 
                        ? {...appointment, isCompleted: true}
                        : appointment
                );
                setAppointments(updatedAppointments);
                getDashboardData(); // Refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
            toast.error("Failed to complete appointment. Please try again.")
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try{
            // Get the hallId from the dToken
            const decodedToken = JSON.parse(atob(dToken.split('.')[1]));
            const hallId = decodedToken.hallId;
            
            const {data} = await axios.post(
                backendUrl + '/api/hall/appointment-cancel',
                {appointmentId, hallId},
                {headers:{dToken}}
            )
            
            if(data.success){
                toast.success(data.message)
                // Immediately update the appointments list
                const updatedAppointments = appointments.map(appointment => 
                    appointment._id === appointmentId 
                        ? {...appointment, cancelled: true, isAccepted: false}
                        : appointment
                );
                setAppointments(updatedAppointments);
                getDashboardData(); // Refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
            toast.error("Failed to cancel appointment. Please try again.")
        }
    }

    const requestAppointment = async (appointmentId) => {
        try{
            // Get the hallId from the dToken
            const decodedToken = JSON.parse(atob(dToken.split('.')[1]));
            const hallId = decodedToken.hallId;
            
            const {data} = await axios.post(
                backendUrl + '/api/hall/appointment-request',
                {appointmentId, hallId},
                {headers:{dToken}}
            )
            
            if(data.success){
                toast.success(data.message)
                // Immediately update the appointments list
                const updatedAppointments = appointments.map(appointment => 
                    appointment._id === appointmentId 
                        ? {...appointment, isAccepted: true}
                        : appointment
                );
                setAppointments(updatedAppointments);
                getDashboardData(); // Refresh dashboard data
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
            toast.error("Failed to accept appointment. Please try again.")
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
