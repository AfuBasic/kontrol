<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-linear-to-br from-error-600 via-error-700 to-error-900 flex items-center justify-center px-4 overflow-hidden">
    <!-- Animated decorations -->
    <div class="absolute inset-0 overflow-hidden opacity-10">
        <svg class="absolute -top-20 -left-20 w-80 h-80 text-white animate-pulse-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg class="absolute -bottom-32 -right-32 w-96 h-96 text-white animate-pulse-glow" style="animation-delay: 1s;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    </div>

    <div class="relative text-center z-10 max-w-lg mx-auto">
        <!-- Animated icon -->
        <div class="animate-shake mb-8">
            <div class="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-2xl">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">Something went wrong</h1>
        <p class="text-error-100 mb-10 text-lg leading-relaxed">
            Our servers encountered an unexpected error. We're already working on fixing it.
        </p>

        <!-- Action buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button onclick="location.reload()" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-error-700 text-sm font-semibold rounded-xl hover:bg-error-50 transition-all shadow-lg">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
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
                <span class="relative inline-flex rounded-full h-3 w-3 bg-error-300"></span>
            </span>
            <span class="text-white font-medium">Error 500</span>
        </div>
    </div>
</body>
</html>
