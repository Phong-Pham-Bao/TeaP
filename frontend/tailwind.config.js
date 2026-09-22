/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teap: {
          dark: '#1B4332',
          DEFAULT: '#2D6A4F',
          light: '#40916C',
          cream: '#F4F1DE',
          sand: '#E9D8A6',
          coral: '#E76F51',
          gold: '#EE9B00',
        },
      },
    },
  },
  plugins: [],
};
