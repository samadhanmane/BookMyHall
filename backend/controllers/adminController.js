import validator from "validator"
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"
import hallModel from "../models/hallModel.js"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"

// API for adding halls
const addHalls = async (req, res) => {
    try {
        const { name, email, password, speciality, experience, about, address } = req.body;
        const imageFile = req.file;
       

        // Checking for all data to add halls
        if (!name || !email || !password || !speciality || !experience || !about || !address) {
            return res.json({ success: false, message: "Please fill all the fields." });
        }

        // Validating email format 
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Validating strong password
        if (password.length < 6) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        // Hashing hall's password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

      
        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url
           

        const hallData = {
            name,
            email,
            image: imageUrl, 
            password: hashedPassword,
            speciality,
            experience,
            about,
            
            address: JSON.parse(address),
            date: Date.now()
        };

        const newHall = new hallModel(hallData);
        await newHall.save();

        res.json({ success: true, message: "Hall added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for the admin login
const loginAdmin = async (req,res) =>{
    try{

        const{email,password} = req.body
        
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign(email+password,process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
            res.json({success:false,message:"Invalid email or password"})
        }
     } catch (error){
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// api to get all halls list for admin pannel

const allHalls = async (req, res) => {

    try{

        const halls = await hallModel.find({}).select('-password')
        res.json({ success: true, halls })

    }catch(error){
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// Api to get all appointments list

const appointmentsAdmin = async (req,res) => {

    try{
        const appointments = await appointmentModel.find({})
        res.json({success:true,appointments})

    }catch(error){
        console.log(error)
        res.json({ success: false, message: error.message})
    }

}

// A[pi for appointment cancellation

const AppointmentCancel = async (req, res) => {
    try {
        const {appointmentId } = req.body;

        // Find the appointment to delete
        const appointmentData = await appointmentModel.findById(appointmentId);
       

        // Update the hall's slots_booked
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
        
        const { hallId, slotDate, slotTime } = appointmentData;
        const hallData = await hallModel.findById(hallId);
        let slots_booked = hallData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });

        res.json({success:true, message:'Appointment Cancelled'})
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Api to complete appointment 
const AppointmentComplete = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Find the appointment
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Mark appointment as completed
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

        res.json({ success: true, message: 'Appointment Completed' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// API to show request acceptance of halls

const requestAcceptance = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Find the appointment
        const appointmentData = await appointmentModel.findById(appointmentId);
        if (!appointmentData) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // Mark appointment as accepted
        await appointmentModel.findByIdAndUpdate(appointmentId, { isAccepted: true });

        res.json({ success: true, message: 'Appointment Accepted' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};



// Api to get Dashboard data of admin pannel
const adminDashboard = async (req,res) => {
    try{
        const halls = await hallModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            halls: halls.length,
            appointments: appointments.length,
            users: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }
        res.json({success:true,dashData})
        
    }catch(error){
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addHalls,loginAdmin,allHalls,appointmentsAdmin,AppointmentCancel,adminDashboard,AppointmentComplete,requestAcceptance }
