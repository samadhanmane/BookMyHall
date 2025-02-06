import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {


  return (
    <div>
      <div className='text-center text-2xl pt-10 text-black-500 '>
        <p>CONTACT <span className='text-black-700 font-semibold'>US</span></p>
      </div>
        
        <div className='my-10 flex flex-col justify-center md:flex-row gap-10 mb-28 text-sm '>
          <img className='w-full md:max-w-[360px] shadow-lg rounded-lg shadow-black' src={assets.High_Capacity_img} alt="" />
          <div className='flex flex-col justify-center items-start gap-6'>
            <p className='font-semibold text-lg text-black-600'>OUR OFFICE</p>
            <p className='text-black-500'>Student section,Design Building <br /> MITAOE,Alandi,Pune 412105,Maharashtra,India</p>
            <p className='text-black-500'>Tel: +91-8010427685 <br /> Email: samadhanmane2324@gmail.com</p>
            <p className='font-semibold text-lg text-black-600'>Have any doubt?</p>
            <p className='text-black-500'>To learn more about our team</p>
            <button className='border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500 cursor-pointer shadow-md shadow-black'>
              Contact Office
            </button>
          </div>
        </div>
    </div>
  )
}

export default Contact