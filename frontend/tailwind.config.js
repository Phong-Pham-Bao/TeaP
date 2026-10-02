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
          dark: '#123126',
          DEFAULT: '#2F6F52',
          light: '#3E8061',
          cream: '#F7F8F5',
          sand: '#DFE6E1',
          coral: '#C2414D',
          gold: '#B7791F',
        },
      },
    },
  },
  plugins: [],
};
