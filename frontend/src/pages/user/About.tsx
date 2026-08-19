import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import { assets } from '@/assets/assets';
import { useSEO } from '@/hooks/useSEO';
import StructuredData from '@/components/seo/StructuredData';
import { buildCanonical } from '@/config/seo';

const About: React.FC = () => {
  const { orgId } = useParams();

  useSEO({
    title: 'About Us — MITAOE Booking Portal',
    description:
      'Learn about the MITAOE Campus Resource Management System, built by students of MIT Academy of Engineering to digitize campus facility bookings and institutional resource management.',
    canonical: buildCanonical(orgId ? `/org/${orgId}/about` : '/'),
  });

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'MIT Academy of Engineering',
    alternateName: 'MITAOE',
    url: 'https://mitaoe-erp.vercel.app',
    logo: 'https://mitaoe-erp.vercel.app/favicon.png',
    description:
      'MIT Academy of Engineering is an autonomous engineering institution affiliated to Savitribai Phule Pune University, offering world-class engineering education in Pune, Maharashtra.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Alandi Road',
      addressLocality: 'Pune',
      addressRegion: 'Maharashtra',
      postalCode: '412105',
      addressCountry: 'IN',
    },
    telephone: '+91-9071123436',
    email: 'admissions@mitaoe.ac.in',
    sameAs: ['https://mitaoe.ac.in'],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StructuredData schema={orgSchema} id="org-structured-data" />
      <Navbar />
      <main className="flex-grow font-poppins bg-white text-[#030303] px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full py-6">
        {/* Heading */}
        <div className="text-center mt-10 mb-8 sm:mt-16 sm:mb-12 text-[#123458]">
          <h1 className="text-4xl sm:text-5xl font-bold">
            About <span className="text-[#123458]">Us</span>
          </h1>
        </div>

        {/* About Section */}
        <div className="my-12 flex flex-col md:flex-row gap-12 items-center">
          <img
            className="w-full md:max-w-[400px] rounded-lg object-cover shadow-lg border border-[#123458]/10"
            src={assets.mitaoe}
            alt="MIT Academy of Engineering campus, Alandi Road, Pune"
            loading="lazy"
            width="400"
            height="300"
          />
          <div className="flex flex-col justify-center gap-6 md:w-3/5 text-base leading-relaxed">
            <h2 className="text-2xl font-bold mb-2 text-[#123458]">About MITAOE Booking</h2>
            <p className="text-muted-foreground text-base">
              MITAOE Booking is MITAOE's internal platform for reserving campus resources such as
              seminar halls, guest rooms, and vehicles. The goal is to make the reservation process
              for events, stays, and transportation simple, transparent, and efficient for the
              entire MITAOE community.
            </p>
            <p className="text-muted-foreground">
              This portal is developed to digitize and streamline the MITAOE booking process for
              academic, departmental, and student-led activities within MITAOE. By providing
              real-time availability and a user-friendly interface, it helps faculty, staff, and
              students coordinate and reserve resources with ease.
            </p>
            <p className="text-muted-foreground">
              MITAOE Booking ensures optimal utilization of institutional resources, reduces manual
              work, and promotes better coordination for events across departments and clubs. Our
              commitment is to make campus facility management accessible and hassle-free for
              everyone at MITAOE.
            </p>
            <div className="mt-2">
              <h3 className="text-xl font-semibold text-[#123458] mb-1">Our Purpose</h3>
              <p className="text-muted-foreground">
                To empower the MITAOE community with a seamless, transparent, and efficient MITAOE
                booking experience—enabling better event planning, resource management, and
                collaboration across the campus.
              </p>
            </div>
          </div>
        </div>

        {/* About the Team Section */}
        <div className="bg-[#f5f7fa] border border-[#123458]/10 rounded-xl shadow-md px-6 py-10 md:px-16 md:py-12 mb-16">
          <h2 className="text-2xl font-bold text-center mb-6 text-[#123458]">About the Team</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-8 text-base">
            MITAOE Booking is a student-driven project developed as part of the Computer Engineering
            program at MIT Academy of Engineering. Our team is dedicated to building practical
            solutions that enhance campus life and streamline institutional processes. This project
            was completed under the guidance of our esteemed project coordinator.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center items-start mb-8 max-w-2xl mx-auto">
            <div className="flex flex-col gap-6 items-center text-center">
              <div className="flex flex-col items-center">
                <a
                  href="https://samadhanportfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#123458] text-[#123458] transition-colors font-semibold text-lg md:text-xl underline"
                >
                  Samadhan Mane
                </a>
                <span className="text-sm text-gray-500 break-all">samadhanmane2324@gmail.com</span>
                <span className="text-sm text-gray-500">+91-8010427685</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-semibold text-[#123458] text-lg md:text-xl">Krishna Gadhave</span>
                <span className="text-sm text-gray-500 break-all">krushnagadhave201@gmail.com</span>
                <span className="text-sm text-gray-500">+91-8799833013</span>
              </div>
            </div>

            <div className="flex flex-col gap-6 items-center text-center">
              <div className="flex flex-col items-center">
                <span className="font-semibold text-[#123458] text-lg md:text-xl">Chaitanya Retawade</span>
                <span className="text-sm text-gray-500 break-all">
                  chaitanya.retawade08@gmail.com
                </span>
                <span className="text-sm text-gray-500">+91-8380079533</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-[#123458] text-lg md:text-xl">Vivek Borade</span>
                <span className="text-sm text-gray-500 break-all">boradevivek74@gmail.com</span>
                <span className="text-sm text-gray-500">+91-9922683864</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-4 border-t border-[#123458]/10 pt-4">
            <span className="font-semibold text-base text-[#123458]">Project Coordinator:</span>
            <span className="ml-2 text-base text-[#030303]">Pranav Shriram Sir</span>
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm max-w-2xl mx-auto">
            We are proud to contribute to MITAOE's digital transformation journey. Our collaborative
            effort reflects our passion for technology, teamwork, and delivering real value to our
            academic community.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
