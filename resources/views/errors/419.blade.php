<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>419 - Session Expired</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes tick {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(6deg); }
        }
        @keyframes fade-pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        .animate-tick { animation: tick 1s ease-in-out infinite; }
        .animate-fade-pulse { animation: fade-pulse 2s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Decorative circles -->
    <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary-500/20 rounded-full"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary-500/10 rounded-full"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-primary-500/5 rounded-full"></div>
    </div>

    <div class="relative text-center z-10">
        <div class="relative inline-block mb-8">
            <!-- Clock face -->
            <div class="relative w-40 h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 border-4 border-primary-500/30 flex items-center justify-center">
                <!-- Clock hands -->
                <div class="absolute w-1 h-12 bg-primary-400 rounded-full origin-bottom animate-tick" style="bottom: 50%;"></div>
                <div class="absolute w-1.5 h-8 bg-white rounded-full origin-bottom" style="bottom: 50%; transform: rotate(-45deg);"></div>
                <div class="absolute w-3 h-3 bg-white rounded-full"></div>

                <!-- Hour markers -->
                <div class="absolute inset-4">
                    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-primary-400/50 rounded-full"></div>
                    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-2 bg-primary-400/50 rounded-full"></div>
                    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-primary-400/50 rounded-full"></div>
                    <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-1 bg-primary-400/50 rounded-full"></div>
                </div>
            </div>

            <span class="block text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary-300 via-primary-400 to-primary-600 leading-none">
                419
            </span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">Time's up</h1>
        <p class="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            Your session expired for security. Refresh the page to pick up where you left off.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onclick="location.reload()" class="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-0.5">
                <svg class="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
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
