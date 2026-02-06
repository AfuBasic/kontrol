<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/assets/images/icon.png" type="image/png">
        <link rel="apple-touch-icon" href="/assets/images/app-icon.png">
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111827">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

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
