<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 4s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-linear-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Animated decorations -->
    <div class="absolute inset-0 overflow-hidden opacity-10">
        <svg class="absolute -top-20 -left-20 w-80 h-80 text-white animate-pulse-ring" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <svg class="absolute -bottom-32 -right-32 w-96 h-96 text-white animate-pulse-ring" style="animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    </div>

    <div class="relative text-center z-10 max-w-lg mx-auto">
        <!-- Animated icon -->
        <div class="animate-float mb-8">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">Page Not Found</h1>
        <p class="text-primary-100 mb-10 text-lg leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href="{{ url('/') }}" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-all shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
            </a>
            <button onclick="history.back()" class="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
            </button>
        </div>

        <div class="inline-flex items-center gap-3 px-5 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <span class="relative flex h-3 w-3">
                <span class="relative inline-flex rounded-full h-3 w-3 bg-primary-300"></span>
            </span>
            <span class="text-white font-medium">Error 404</span>
        </div>
    </div>
</body>
</html>
