import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Calendar from "react-calendar"; // Import the calendar component
import "react-calendar/dist/Calendar.css"; // Calendar CSS
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedHalls from "../components/RelatedHalls";
import axios from "axios";
import { toast } from "react-toastify";


const Appointment = () => {
  
  const { hallId } = useParams();
  const { halls, getHallsData,  backendUrl, token } = useContext(AppContext);
 
  const [HallInfo, setHallInfo] = useState(null);
  const [HallSlots, setHallSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slotTime, setSlotTime] = useState("");
  const [isBooking, setIsBooking] = useState(false); // Add loading state
  
  const navigate = useNavigate();

  const fetchHallInfo = () => {
    const HallInfo = halls.find((hall) => hall._id === hallId);
    setHallInfo(HallInfo);
  };


  


  const getAvailableSlots = () => {
    if (!HallInfo) return;

    const today = new Date();
    const selectedDay = new Date(selectedDate);
    const bookedSlots = HallInfo.slots_booked || {};
    const isToday = selectedDay.toDateString() === today.toDateString();

    // Format the selected date to match the bookedSlots format (YYYY-M-D)
    const formattedDate = `${selectedDay.getFullYear()}-${selectedDay.getMonth() + 1}-${selectedDay.getDate()}`;

    const timeSlots = [
      { time: "10:00AM - 01:00PM", datetime: new Date(selectedDay.setHours(10, 0)) },
      { time: "02:00PM - 05:00PM", datetime: new Date(selectedDay.setHours(14, 0)) },
      { time: "Full Day (10:00AM - 05:00PM)", datetime: new Date(selectedDay.setHours(10, 0)) },
    ];

    // Filter out past slots for today and slots already booked by the user
    const availableSlots = timeSlots.filter((slot) => {
      const isBooked = bookedSlots[formattedDate]?.includes(slot.time);
      const isPast = isToday && slot.datetime < today;
      
      // If full day is booked, no other slots should be available
      if (bookedSlots[formattedDate]?.includes("Full Day (10:00AM - 05:00PM)")) {
        return false;
      }
      
      // If any other slot is booked, full day should not be available
      if (slot.time === "Full Day (10:00AM - 05:00PM)" && 
          (bookedSlots[formattedDate]?.includes("10:00AM - 01:00PM") || 
           bookedSlots[formattedDate]?.includes("02:00PM - 05:00PM"))) {
        return false;
      }

      // Check if the user has already booked this slot
      const userBookedSlots = HallInfo.user_booked_slots || {};
      const isUserBooked = userBookedSlots[formattedDate]?.includes(slot.time);

      return !isBooked && !isPast && !isUserBooked;
    });

    setHallSlots(availableSlots);
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    try {
      setIsBooking(true); // Start loading
      const date = selectedDate;

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      const slotDate = `${year}-${month}-${day}`;

      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { hallId, slotDate, slotTime },
        { headers: { token } }
      );

      if (data.success) {
        toast.success("Appointment booked successfully");
        getHallsData();
        navigate("/my-appointments");
      } else {
        toast.error(data.message || "Failed to book appointment");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsBooking(false); // End loading
    }
  };

  useEffect(() => {
    fetchHallInfo();
  }, [halls, hallId]);

  useEffect(() => {
    getAvailableSlots();
  }, [HallInfo, selectedDate]);

  return (
    HallInfo && (
      <div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg shadow-2xl shadow-black"
              src={HallInfo.image}
              alt=""
            />
          </div>

          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0 shadow-2xl shadow-black">
            <p className="flex items-center gap-2 text-2xl font-medium text-black-900 ">
              {HallInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-black-600">
              <p> {HallInfo.speciality}</p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {HallInfo.experience}
              </button>
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-black-900 mt-3">
                About <img src={assets.info_icon} alt="" />
              </p>
              <p className="text-sm text-black-500 max-w-[700px] mt-1 ">
                {HallInfo.about}
              </p>
            </div>
          </div>
        </div>
        <br />

        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-black-700 ">
          <p className="px-1 text-2xl">Booking Slots</p>
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileDisabled={({ date }) =>
              date < new Date(new Date().setDate(new Date().getDate() - 1))
            }
            tileClassName={({ date, view }) => {
              if (view !== 'month') return '';
              if (!HallInfo || !HallInfo.slots_booked) return '';

              const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
              const bookedSlots = HallInfo.slots_booked[formattedDate];
              const isSelected = date.toDateString() === selectedDate.toDateString();

              let className = '';
              
              if (isSelected) {
                className += ' selected-date';
              }

              // Check if full day is booked or both slots are booked
              if (bookedSlots?.includes("Full Day (10:00AM - 05:00PM)") || 
                  (bookedSlots?.includes("10:00AM - 01:00PM") && 
                   bookedSlots?.includes("02:00PM - 05:00PM"))) {
                className += ' fully-booked';
              } else if (bookedSlots?.length === 1) {
                className += ' partially-booked';
              }

              return className;
            }}
            tileContent={({ date }) => {
              if (!HallInfo) return null;
          
              const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
              const bookedSlots = HallInfo.slots_booked || {};
              const bookings = HallInfo.bookings || [];
          
              

              // Check if there are any slots booked for this date
              const slotsForDate = bookedSlots[formattedDate];
              if (slotsForDate && slotsForDate.length > 0) {
                return (
                  <div className="relative group">
                    <span className="w-2 h-2 bg-red-600 block rounded-full mx-auto"></span>
          
                    {/* Tooltip - Centered on Screen */}
                    <div className="fixed left-1/2 top-1/3 transform -translate-x-1/2 z-[9999] hidden group-hover:flex flex-col bg-white text-black p-4 rounded shadow-lg text-sm w-80 border border-gray-400 pointer-events-none">
                      <p className="font-semibold text-lg text-center mb-2">📅 {formattedDate}</p>
                      <div className="space-y-3">
                        {slotsForDate.map((slotTime, index) => {
                          // Find the booking for this slot
                          const booking = bookings.find(b => 
                            b.slotDate === formattedDate && 
                            b.slotTime === slotTime &&
                            !b.cancelled &&
                            !b.isCompleted
                          );

                          return (
                            <div key={index} className="border-b pb-2 last:border-b-0">
                              <p className="font-medium text-center mb-1">
                                🕒 <strong>{slotTime}</strong>
                              </p>
                              {booking && booking.userData ? (
                                <div className="text-sm">
                                  <p className="flex items-center gap-2">
                                    <span className="font-medium">👤 Name:</span>
                                    {booking.userData.name}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-medium">📱 Phone:</span>
                                    {booking.userData.phone}
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-medium">📧 Email:</span>
                                    {booking.userData.email}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-center text-gray-600">
                                  Slot is booked
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <style>
            {`
              .react-calendar__tile.selected-date {
                background: #006edc !important;
                color: white !important;
              }
              .react-calendar__tile.fully-booked {
                background: #ff6b6b !important;
                color: white !important;
              }
              .react-calendar__tile.partially-booked {
                background: #fff3cd !important;
              }
              .react-calendar__tile.selected-date.fully-booked {
                background: #ff0000 !important;
                color: white !important;
              }
              .react-calendar__tile.selected-date.partially-booked {
                background: #ffc107 !important;
                color: white !important;
              }
            `}
          </style>

          <div className="flex gap-4 mt-4">
            {/* Fully Booked */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-600 block rounded"></span>
              <p className="text-sm font-medium text-gray-700">Fully booked</p>
            </div>

            {/* Partially Booked */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-400 block rounded"></span>
              <p className="text-sm font-medium text-gray-700">Partially booked</p>
            </div>

            {/* Weekends */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-300 block rounded"></span>
              <p className="text-sm font-medium text-gray-700">Not available</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4 py-2 px-1">
            {HallSlots.map((item, index) => (
              <p
                onClick={() =>
                  setSlotTime(slotTime === item.time ? "" : item.time)
                }
                className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer shadow-md shadow-black ${item.time === slotTime
                  ? "bg-primary text-white"
                  : "text-black-400 border border-gray-300"
                  }`}
                key={index}
              >
                {item.time.toLowerCase()}
              </p>
            ))}
          </div>
          <button
            onClick={bookAppointment}
            disabled={!slotTime || isBooking}
            className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 shadow-lg shadow-black disabled:bg-gray-400"
          >
            {isBooking ? "Booking..." : "Book an Appointment"}
          </button>
        </div>

        <RelatedHalls HallId={hallId} speciality={HallInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
