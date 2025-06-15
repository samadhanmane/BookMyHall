import { createContext,useState } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const AdminContext = createContext()

const AdminContextProvider = (props) => {
    
const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')

    const [halls,setHalls] = useState([])
    const [guestRooms, setGuestRooms] = useState({})
    const [appointments, setAppointments] = useState([])
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [dashData,setDashData] = useState(false)

    const getAllHalls = async () =>{
        try{
            const {data} = await axios.post(backendUrl + '/api/admin/all-halls',{},{headers:{aToken}})
            if(data.success){
                setHalls(data.halls)
                setGuestRooms(data.guestRooms)
                console.log('Halls:', data.halls)
                console.log('Guest Rooms:', data.guestRooms)
            }else{
                toast.error(data.message)
            }

        }catch(error){
            toast.error(error.message)

        }
    }

    const changeAvailability = async(hallId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/admin/change-availability',{hallId},{headers:{aToken}})
            if(data.success){
                toast.success(data.message)
                getAllHalls()
            }else{
                toast.error(data.message)
            }
        } catch(error){
            toast.error(error.message)
          
        }
       }

       const getAllAppointments = async ()=>{
        try{
            const {data} = await axios.get(backendUrl+'/api/admin/appointments',{headers:{aToken}})
            if (data.success){
                setAppointments(data.appointments)
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
       }

       const completeAppointment = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/admin/complete-appointment',{appointmentId},{headers:{aToken}})
            if(data.success){
                toast.success(data.message)
                getAllAppointments()
            }else{
                toast.error(data.message)
            }
        }catch(error){
            console.log(error)
        }
    }

       const cancelAppointment = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/admin/appointment-cancel',{appointmentId},{headers:{aToken}})
            if(data.success){
                toast.success(data.message)
                getAllAppointments()
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
       }

       const requestAcceptance = async (appointmentId) => {
        try{
            const {data} = await axios.post(backendUrl + '/api/admin/request-acceptance',{appointmentId},{headers:{aToken}})
            if(data.success){
                toast.success(data.message)
                getAllAppointments()
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
       }
       

        const getDashData = async () => {
    
            try{
                const {data} = await axios.get(backendUrl + '/api/admin/dashboard', {headers:{aToken}})
            if(data.success){
                setDashData(data.dashData)
                console.log(data.dashData)
            }else{
                toast.error(data.message)
            }
        }catch(error){
            toast.error(error.message)
        }
       }    

       const deleteHallOrRoom = async (hallId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/admin/delete-hall-or-room',
                { hallId },
                { headers: { aToken } }
            );
            if (data.success) {
                toast.success(data.message);
                getAllHalls(); // Refresh the list after deletion
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const value = {
        backendUrl,halls,
        guestRooms,
        getAllHalls,changeAvailability,
        appointments,setAppointments,
        getAllAppointments,cancelAppointment,
        dashData,getDashData,setAToken,aToken,
        completeAppointment,requestAcceptance,
        deleteHallOrRoom
    }
    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
} 
export default AdminContextProvider