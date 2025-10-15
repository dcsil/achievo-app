/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Background colors - all shades from 50 to 600
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-300', 'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600',
    'bg-pink-50', 'bg-pink-100', 'bg-pink-200', 'bg-pink-300', 'bg-pink-400', 'bg-pink-500', 'bg-pink-600',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', // For personal tasks without course color
    // Gradient backgrounds - all shades from 50 to 600
    'bg-gradient-to-bl', 'bg-gradient-to-r',
    'from-blue-50', 'from-blue-100', 'from-blue-200', 'from-blue-300', 'from-blue-400', 'from-blue-500', 'from-blue-600',
    'to-blue-50', 'to-blue-100', 'to-blue-200', 'to-blue-300', 'to-blue-400', 'to-blue-500', 'to-blue-600',
    'from-red-50', 'from-red-100', 'from-red-200', 'from-red-300', 'from-red-400', 'from-red-500', 'from-red-600',
    'to-red-50', 'to-red-100', 'to-red-200', 'to-red-300', 'to-red-400', 'to-red-500', 'to-red-600',
    'from-yellow-50', 'from-yellow-100', 'from-yellow-200', 'from-yellow-300', 'from-yellow-400', 'from-yellow-500', 'from-yellow-600',
    'to-yellow-50', 'to-yellow-100', 'to-yellow-200', 'to-yellow-300', 'to-yellow-400', 'to-yellow-500', 'to-yellow-600',
    'from-green-50', 'from-green-100', 'from-green-200', 'from-green-300', 'from-green-400', 'from-green-500', 'from-green-600',
    'to-green-50', 'to-green-100', 'to-green-200', 'to-green-300', 'to-green-400', 'to-green-500', 'to-green-600',
    'from-purple-50', 'from-purple-100', 'from-purple-200', 'from-purple-300', 'from-purple-400', 'from-purple-500', 'from-purple-600',
    'to-purple-50', 'to-purple-100', 'to-purple-200', 'to-purple-300', 'to-purple-400', 'to-purple-500', 'to-purple-600',
    'from-pink-50', 'from-pink-100', 'from-pink-200', 'from-pink-300', 'from-pink-400', 'from-pink-500', 'from-pink-600',
    'to-pink-50', 'to-pink-100', 'to-pink-200', 'to-pink-300', 'to-pink-400', 'to-pink-500', 'to-pink-600',
    'from-indigo-50', 'from-indigo-100', 'from-indigo-200', 'from-indigo-300', 'from-indigo-400', 'from-indigo-500', 'from-indigo-600',
    'to-indigo-50', 'to-indigo-100', 'to-indigo-200', 'to-indigo-300', 'to-indigo-400', 'to-indigo-500', 'to-indigo-600',
    'from-orange-50', 'from-orange-100', 'from-orange-200', 'from-orange-300', 'from-orange-400', 'from-orange-500', 'from-orange-600',
    'to-orange-50', 'to-orange-100', 'to-orange-200', 'to-orange-300', 'to-orange-400', 'to-orange-500', 'to-orange-600',
    'to-white',
    // Text colors - all shades from 50 to 600
    'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400', 'text-blue-500', 'text-blue-600',
    'text-red-50', 'text-red-100', 'text-red-200', 'text-red-300', 'text-red-400', 'text-red-500', 'text-red-600',
    'text-yellow-50', 'text-yellow-100', 'text-yellow-200', 'text-yellow-300', 'text-yellow-400', 'text-yellow-500', 'text-yellow-600',
    'text-green-50', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400', 'text-green-500', 'text-green-600',
    'text-purple-50', 'text-purple-100', 'text-purple-200', 'text-purple-300', 'text-purple-400', 'text-purple-500', 'text-purple-600',
    'text-pink-50', 'text-pink-100', 'text-pink-200', 'text-pink-300', 'text-pink-400', 'text-pink-500', 'text-pink-600',
    'text-indigo-50', 'text-indigo-100', 'text-indigo-200', 'text-indigo-300', 'text-indigo-400', 'text-indigo-500', 'text-indigo-600',
    'text-orange-50', 'text-orange-100', 'text-orange-200', 'text-orange-300', 'text-orange-400', 'text-orange-500', 'text-orange-600',
    // Border colors - all shades from 50 to 600
    'border-blue-50', 'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500', 'border-blue-600',
    'border-red-50', 'border-red-100', 'border-red-200', 'border-red-300', 'border-red-400', 'border-red-500', 'border-red-600',
    'border-yellow-50', 'border-yellow-100', 'border-yellow-200', 'border-yellow-300', 'border-yellow-400', 'border-yellow-500', 'border-yellow-600',
    'border-green-50', 'border-green-100', 'border-green-200', 'border-green-300', 'border-green-400', 'border-green-500', 'border-green-600',
    'border-purple-50', 'border-purple-100', 'border-purple-200', 'border-purple-300', 'border-purple-400', 'border-purple-500', 'border-purple-600',
    'border-pink-50', 'border-pink-100', 'border-pink-200', 'border-pink-300', 'border-pink-400', 'border-pink-500', 'border-pink-600',
    'border-indigo-50', 'border-indigo-100', 'border-indigo-200', 'border-indigo-300', 'border-indigo-400', 'border-indigo-500', 'border-indigo-600',
    'border-orange-50', 'border-orange-100', 'border-orange-200', 'border-orange-300', 'border-orange-400', 'border-orange-500', 'border-orange-600',
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
