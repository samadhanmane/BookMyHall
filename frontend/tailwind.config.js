/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    
  ],
 
   
  theme: {
    extend: {
      colors: {
        'primary': "#1d72bc", // Orange
        'text': "#000000", // Black
      },
      textColor: {
        'black': '#000000', // Custom text-black
        'gray': '#000000', // Replace text-black with text-black
      },
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill,minmax(200px,1fr))'
      },
    },
  },
  plugins: [],
  
}

