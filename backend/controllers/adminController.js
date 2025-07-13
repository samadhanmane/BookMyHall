import validator from "validator"
import bcrypt from "bcrypt"
import { v2 as cloudinary } from "cloudinary"
import hallModel from "../models/hallModel.js"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
import Coordinator from '../models/coordinatorModel.js'

// API for adding halls, guest rooms, and vehicles
const addHalls = async (req, res) => {
    try {
        const { name, email, password, speciality, experience, about, address, isGuestRoom, isVehicle } = req.body;
        const imageFile = req.file;

        // Convert to booleans
        const isVehicleBool = isVehicle === 'true' || isVehicle === true;
        const isGuestRoomBool = isGuestRoom === 'true' || isGuestRoom === true;

        // For guest rooms
        if (isGuestRoomBool) {
            if (!name || !speciality || !experience || !about || !address || !email) {
                return res.json({ success: false, message: "Please fill all the fields and select a coordinator email." });
            }
            // Find coordinator by email
            const coordinator = await Coordinator.findOne({ email });
            if (!coordinator) {
                return res.json({ success: false, message: "Coordinator not found." });
            }
            // Use coordinator's password
            const hallData = {
                name,
                email,
                password: coordinator.password, // Use coordinator password
                speciality,
                experience,
                about,
                isGuestRoom: true,
                address: JSON.parse(address),
                date: Date.now(),
            };
            // Optimize image upload to Cloudinary
            let imageUrl;
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                    quality: "auto",
                    fetch_format: "auto",
                    transformation: [
                        { width: 800, crop: "limit" },
                        { quality: "auto" }
                    ]
                });
                imageUrl = imageUpload.secure_url;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.json({ success: false, message: "Failed to upload image. Please try again." });
            }
            hallData.image = imageUrl;
            // Create and save the new guest room
            const newHall = new hallModel(hallData);
            await newHall.save();
            // Clean up the temporary file
            try {
                const fs = require('fs');
                fs.unlinkSync(imageFile.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
            return res.json({
                success: true,
                message: "Guest Room added successfully",
                data: {
                    id: newHall._id,
                    name: newHall.name,
                    coordinatorEmail: coordinator.email,
                    isGuestRoom: newHall.isGuestRoom
                }
            });
        }
        // For vehicles
        else if (isVehicleBool) {
            if (!name || !speciality || !experience || !about || !email) {
                return res.json({ success: false, message: "Please fill all the fields and select a coordinator email." });
            }
            // Find coordinator by email
            const coordinator = await Coordinator.findOne({ email });
            if (!coordinator) {
                return res.json({ success: false, message: "Coordinator not found." });
            }
            let imageUrl;
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                    quality: "auto",
                    fetch_format: "auto",
                    transformation: [
                        { width: 800, crop: "limit" },
                        { quality: "auto" }
                    ]
                });
                imageUrl = imageUpload.secure_url;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.json({ success: false, message: "Failed to upload image. Please try again." });
            }
            const vehicleData = {
                name,
                email,
                image: imageUrl,
                password: coordinator.password, // Use coordinator password
                speciality,
                experience,
                about,
                isVehicle: true,
                address: {}, // No address for vehicles
                date: Date.now(),
            };
            const newVehicle = new hallModel(vehicleData);
            await newVehicle.save();
            try {
                const fs = require('fs');
                fs.unlinkSync(imageFile.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
            return res.json({
                success: true,
                message: "Vehicle added successfully",
                data: {
                    id: newVehicle._id,
                    name: newVehicle.name,
                    coordinatorEmail: coordinator.email,
                    isVehicle: newVehicle.isVehicle
                }
            });
        }
        // For halls
        else {
            if (!name || !email || !speciality || !experience || !about || !address) {
                return res.json({ success: false, message: "Please fill all the fields." });
            }
            // For halls, always require password
            if (!password || password.length < 6) {
                return res.json({ success: false, message: "Please enter a strong password" });
            }
            // Validating email format 
            if (!validator.isEmail(email)) {
                return res.json({ success: false, message: "Please enter a valid email" });
            }
            // Check if email already exists for halls
            const existingHall = await hallModel.findOne({ email, isGuestRoom: false });
            if (existingHall) {
                return res.json({ success: false, message: "This email is already registered for a hall" });
            }
            // Hashing password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt)
            // Optimize image upload to Cloudinary
            let imageUrl;
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                    quality: "auto",
                    fetch_format: "auto",
                    transformation: [
                        { width: 800, crop: "limit" },
                        { quality: "auto" }
                    ]
                });
                imageUrl = imageUpload.secure_url;
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return res.json({ success: false, message: "Failed to upload image. Please try again." });
            }
            const hallData = {
                name,
                email,
                image: imageUrl,
                password: hashedPassword,
                speciality,
                experience,
                about,
                isGuestRoom: false,
                isVehicle: false,
                address: JSON.parse(address),
                date: Date.now()
            };
            const newHall = new hallModel(hallData);
            await newHall.save();
            try {
                const fs = require('fs');
                fs.unlinkSync(imageFile.path);
            } catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
            return res.json({
                success: true,
                message: "Hall added successfully",
                data: {
                    id: newHall._id,
                    name: newHall.name,
                    email: newHall.email,
                    isGuestRoom: newHall.isGuestRoom,
                    isVehicle: newHall.isVehicle
                }
            });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API for the admin login
