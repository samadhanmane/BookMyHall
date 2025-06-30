import React from 'react';
import Header from '../components/Header';
import TopHalls from '../components/TopHalls';

const Home = () => {
  return (
    <div className="bg-white text-[#030303] font-poppins">
      <section className="border-b-2 border-[#123458]">
        <Header />
      </section>
      <section className="px-4 md:px-20 py-10">
        <TopHalls />
      </section>
    </div>
  );
};

export default Home;
