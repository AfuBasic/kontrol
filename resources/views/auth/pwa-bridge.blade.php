<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <title>Signed in — Kontrol</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    <link rel="manifest" href="/manifest.json">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0A3D91 0%, #041E4A 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 48px 32px;
            text-align: center;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .icon-wrapper {
            width: 72px;
            height: 72px;
            background: #ECFDF5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .checkmark {
            width: 36px;
            height: 36px;
            color: #10B981;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
        }
        p {
            font-size: 15px;
            color: #64748b;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .open-app {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #0A3D91;
            color: white;
            font-size: 16px;
            font-weight: 600;
            padding: 14px 32px;
            border-radius: 14px;
            text-decoration: none;
            width: 100%;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
        }
        .open-app:hover { background: #072f73; }
        .open-app:active { transform: scale(0.98); }
        .app-icon {
            width: 20px;
            height: 20px;
        }
        .instructions {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        .instructions p {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 0;
        }
        .instructions strong {
            color: #64748b;
        }
        .logo {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
        }
    </style>
</head>
<body>
    <div class="card">
        <img src="/assets/images/icon.png" alt="Kontrol" class="logo">
        <div class="icon-wrapper">
            <svg class="checkmark" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h1>You're signed in!</h1>
        <p>You can now close this browser window and return to the Kontrol app.</p>

        <button type="button" class="open-app" id="openAppBtn">
            <svg class="app-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Return to Kontrol App
        </button>

        <div class="instructions">
            <p>If the app doesn't open automatically,<br><strong>switch back to the Kontrol app manually.</strong></p>
        </div>
    </div>

    <script>
        const redirectUrl = @json($redirectUrl);
        const baseUrl = @json(config('app.url'));

        // Detect platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/.test(navigator.userAgent);

        function openApp() {
            if (isAndroid) {
                // For Android, try intent URL to open the installed PWA
                // This triggers the "Open with" dialog or opens the PWA directly
                const intentUrl = `intent://${window.location.host}${redirectUrl}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
                window.location.href = intentUrl;

                // Fallback: try regular navigation after a short delay
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else if (isIOS) {
                // For iOS, navigation to the same origin may reopen the PWA
                // But it's not guaranteed, so we just navigate and hope
                window.location.href = redirectUrl;
            } else {
                // Desktop or other - just redirect
                window.location.href = redirectUrl;
            }
        }

        // Handle button click
        document.getElementById('openAppBtn').addEventListener('click', openApp);

        // Auto-attempt to open app after a short delay (gives user time to read)
        setTimeout(openApp, 1500);
    </script>
</body>
</html>
