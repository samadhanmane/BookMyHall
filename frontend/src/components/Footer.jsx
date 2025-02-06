import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
            {/*----------left side------------- */}
            <div>
                <img className='mb-5 w-40' src={assets.headerlogo} alt="" />
                <p className='w-full md:w-2/3 text-black-600 leading-6'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quia molestias non aliquam eum corrupti et? Maiores, error placeat veniam modi voluptas cumque iusto, consequatur laboriosam est esse quasi? Aspernatur, tempore.</p>
            </div>
            {/*----------center side------------- */}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2  text-black-600'>
                    <li>Home</li>
                    <li>About us</li>
                    <li>Contact us</li>
                    <li>Privacy Policy</li>
                </ul>
            </div>
            {/*----------right side------------- */}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2  text-black-600'>
                    <li>+91-8010427685</li>
                    <li>samadhanmane2324@gmail.com</li>
                </ul>
            </div>
        </div>
        <div>
            {/*---------Copyright Text--------- */}
            <p className='py-5 text-sm text-center'>Copyright 2024 @ Samadhan Mane - All Right Reserved.</p>
        </div>
    </div>
  )
}

export default Footer