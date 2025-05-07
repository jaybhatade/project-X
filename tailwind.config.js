/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat'],
        'montserrat-light': ['Montserrat-Light'],
        'montserrat-medium': ['Montserrat-Medium'],
        'montserrat-semibold': ['Montserrat-SemiBold'],
        'montserrat-bold': ['Montserrat-Bold'],
      },
      colors: {
        // Light Theme Colors
        Primary: '#21965B',
        Secondary: 'rgb(31, 134, 83)',
        Background: '#FFFFFF',
        Surface: '#F5F5F5',
        OnPrimary: '#FFFFFF',
        OnSecondary: '#FFFFFF',
        OnBackground: '#000000',
        OnSurface: '#000000',
        TextPrimary: '#000000',
        TextSecondary: '#707070',
        
        // Dark Theme Colors
        PrimaryDark: '#21965B',
        SecondaryDark: 'rgb(25, 110, 68)',
        BackgroundDark: '#000000',
        SurfaceDark: '#1E1E1E',
        OnPrimaryDark: '#000000',
        OnSecondaryDark: '#000000',
        OnBackgroundDark: '#FFFFFF',
        OnSurfaceDark: '#FFFFFF',
        TextPrimaryDark: '#FFFFFF',
        TextSecondaryDark: '#B0B0B0',
      },
    },
  },
  plugins: [],
};
