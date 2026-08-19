import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { assets } from '@/assets/assets';

const Footer: React.FC = () => {
  const { orgId } = useParams();
  const base = orgId ? `/org/${orgId}` : '';

  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-800 mt-12">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14 grid gap-8 md:gap-10 grid-cols-1 md:grid-cols-[3fr_1fr_1fr] text-sm">
        {/* Left Section */}
        <div className="border-b md:border-b-0 md:border-r border-slate-200 pr-0 md:pr-8 pb-6 md:pb-0 flex flex-col items-center md:items-start">
          <img
            src={assets.mitaoe_booking}
            alt="MITAOE Booking — Campus Resource Management Portal"
            className="w-40 sm:w-56 md:w-64 mb-4 mt-2 max-w-full h-auto object-contain drop-shadow-xs"
            loading="lazy"
            width="256"
            height="80"
          />
          <p className="text-slate-600 leading-relaxed max-w-sm text-center md:text-left">
            The MITAOE Booking Portal is designed to simplify and digitize the reservation and management of campus facilities—including halls, guest rooms, and vehicles for academic, residential, and institutional needs.
          </p>
        </div>

        {/* Middle Section */}
        <nav aria-label="Footer navigation" className="border-b md:border-b-0 md:border-r border-slate-200 pr-0 md:pr-8 pb-6 md:pb-0">
          <p className="text-lg font-bold text-slate-900 mb-4">MITAOE</p>
          <ul className="flex flex-col gap-2.5 text-slate-600 font-medium">
            <li>
              <Link to={`${base}`} className="hover:underline hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to={`${base}/facilities`} className="hover:underline hover:text-primary transition-colors">
                Facilities
              </Link>
            </li>
            <li>
              <Link to={`${base}/about`} className="hover:underline hover:text-primary transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link to={`${base}/contact`} className="hover:underline hover:text-primary transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right Section */}
        <div>
          <p className="text-lg font-bold text-slate-900 mb-4">Get in Touch</p>
          <address className="not-italic flex flex-col gap-2.5 text-slate-600 font-medium">
            <span>MIT Academy of Engineering, Alandi Road, Pune - 412 105</span>
            <span>
              Phone: <a href="tel:+919071123436" className="hover:underline">+91-9071123436</a>
            </span>
            <span>
              Support: <a href="tel:+918793323500" className="hover:underline">+91-8793323500</a>
            </span>
            <span>
              Tel: <a href="tel:02030253500" className="hover:underline">020-30253500</a>
            </span>
          </address>
        </div>
      </div>
      <div className="text-center py-5 text-xs text-slate-500 border-t border-slate-200">
        © {new Date().getFullYear()} MIT Academy of Engineering. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
