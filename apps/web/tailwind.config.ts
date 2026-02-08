import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          dark: '#075E54',
          light: '#DCF8C6',
          teal: '#128C7E',
        },
      },
    },
  },
  plugins: [],
};

export default config;
