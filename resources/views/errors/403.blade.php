<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>403 - Access Denied</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
    <style>
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 40px rgba(220, 38, 38, 0.3); }
            50% { box-shadow: 0 0 80px rgba(220, 38, 38, 0.5); }
        }
        .animate-shake:hover { animation: shake 0.5s ease-in-out; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
    </style>
</head>
<body class="min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden">
    <!-- Grid pattern background -->
    <div class="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

    <!-- Radial glow -->
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]"></div>

    <div class="relative text-center z-10">
        <div class="relative inline-block mb-8">
            <!-- Lock icon container -->
            <div class="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 animate-pulse-glow rounded-full bg-gradient-to-br from-error-500/20 to-error-700/20 border border-error-500/30 flex items-center justify-center">
                <svg class="w-16 h-16 sm:w-20 sm:h-20 text-error-500 animate-shake" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>

            <span class="block text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-error-400 to-error-600 leading-none">
                403
            </span>
        </div>

        <h1 class="text-3xl sm:text-4xl font-bold text-white mb-3">Access Denied</h1>
        <p class="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            This area is restricted. You don't have clearance to proceed.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="{{ url('/') }}" class="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-error-500 to-error-600 text-white text-sm font-semibold rounded-xl hover:from-error-600 hover:to-error-700 transition-all shadow-xl shadow-error-500/25 hover:shadow-2xl hover:shadow-error-500/40 hover:-translate-y-0.5">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Safety
            </a>
            <button onclick="history.back()" class="group inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-sm text-gray-300 text-sm font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all hover:-translate-y-0.5">
                <svg class="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
            </button>
        </div>
    </div>
</body>
</html>
