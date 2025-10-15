/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Background colors
    'bg-blue-100', 'bg-blue-200', 'bg-blue-400', 'bg-blue-500',
    'bg-red-100', 'bg-red-200', 'bg-red-400', 'bg-red-500',
    'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-400', 'bg-yellow-500',
    'bg-green-100', 'bg-green-200', 'bg-green-400', 'bg-green-500',
    'bg-purple-100', 'bg-purple-200', 'bg-purple-400', 'bg-purple-500',
    'bg-pink-100', 'bg-pink-200', 'bg-pink-400', 'bg-pink-500',
    'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-400', 'bg-indigo-500',
    'bg-orange-100', 'bg-orange-200', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600',
    'bg-gray-400', // For personal tasks without course color
    // Gradient backgrounds
    'bg-gradient-to-bl', 'from-blue-100', 'to-blue-200',
    'from-red-100', 'to-red-200', 'from-yellow-100', 'to-yellow-200',
    'from-green-100', 'to-green-200', 'from-purple-100', 'to-purple-200',
    'from-pink-100', 'to-pink-200', 'from-indigo-100', 'to-indigo-200',
    'bg-gradient-to-r', 'from-orange-500', 'to-yellow-500', 'to-white',
    // Text colors
    'text-blue-400', 'text-red-400', 'text-yellow-400', 'text-green-400',
    'text-purple-400', 'text-pink-400', 'text-indigo-400', 'text-orange-400',
    // Border colors
    'border-blue-400', 'border-red-400', 'border-yellow-400', 'border-green-400',
    'border-purple-400', 'border-pink-400', 'border-indigo-400', 'border-orange-400',
    // Text sizes
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    // Responsive layout classes
    'flex-col', 'min-[500px]:flex-row', 'min-[500px]:items-center', 'min-[500px]:gap-3',
    'self-end', 'min-[500px]:self-auto', 'justify-between', 'min-[500px]:contents',
    'min-[500px]:ml-auto', 'min-[500px]:order-first', 'min-[500px]:mx-4',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
