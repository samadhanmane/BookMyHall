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
    const [profileData,setProfileData] = useState(null)

    const [loading, setLoading] = useState(true);

    const [feedbacks, setFeedbacks] = useState([]);

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
            console.log('Fetching appointments with token:', dToken);
            const {data} = await axios.get(
                backendUrl + '/api/hall/all-appointments',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'dToken': dToken
                    }
                }
            );
            if(data.success){
                console.log('Appointments fetched:', data.appointments);
                setAppointments(data.appointments);
            }else{
                console.error('Failed to fetch appointments:', data.message);
                toast.error(data.message);
            }
        }catch(error){
            console.error('Error fetching appointments:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to fetch appointments');
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
            console.log('Requesting appointment:', appointmentId);
            const {data} = await axios.post(
                backendUrl + '/api/hall/appointment-request',
                { appointmentId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'dToken': dToken
                    }
                }
            );
            
            if(data.success){
                toast.success(data.message);
                // Immediately update the appointments list
                const updatedAppointments = appointments.map(appointment => 
                    appointment._id === appointmentId 
                        ? {...appointment, isAccepted: true}
                        : appointment
                );
                setAppointments(updatedAppointments);
                getDashboardData(); // Refresh dashboard data
            }else{
                toast.error(data.message);
            }
        }catch(error){
            console.error('Error in requestAppointment:', error);
            toast.error(error.response?.data?.message || error.message || "Failed to accept appointment. Please try again.");
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
        if (!dToken) {
            console.log('No token available');
            setProfileData(null);
            setLoading(false);
            return;
        }

        try {
            console.log('Getting profile data with token:', dToken);
            const { data } = await axios.get(
                `${backendUrl}/api/hall/profile`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'dToken': dToken
                    }
                }
            );

            console.log('Profile data response:', data);

            if (data.success && data.profileData) {
                setProfileData(data.profileData);
                console.log('Profile data set:', data.profileData);
            } else {
                console.error('No profile data in response');
                toast.error('No profile data available');
                setProfileData(null);
            }
        } catch (error) {
            console.error('Error getting profile data:', error);
            toast.error(error.response?.data?.message || error.message || 'Failed to get profile data');
            setProfileData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dToken) {
            getProfileData();
        } else {
            setProfileData(null);
            setLoading(false);
        }
    }, [dToken]);

    const getFeedbacks = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/hall/feedbacks', { headers: { dToken } });
            if (data.success) {
                setFeedbacks(data.feedbacks);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to fetch feedbacks');
        }
    };

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
        requestAppointment,
        loading,
        feedbacks,
        getFeedbacks
    }

    return (
        <HallContext.Provider value={value}>
            {props.children}
        </HallContext.Provider>
    )

} 


export default HallContextProvider
