import appointment_img from './appointment_img.png'
import header_img from './header_img.png'
import profile_pic from './profile_pic.png'
import contact_image from './contact_image.png'
import about_image from './about_image.png'
import logo from './logo.svg'
import dropdown_icon from './dropdown_icon.svg'
import menu_icon from './menu_icon.svg'
import cross_icon from './cross_icon.png'
import chats_icon from './chats_icon.svg'
import verified_icon from './verified_icon.svg'
import arrow_icon from './arrow_icon.svg'
import info_icon from './info_icon.svg'
import upload_icon from './upload_icon.png'
import stripe_logo from './stripe_logo.png'
import razorpay_logo from './razorpay_logo.png'
import header_hall from './header_hall.png'
import High_Capacity_img from './High_Capacity_img.jpg'
import logo_hall from './logo_hall.jpeg'
import mitaoe from './mitaoe.jpeg'
import headerlogo from './headerlogo.svg'
import hall1 from './hall1.jpeg'
import hall2 from './hall2.jpeg'
import hall3 from './hall3.jpeg'
import hall4 from './hall4.jpeg'
import mitaoe_logo from './MITAOE-logo.png'
import guestroom from './guestroom.jpg'
import vehicle from './vehicle.jpg'

export const assets = {
    appointment_img,
    header_img,
    logo,
    chats_icon,
    verified_icon,
    info_icon,
    profile_pic,
    arrow_icon,
    contact_image,
    about_image,
    menu_icon,
    cross_icon,
    dropdown_icon,
    upload_icon,
    stripe_logo,
    razorpay_logo,
    header_hall,
    High_Capacity_img,
    logo_hall,
    mitaoe,
    headerlogo,
    hall1,
    hall2,
    hall3,
    hall4,
    mitaoe_logo,
    guestroom,
    vehicle
}

export const specialityData = []

export const halls = [
    {
        _id: 'doc1',
        name: 'Hall-1',
        image: hall1,
        experience: '50 seats',
        about: 'A Small Seminar Hall is ideal for intimate sessions, workshops, or training with small groups. It typically features a projector, a whiteboard, and comfortable seating for around 20-30 people. With a capacity to accommodate 20-30 attendees, it provides a focused and interactive environment for personal or small group interactions.',
        address: {
            line1: '309,3rd floor, H-wing',
            line2: 'Mitaoe, Alandi, Pune'
        }
    },
    {
        _id: 'doc2',
        name: 'Hall-2',
        image: hall2,
        experience: '100 seats',
        about: 'A Medium-Sized Seminar Hall is well-suited for larger presentations, meetings, or educational seminars. This hall is equipped with audiovisual tools, a stage for speakers, and seating arrangements for 50-80 people. It strikes a balance between engagement and space, offering room for between 50-80 individuals, making it ideal for events that require a more expansive yet intimate setting.',
        address: {
            line1: '109,ground floor, D-wing',
            line2: 'MitAoe, Alandi, Pune'
        }
    },
    {
        _id: 'doc3',
        name: 'Hall-3',
        image: hall3,
        experience: '150 seats',
        about: 'A Large Seminar Hall is designed to host conferences, seminars, or corporate events with large audiences. It includes high-quality sound systems, multiple screens, and seating for over 100 people. With a capacity to host 100+ attendees, it provides a professional and expansive environment for significant events, ensuring comfort and visibility for all participants.',
        address: {
            line1: '101, 1st floor, Design Building',
            line2: 'MitAoe, Alandi, Pune'
        }
    },
]