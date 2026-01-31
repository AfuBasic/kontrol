<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>500 - Server Error</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes glitch {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
        }
        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
            52% { opacity: 1; }
            54% { opacity: 0.9; }
        }
        @keyframes smoke {
            0% { transform: translateY(0) scale(1); opacity: 0.5; }
            100% { transform: translateY(-100px) scale(2); opacity: 0; }
        }
        .animate-glitch { animation: glitch 0.3s ease-in-out infinite; }
        .animate-flicker { animation: flicker 2s ease-in-out infinite; }
        .smoke-particle { animation: smoke 3s ease-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-900 via-warning-950 to-gray-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Noise texture overlay -->
    <div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]"></div>

    <!-- Glow effects -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-warning-500/20 rounded-full blur-[100px]"></div>

    <div class="relative text-center z-10">
        <div class="relative inline-block mb-6">
            <!-- Smoke particles -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2">
                <div class="smoke-particle absolute w-4 h-4 bg-warning-500/30 rounded-full blur-sm" style="left: -20px; animation-delay: 0s;"></div>
                <div class="smoke-particle absolute w-3 h-3 bg-warning-400/30 rounded-full blur-sm" style="left: 0px; animation-delay: 0.5s;"></div>
                <div class="smoke-particle absolute w-5 h-5 bg-warning-500/20 rounded-full blur-sm" style="left: 20px; animation-delay: 1s;"></div>
            </div>

            <div class="animate-flicker">
                <span class="block text-[10rem] sm:text-[14rem] font-black leading-none tracking-tight">
                    <span class="text-transparent bg-clip-text bg-gradient-to-b from-warning-400 via-warning-500 to-warning-700 animate-glitch inline-block">5</span>
                    <span class="text-transparent bg-clip-text bg-gradient-to-b from-warning-400 via-warning-500 to-warning-700 inline-block">0</span>
                    <span class="text-transparent bg-clip-text bg-gradient-to-b from-warning-400 via-warning-500 to-warning-700 animate-glitch inline-block" style="animation-delay: 0.1s;">0</span>
                </span>
            </div>

            <!-- Warning icon badge -->
            <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl flex items-center justify-center shadow-xl shadow-warning-500/50 rotate-12">
                <svg class="w-7 h-7 text-white -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        </div>

        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3 mt-8">Something exploded</h1>
        <p class="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            Our servers had a meltdown. We're already on it.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onclick="location.reload()" class="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-warning-500 to-warning-600 text-white text-sm font-semibold rounded-xl hover:from-warning-600 hover:to-warning-700 transition-all shadow-xl shadow-warning-500/25 hover:shadow-2xl hover:shadow-warning-500/40 hover:-translate-y-0.5">
                <svg class="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
            </button>
            <a href="{{ url('/') }}" class="group inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm text-gray-300 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
            </a>
        </div>
    </div>
</body>
</html>
