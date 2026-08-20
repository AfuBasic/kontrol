<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kontrol - Offline</title>
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="icon" href="/assets/images/icon.png" type="image/png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #020617;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 400px;
            padding: 32px 24px;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(51, 65, 85, 0.5);
            border-radius: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: rgba(79, 70, 229, 0.15);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0 0 10px;
        }
        p {
            font-size: 0.9rem;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0 0 24px;
        }
        button {
            background-color: #4f46e5;
            color: #ffffff;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            width: 100%;
        }
        button:active {
            transform: scale(0.98);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
        </div>
        <h1>You are Offline</h1>
        <p>Kontrol requires an active internet connection to process gate access and update your estate records.</p>
        <button onclick="window.location.reload()">Retry Connection</button>
    </div>
</body>
</html>
