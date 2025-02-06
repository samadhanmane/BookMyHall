import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>
        
      <div className='text-center text-2xl pt-10 text-black-500'>
        <p>About <span className='text-black-700 font-medium'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12 '>
        <img className='w-full md:max-w-[360px] shadow-md shadow-black rounded-lg' src={assets.mitaoe} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-black-600 '>
          <p>Welcome to BookMyHall, your trusted partner in managing seminar hall bookings conveniently and efficiently. At BookMyHall, we understand the challenges individuals face when it comes to scheduling venues and managing event details.</p>
          <p>BookMyHall is committed to excellence in venue management technology. We continuously strive to enhance our platform, integrating the latest advancements to improve user experience and deliver superior service. Whether you're booking your first seminar hall or managing recurring events, BookMyHall is here to support you every step of the way.</p>
          <b className='text-black-800'>Our Vision</b>
          <p>Our vision at BookMyHall is to create a seamless booking experience for every user. We aim to bridge the gap between venue providers and event organizers, making it easier for you to access the space you need, when you need it.</p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY <span className='text-black-700 font-semibold'>CHOOSE US</span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-black-600 cursor-pointer shadow-sm shadow-black'>
          <b>EFFICIENCY:</b>
          <p>Streamlined booking scheduling that fits into your busy lifestyle.</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-black-600 cursor-pointer shadow-sm shadow-black'>
        <b>CONVENIENCE:</b>
        <p>Access to a network of seminar halls in your area.</p>
        </div>

        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-black-600 cursor-pointer shadow-sm shadow-black'>
        <b>PERSONALIZATION:</b>
        <p>Tailored recommendations and reminders to help you stay on top of your event planning.</p>
        </div>

      </div>

    </div>
  )
}

export default About