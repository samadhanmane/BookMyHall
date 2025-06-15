import React from 'react';
import Header from '../components/Header';
import SpecialityMenu from '../components/SpecialityMenu';
import TopHalls from '../components/TopHalls';

const Home = () => {
  return (
    <div className="bg-white text-[#030303] font-[Poppins]">
      <section className="border-b border-[#123458] shadow-sm">
        <Header />
      </section>

      <section className="px-4 md:px-20 py-10 border-b border-[#123458] shadow-sm">
        <SpecialityMenu />
      </section>

      <section className="px-4 md:px-20 py-10">
        <TopHalls />
      </section>
    </div>
  );
};

export default Home;
