<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Expired</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes tick {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(6deg); }
        }
        @keyframes pulse-fade {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        .animate-tick { animation: tick 1s ease-in-out infinite; }
        .animate-pulse-fade { animation: pulse-fade 3s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-linear-to-br from-warning-600 via-warning-700 to-warning-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Animated clock decorations -->
    <div class="absolute inset-0 overflow-hidden opacity-10">
        <svg class="absolute -top-20 -left-20 w-80 h-80 text-white animate-pulse-fade" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg class="absolute -bottom-32 -right-32 w-96 h-96 text-white animate-pulse-fade" style="animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </div>

    <div class="relative text-center z-10 max-w-lg mx-auto">
        <!-- Animated icon -->
        <div class="animate-tick mb-8">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">Session Expired</h1>
        <p class="text-warning-100 mb-10 text-lg leading-relaxed">
            Your session has timed out for security. Please refresh the page to continue where you left off.
        </p>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button onclick="location.reload()" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-warning-700 text-sm font-semibold rounded-xl hover:bg-warning-50 transition-all shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
            </button>
            <a href="{{ url('/') }}" class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
            </a>
        </div>

        <div class="inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span class="relative flex h-3 w-3">
                <span class="relative inline-flex rounded-full h-3 w-3 bg-warning-300"></span>
            </span>
            <span class="text-white font-medium">Error 419</span>
        </div>
    </div>
</body>
</html>
