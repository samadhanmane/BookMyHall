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
  const { halls, getHallsData, currencySymbol, backendUrl, token } = useContext(AppContext);
 
  const [HallInfo, setHallInfo] = useState(null);
  const [HallSlots, setHallSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slotTime, setSlotTime] = useState("");
  
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

    const timeSlots = [
      { time: "10:00AM - 01:00PM", datetime: new Date(selectedDay.setHours(10, 0)) },
      { time: "02:00PM - 05:00PM", datetime: new Date(selectedDay.setHours(14, 0)) },
    ];

    // Filter out past slots for today
    const availableSlots = timeSlots.filter((slot) => {
      const slotDate = slot.datetime.toLocaleDateString();
      const isBooked = bookedSlots[slotDate]?.includes(slot.time);
      const isPast = isToday && slot.datetime < today;
      return !isBooked && !isPast;
    });

    setHallSlots(availableSlots);
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book appointment");
      return navigate("/login");
    }

    try {
      const date = selectedDate;
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      const slotDate = `${day}-${month}-${year}`;

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
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
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
            tileClassName={({ date }) => {
              if (!HallInfo || !HallInfo.slots_booked) return "";

              const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
              const bookedSlots = HallInfo.slots_booked[formattedDate];

              if (bookedSlots?.length === 2) return " fully-booked "; // Fully booked
              if (bookedSlots?.length === 1) return " partially-booked "; // Partially booked
              return ""; // Available
            }}
          />

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
              <p className="text-sm font-medium text-gray-700">N/A</p>
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
            disabled={!slotTime}
            className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6 shadow-lg shadow-black disabled:bg-gray-400"
          >
            Book an Appointment
          </button>
        </div>

        <RelatedHalls HallId={hallId} speciality={HallInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
