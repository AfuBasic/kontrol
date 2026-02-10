<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Signed in — Kontrol</title>
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
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
            margin-bottom: 28px;
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
            transition: background 0.2s;
        }
        .open-app:hover { background: #072f73; }
        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .countdown {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-wrapper">
            <svg class="checkmark" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <h1>You're signed in!</h1>
        <p>Redirecting you back to the Kontrol app...</p>
        <a href="{{ $redirectUrl }}" class="open-app">
            <span class="spinner"></span>
            Opening Kontrol
        </a>
        <p class="countdown">Redirecting in <span id="timer">3</span>s</p>
    </div>

    <script>
        const redirectUrl = @json($redirectUrl);
        let seconds = 3;

        const timer = setInterval(() => {
            seconds--;
            const el = document.getElementById('timer');
            if (el) el.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(timer);
                window.location.href = redirectUrl;
            }
        }, 1000);
    </script>
</body>
</html>
