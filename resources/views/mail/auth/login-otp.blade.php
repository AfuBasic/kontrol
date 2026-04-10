<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1f6fdb 0%, #0a3d91 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            max-width: 100px;
            height: auto;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .code-box {
            background-color: #f3f4f6;
            border: 2px solid #1f6fdb;
            border-radius: 8px;
            padding: 30px 20px;
            margin: 30px 0;
            text-align: center;
        }
        .verification-code {
            font-size: 42px;
            font-weight: 700;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            color: #1f6fdb;
            margin: 0;
            word-break: break-all;
        }
        .code-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: block;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #92400e;
        }
        .expiry-info {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #1e40af;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .security-notice {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #15803d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ config('app.url') }}/assets/images/kontrol-white.png" alt="Kontrol Logo" class="logo">
            <h1>🔐 Login Verification</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>

            <p>
                We detected a sign-in attempt from a new device on your {{ config('app.name') }} account.
                To keep your account secure, we need you to verify this login attempt.
            </p>

            <div class="code-box">
                <span class="code-label">Your Verification Code</span>
                <p class="verification-code">{{ $code }}</p>
            </div>

            <div class="expiry-info">
                <strong>⏱️ This code expires in 10 minutes</strong><br>
                Do not share this code with anyone, including our support team.
            </div>

            <p style="margin-top: 20px;">
                Simply enter this code in the login form to complete your sign-in. If you didn't request this code,
                it's possible someone tried to access your account.
            </p>

            <div class="security-notice">
                <strong>🛡️ Account Security Tip:</strong><br>
                If you don't recognize this login attempt, change your password immediately to secure your account.
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                Questions? Contact our support team at <a href="mailto:support@usekontrol.com" style="color: #1f6fdb; text-decoration: none;">support@usekontrol.com</a>
            </p>
        </div>

        <div class="footer">
            <p style="margin: 0;">
                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
