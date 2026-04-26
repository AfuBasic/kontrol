<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') - Kontrol</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    @vite(['resources/css/app.css'])
</head>
<body class="bg-slate-50 flex min-h-screen flex-col items-center justify-center p-6 text-center antialiased">
    <div class="max-w-md w-full">
        <div class="mb-8 flex justify-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-[32px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50">
                <div class="text-slate-900">
                    @yield('icon')
                </div>
            </div>
        </div>
        
        <h1 class="text-[100px] sm:text-[120px] font-black leading-none tracking-tighter text-slate-200/60">@yield('code')</h1>
        
        <div class="relative -mt-8 sm:-mt-10 px-4">
            <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">@yield('heading')</h2>
            <p class="mt-4 text-sm sm:text-base font-medium leading-relaxed text-slate-500">
                @yield('message')
            </p>
        </div>

        <div class="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="{{ url('/') }}" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl shadow-slate-200 transition-all active:scale-95">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
            </a>
            <button onclick="history.back()" class="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-slate-600 ring-1 ring-slate-200 transition-all active:scale-95">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
            </button>
        </div>
    </div>
</body>
</html>