const loginAdmin = async (req, res) => {
    try {

        const { email, password } = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid email or password" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all halls, guest rooms, and vehicles list for admin panel
const allHalls = async (req, res) => {
    try {
        const halls = await hallModel.find({}).select('-password');
        // Separate halls, guest rooms, and vehicles
        const hallsList = halls.filter(hall => !hall.isGuestRoom && !hall.isVehicle);
        const guestRoomsList = halls.filter(hall => hall.isGuestRoom);
        const vehiclesList = halls.filter(hall => hall.isVehicle);
        // Group guest rooms and vehicles by coordinator email
        const guestRoomsByEmail = guestRoomsList.reduce((acc, room) => {
            const email = room.email || 'unassigned';
            if (!acc[email]) {
                acc[email] = [];
            }
            acc[email].push(room);
            return acc;
        }, {});
        const vehiclesByEmail = vehiclesList.reduce((acc, vehicle) => {
            const email = vehicle.email || 'unassigned';
            if (!acc[email]) {
                acc[email] = [];
            }
            acc[email].push(vehicle);
            return acc;
        }, {});
        res.json({
            success: true,
            halls: hallsList,
            guestRooms: guestRoomsByEmail,
            vehicles: vehiclesByEmail
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Api to get all appointments list

const appointmentsAdmin = async (req, res) => {
    try {
        const { role, email } = req.user || {};
        let appointments = [];
        if (role === 'admin') {
            appointments = await appointmentModel.find({}).lean();
        } else if (role === 'coordinator') {
            // Only show appointments for facilities managed by this coordinator
            const facilities = await hallModel.find({ email: email });
            const facilityIds = facilities.map(f => f._id);
            appointments = await appointmentModel.find({ hallId: { $in: facilityIds } }).lean();
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const hallIds = appointments.map(a => a.hallId).filter(Boolean);
        const userIds = appointments.map(a => a.userId).filter(Boolean);
        const halls = await hallModel.find({ _id: { $in: hallIds } }).lean();
        const users = await userModel.find({ _id: { $in: userIds } }).lean();
        const hallMap = {};
        halls.forEach(h => { hallMap[h._id.toString()] = h; });
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });
        const appointmentsWithFacilityAndUser = appointments.map(a => ({
            ...a,
            facilityData: hallMap[a.hallId?.toString()] || null,
            userData: userMap[a.userId?.toString()] || null,
            facilityName: hallMap[a.hallId?.toString()]?.name || ''
        }));
        res.json({ success: true, appointments: appointmentsWithFacilityAndUser });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// A[pi for appointment cancellation

const AppointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // Find the appointment to delete
        const appointmentData = await appointmentModel.findById(appointmentId);


        // Update the hall's slots_booked
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        const { hallId, slotDate, slotTime } = appointmentData;
        const hallData = await hallModel.findById(hallId);
        let slots_booked = hallData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        await hallModel.findByIdAndUpdate(hallId, { slots_booked });

        res.json({ success: true, message: 'Appointment Cancelled' })

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
const adminDashboard = async (req, res) => {
    try {
        const { role, email } = req.user || {};
        let halls = [];
        let appointments = [];
        let users = [];
        if (role === 'admin') {
            halls = await hallModel.find({});
            users = await userModel.find({});
            appointments = await appointmentModel.find({}).lean();
        } else if (role === 'coordinator') {
            halls = await hallModel.find({ email: email });
            users = await userModel.find({});
            const facilityIds = halls.map(h => h._id);
            appointments = await appointmentModel.find({ hallId: { $in: facilityIds } }).lean();
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        const hallIds = appointments.map(a => a.hallId).filter(Boolean);
        const hallsMap = {};
        (await hallModel.find({ _id: { $in: hallIds } }).lean()).forEach(h => { hallsMap[h._id.toString()] = h; });
        const latestAppointments = appointments.reverse().slice(0, 5).map(a => ({
            ...a,
            hallData: hallsMap[a.hallId?.toString()] || null,
            facilityName: hallsMap[a.hallId?.toString()]?.name || ''
        }));
        const dashData = {
            halls: halls.length,
            appointments: appointments.length,
            users: users.length,
            latestAppointments
        }
        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all guest rooms for a coordinator
const getCoordinatorGuestRooms = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Find all guest rooms for this email using find() instead of findOne()
        const guestRooms = await hallModel.find({
            email: email,
            isGuestRoom: true
        }).select('-password'); // Exclude password from response

        // Return success even if no rooms found, just with empty array
        res.json({
            success: true,
            message: guestRooms.length > 0 ? "Guest rooms fetched successfully" : "No guest rooms found for this coordinator",
            data: {
                email: email,
                guestRooms: guestRooms || []
            }
        });

    } catch (error) {
        console.error('Error in getCoordinatorGuestRooms:', error);
        res.json({
            success: false,
            message: error.message || "Failed to fetch guest rooms",
            error: error.stack
        });
    }
}

// API to get all vehicles for a coordinator
const getCoordinatorVehicles = async (req, res) => {
    try {
        const { email } = req.body;
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        const vehicles = await hallModel.find({
            email: email,
            isVehicle: true
        }).select('-password');
        res.json({
            success: true,
            message: vehicles.length > 0 ? "Vehicles fetched successfully" : "No vehicles found for this coordinator",
            data: {
                email: email,
                vehicles: vehicles || []
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: error.message || "Failed to fetch vehicles"
        });
    }
}

// Function to get all halls and guest rooms for main admin
const getAllHallsAndRooms = async (req, res) => {
    try {
        // Get all halls and guest rooms
        const halls = await hallModel.find({}).select('-password');

        // Get all active appointments
        const appointments = await appointmentModel.find({
            cancelled: false,
            isCompleted: false
        });

        // Create a map of hall bookings
        const hallBookings = {};
        appointments.forEach(appointment => {
            if (!hallBookings[appointment.hallId]) {
                hallBookings[appointment.hallId] = [];
            }
            hallBookings[appointment.hallId].push({
                slotDate: appointment.slotDate,
                slotTime: appointment.slotTime,
                userData: appointment.userData,
                isAccepted: appointment.isAccepted,
                isCompleted: appointment.isCompleted,
                cancelled: appointment.cancelled
            });
        });

        // Add bookings to each hall
        const hallsWithBookings = halls.map(hall => {
            const hallObj = hall.toObject();
            hallObj.bookings = hallBookings[hall._id] || [];
            return hallObj;
        });

        res.json({ success: true, halls: hallsWithBookings });
    } catch (error) {
        console.error('Error in getAllHallsAndRooms:', error);
        res.json({ success: false, message: error.message });
    }
};

// Function to delete a hall or guest room
const deleteHallOrRoom = async (req, res) => {
    try {
        const { hallId } = req.body;

        // Find the hall/room
        const hall = await hallModel.findById(hallId);
        if (!hall) {
            return res.json({ success: false, message: 'Hall/Room not found' });
        }

        // Get all active appointments for this hall
        const activeAppointments = await appointmentModel.find({
            hallId,
            cancelled: false,
            isCompleted: false
        });

        // If there are active appointments, send cancellation emails
        if (activeAppointments.length > 0) {
            for (const appointment of activeAppointments) {
                // Send cancellation emails
                await sendEmail({
                    to: appointment.userData.email,
                    subject: "Booking Cancelled - BookMyHall",
                    html: getBookingCancellationTemplate(
                        appointment.userData,
                        hall,
                        appointment.slotDate,
                        appointment.slotTime
                    )
                });

                // Update appointment status
                await appointmentModel.findByIdAndUpdate(appointment._id, {
                    cancelled: true,
                    isAccepted: false
                });
            }
        }

        // Delete all appointments for this hall
        await appointmentModel.deleteMany({ hallId });

        // Delete the hall
        await hallModel.findByIdAndDelete(hallId);

        res.json({
            success: true,
            message: `${hall.isGuestRoom ? 'Guest Room' : 'Hall'} deleted successfully. All associated appointments have been cancelled.`
        });
    } catch (error) {
        console.error('Error in deleteHallOrRoom:', error);
        res.json({ success: false, message: error.message });
    }
};

// Add a new coordinator
const addCoordinator = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Please provide name, email, and password.' });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email.' });
        }
        if (password.length < 6) {
            return res.json({ success: false, message: 'Password must be at least 6 characters.' });
        }
        const existing = await Coordinator.findOne({ email });
        if (existing) {
            return res.json({ success: false, message: 'Coordinator with this email already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const coordinator = new Coordinator({ name, email, password: hashedPassword });
        await coordinator.save();
        res.json({ success: true, message: 'Coordinator added successfully.', coordinator });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// List all coordinators
const listCoordinators = async (req, res) => {
    try {
        const coordinators = await Coordinator.find({}, '-password');
        res.json({ success: true, coordinators });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete a coordinator
const deleteCoordinator = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.json({ success: false, message: 'Email required.' });
        const deleted = await Coordinator.findOneAndDelete({ email });
        if (!deleted) return res.json({ success: false, message: 'Coordinator not found.' });
        res.json({ success: true, message: 'Coordinator deleted.' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { addHalls, loginAdmin, allHalls, appointmentsAdmin, AppointmentCancel, adminDashboard, AppointmentComplete, requestAcceptance, getCoordinatorGuestRooms, getCoordinatorVehicles, getAllHallsAndRooms, deleteHallOrRoom, addCoordinator, listCoordinators, deleteCoordinator }
