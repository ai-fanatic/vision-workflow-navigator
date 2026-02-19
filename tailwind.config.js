/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agent-primary': '#6366f1',
        'agent-accent': '#22d3ee',
        'agent-success': '#10b981',
        'agent-warning': '#f59e0b',
      }
    },
  },
  plugins: [],
}
