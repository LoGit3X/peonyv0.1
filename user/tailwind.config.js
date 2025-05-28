/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
  ],
  darkMode: 'class',
  theme: {
    // Define custom breakpoints for better mobile-first approach
    screens: {
      'xs': '320px',     // Small mobile devices
      'sm': '480px',     // Mobile devices
      'md': '768px',     // Tablets
      'lg': '1024px',    // Laptops/Desktops
      'xl': '1280px',    // Large Desktops
      '2xl': '1536px',   // Extra Large Screens
    },
    extend: {
      colors: {
        'primary-teal': '#f03e3e',
        'accent-orange': '#FF9800',
        'bg-light-mint': '#F9F6F0',
        'card-bg': '#FFFFFF',
        'text-on-teal': '#FFFFFF',
        'text-dark': '#333333',
        'text-light': '#757575',
        'text-price': '#f03e3e',
        // Dark theme colors
        dark: {
          'background': '#2C2C2C', // Dark grey background
          'text': '#E0E0E0',       // Light grey/off-white text
          'card-bg': '#3A3A3A',    // Slightly lighter dark grey for cards
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        'xxs': '0.625rem', // 10px
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      minWidth: {
        'touch': '44px', // Minimum touch target size
      },
    },
  },
  plugins: [],
}

