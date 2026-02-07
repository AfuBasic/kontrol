<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- SEO Meta Tags --}}
        <meta name="description" content="Kontrol is the modern estate access management platform. Generate digital access codes for visitors, validate instantly at the gate, and track every entry.">
        <meta name="keywords" content="estate access control, visitor management, gate access, digital access codes, estate security, residential security, gated community, Nigeria, Africa">
        <meta name="author" content="Kontrol">
        <meta name="robots" content="index, follow">

        {{-- Open Graph / Facebook --}}
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="Kontrol - Modern Estate Access Control">
        <meta property="og:description" content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds, not minutes. 100% Free.">
        <meta property="og:image" content="{{ asset('assets/images/app-icon.png') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Kontrol - Estate Access Reimagined">
        <meta property="og:site_name" content="Kontrol">
        <meta property="og:locale" content="en_US">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ url()->current() }}">
        <meta name="twitter:title" content="Kontrol - Modern Estate Access Control">
        <meta name="twitter:description" content="Replace outdated phone calls and paper logs with instant digital access codes. Security validates visitors in seconds.">
        <meta name="twitter:image" content="{{ asset('assets/images/app-icon.png') }}">
        <meta name="twitter:image:alt" content="Kontrol - Estate Access Reimagined">

        {{-- App Meta --}}
        <meta name="application-name" content="Kontrol">
        <meta name="apple-mobile-web-app-title" content="Kontrol">

        <link rel="icon" href="/assets/images/icon.png" type="image/png">
        <link rel="apple-touch-icon" href="/assets/images/app-icon.png">
        <link rel="manifest" href="/manifest.json">
        <link rel="canonical" href="{{ url()->current() }}">
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111827">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @if(config('services.google.analytics_id'))
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ config('services.google.analytics_id') }}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{{ config('services.google.analytics_id') }}');
        </script>
        @endif

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead

    <style>
        #pwa-splash { display: none; }
        @media (display-mode: standalone) {
            #pwa-splash {
                display: flex;
                position: fixed;
                inset: 0;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #ffffff;
                z-index: 99999;
                justify-content: center;
                align-items: center;
                transition: opacity 0.5s ease-out;
            }
        }
        @media (prefers-color-scheme: dark) and (display-mode: standalone) {
            #pwa-splash { background: #111827; }
        }
    </style>
    </head>
    <body class="font-sans antialiased">
        <div id="pwa-splash">
            <img src="/assets/images/app-icon.png" alt="Kontrol" style="width: 120px; height: 120px; border-radius: 20px;">
        </div>
        <script>
            // Remove splash screen after load
            if (window.matchMedia('(display-mode: standalone)').matches) {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        const splash = document.getElementById('pwa-splash');
                        if (splash) {
                            splash.style.opacity = '0';
                            setTimeout(() => splash.remove(), 500);
                        }
                    }, 1000); // 1s visual delay to show brand
                });
            }
        </script>
        @inertia

        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
            }
        </script>
    </body>
</html>
