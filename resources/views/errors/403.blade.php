<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Denied</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes shake-subtle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-3deg); }
            75% { transform: rotate(3deg); }
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        .animate-shake-subtle { animation: shake-subtle 2s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-linear-to-br from-error-600 via-error-700 to-error-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Animated lock decorations -->
    <div class="absolute inset-0 overflow-hidden opacity-10">
        <svg class="absolute -top-20 -left-20 w-80 h-80 text-white animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <svg class="absolute -bottom-32 -right-32 w-96 h-96 text-white animate-pulse-glow" style="animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    </div>

    <div class="relative text-center z-10 max-w-lg mx-auto">
        <!-- Animated icon -->
        <div class="animate-shake-subtle mb-8">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">Access Denied</h1>
        <p class="text-error-100 mb-10 text-lg leading-relaxed">
            You don't have permission to access this area. Contact your administrator if you believe this is a mistake.
        </p>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href="{{ url('/') }}" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-error-700 text-sm font-semibold rounded-xl hover:bg-error-50 transition-all shadow-lg">
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
                <span class="relative inline-flex rounded-full h-3 w-3 bg-error-300"></span>
            </span>
            <span class="text-white font-medium">Error 403</span>
        </div>
    </div>
</body>
</html>
