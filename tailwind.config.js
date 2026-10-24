/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // One shared palette so all three workstreams look like one product.
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        care: '#0d9488', // Workstream A accent (teal)
        find: '#7c3aed', // Workstream B accent (violet)
        coordinate: '#ea580c', // Workstream C accent (orange)
      },
    },
  },
  plugins: [],
}
