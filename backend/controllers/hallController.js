import hallModel from "../models/hallModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"




const changeAvailability = async (req,res) =>{
    try{

        const {hallId} = req.body

        const hallData = await hallModel.findById(hallId)
        await hallModel.findByIdAndUpdate(hallId,{available:!hallData.available})
        res.json({success:true,message:"Availability changed successfully"})


    }catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

const hallList = async (req,res) =>{

    try{
        const halls = await hallModel.find({}).select(['-password','-email'])
        res.json({success:true,halls})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const loginHall = async (req,res) => {
    try{
        const {email,password} = req.body

        const hall = await hallModel.findOne({email})
        if(!hall){
            return res.json({success:false,message:"Invalid email or password"})
        }
        const isMatch = await bcrypt.compare(password,hall.password)
        
        if(isMatch){
           const token = jwt.sign({id:hall._id},process.env.JWT_SECRET)
           res.json({success:true,message:"Login successful",token})
        }else{
            return res.json({success:false,message:"Invalid email or password"})
        }
    }
       
    catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// Api to get hall appointments for doctor panel
const appointmentsHall = async (req,res) =>{    
    try{

        const {hallId} = req.body
        const appointments = await appointmentModel.find({hallId})
        res.json({success:true,appointments})

    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Api to update appointment status to completed
const appointmentComplete = async (req,res) =>{
    try{
        const {hallId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if(appointmentData && appointmentData.hallId === hallId){
            await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true})
            res.json({success:true,message:"Appointment completed successfully"})
        }else{
            res.json({success:false,message:"Appointment not found"})
        }
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Api to update appointment status to cancel
const appointmentCancel = async (req,res) =>{
    try{
        const {hallId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
       
        if(appointmentData && appointmentData.hallId === hallId){
            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
            res.json({success:true,message:"Appointment cancelled successfully"})
        }else{
            res.json({success:false,message:"Appointment not found"})
        }
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Api to accept request
const appointmentRequest = async (req, res) => {
    try {
        const { hallId, appointmentId } = req.body;
        

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.hallId === hallId) {
            // Check if the appointment is already accepted
            if (appointmentData.isAccepted) {
                return res.json({
                    success: false,
                    message: "This time slot has already been booked and cannot be accepted again."
                });
            }

            // Update the appointment to accepted
            await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true });
            console.log("Appointment accepted successfully");
            res.json({ success: true, message: "Appointment accepted successfully" });
        } else {
            console.log("Appointment not found or hall ID mismatch");
            res.json({ success: false, message: "Appointment not found" });
        }
    } catch (error) {
        console.log("Error in appointmentRequest:", error);
        res.json({ success: false, message: error.message });
    }
}

// Api to get dashboard data for doctor panel
const hallDashboard = async (req,res) => {
    try{
        const{hallId} = req.body
        const appointments = await appointmentModel.find({hallId})

        let users = []

        appointments.map((item) => {
            if(!users.includes(item.userId)){
                users.push(item.userId)
            }
        })

        const dashData = {
            appointments: appointments.length,
            users: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

        res.json({success:true,dashData})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to get hall profile for hall panel

const hallProfile = async (req,res) => {
    try{
        const {hallId} = req.body
        const profileData = await hallModel.findById(hallId).select(['-password'])
        res.json({success:true,profileData})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to update hall profile data from hall panel

const updateHallProfile = async (req,res) => {
    try{
        const {hallId,address,available} = req.body
        await hallModel.findByIdAndUpdate(hallId,{address,available})
        res.json({success:true,message:"Profile updated successfully"})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to check if a time slot is available
const checkSlotAvailability = async (req, res) => {
    try {
        const { hallId, date, time } = req.body;
        console.log("Checking availability for:", { hallId, date, time });

        // Check if there's any existing non-cancelled appointment for this slot
        const existingAppointment = await appointmentModel.findOne({
            hallId,
            date,
            time,
            cancelled: false // Ensure we only check for non-cancelled appointments
        });

        console.log("Existing appointment found:", existingAppointment);

        if (existingAppointment) {
            console.log("Slot is not available");
            return res.json({
                success: false,
                available: false,
                message: "This time slot is already booked",
                debug: {
                    appointmentId: existingAppointment._id,
                    status: {
                        cancelled: existingAppointment.cancelled,
                        completed: existingAppointment.isCompleted,
                        accepted: existingAppointment.isAccepted
                    }
                }
            });
        }

        console.log("Slot is available");
        res.json({
            success: true,
            available: true,
            message: "Time slot is available"
        });

    } catch (error) {
        console.log("Error in checkSlotAvailability:", error);
        res.json({ success: false, message: error.message });
    }
}

// API to cancel an appointment
const cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        console.log("Cancelling appointment:", appointmentId);

        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Update the appointment to cancelled
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, isAccepted: false });
        console.log("Appointment cancelled successfully");
        res.json({ success: true, message: "Appointment cancelled successfully" });
    } catch (error) {
        console.log("Error in cancelAppointment:", error);
        res.json({ success: false, message: error.message });
    }
}

export {changeAvailability,
    hallList,
    loginHall,
    appointmentsHall,
    appointmentComplete,
    appointmentCancel,
    hallDashboard,
    hallProfile,
    updateHallProfile,
    appointmentRequest,
    checkSlotAvailability,
    cancelAppointment
}