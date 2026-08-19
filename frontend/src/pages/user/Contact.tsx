import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { assets } from '@/assets/assets';
import { useSEO } from '@/hooks/useSEO';
import { buildCanonical } from '@/config/seo';

const Contact: React.FC = () => {
  const { orgId } = useParams();

  useSEO({
    title: 'Contact Us — MITAOE Booking Portal',
    description:
      'Contact the MITAOE Campus Resource Management team at MIT Academy of Engineering, Alandi Road, Pune. Get support for facility bookings and campus resource inquiries.',
    canonical: buildCanonical(orgId ? `/org/${orgId}/contact` : '/'),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow font-poppins bg-white text-[#030303] px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full py-6">
        <div className="text-center mt-12 mb-10 text-[#123458]">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Contact <span className="text-[#123458] font-semibold">Us</span>
          </h1>
        </div>

        <div className="my-10 flex flex-col md:flex-row gap-12 md:gap-20 border border-gray-200 rounded-xl p-6 sm:p-8 shadow-md">
          <img
            className="w-full md:max-w-[360px] rounded-lg shadow-md object-cover aspect-[4/3] border border-[#123458]/10 bg-blue-50"
            src={assets.High_Capacity_img}
            alt="MITAOE campus facility — MIT Academy of Engineering, Pune"
            loading="lazy"
            width="360"
            height="270"
          />

          <div className="flex flex-col justify-center gap-6 text-base">
            <div>
              <h2 className="text-xl font-semibold text-[#123458] mb-2">Our Office</h2>
              <address className="not-italic text-[#030303]">
                Student Section, Design Building <br />
                MITAOE, Alandi, Pune 412105, Maharashtra, India
              </address>
            </div>

            <div className="text-[#030303]">
              <span className="font-semibold text-[#123458]">Tel:</span>{' '}
              <a href="tel:+919071123436" className="hover:underline">+91-9071123436</a>,{' '}
              <a href="tel:+918793323500" className="hover:underline">+91-8793323500</a>,{' '}
              <a href="tel:02030253500" className="hover:underline">020-30253500</a>
              <br />
              <span className="font-semibold text-[#123458]">Email:</span>{' '}
              <a href="mailto:admissions@mitaoe.ac.in" className="hover:underline">admissions@mitaoe.ac.in</a>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-[#123458] mb-2">Have any doubts?</h2>
              <p className="text-muted-foreground">
                Feel free to email or call our team for any assistance regarding bookings.
              </p>
            </div>

            <a
              href="mailto:admissions@mitaoe.ac.in"
              className="mt-2 w-fit px-6 py-3 bg-[#123458] text-white border border-[#123458] hover:bg-white hover:text-[#123458] transition-all duration-300 rounded-lg shadow text-base font-semibold inline-block text-center"
            >
              Contact Office
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
