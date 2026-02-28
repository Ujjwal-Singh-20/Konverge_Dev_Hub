/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: 'hsl(250, 80%, 60%)',
                    secondary: 'hsl(250, 80%, 45%)',
                    surface: 'hsl(250, 20%, 10%)',
                    accent: 'hsl(180, 100%, 50%)', // Neon Cyan for AI
                },
                chat: {
                    bg: '#0F0F12', // Deep near-black
                    sidebar: '#16161D', // Slightly lighter blue-tinted gray
                    bubble: '#1E1E26',
                    bubbleSelf: 'hsl(250, 80%, 60%)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'premium': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'accent-glow': '0 0 20px rgba(59, 130, 246, 0.3)',
                'ai-glow': '0 0 20px rgba(0, 255, 255, 0.2)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
            }
        },
    },
    plugins: [],
}
