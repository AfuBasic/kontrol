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
        .button-wrapper {
            text-align: center;
            margin: 40px 0;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #1f6fdb 0%, #0a3d91 100%);
            color: white;
            padding: 14px 40px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(31, 111, 219, 0.3);
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
        .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #15803d;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .footer-link {
            color: #1f6fdb;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ config('app.url') }}/assets/images/kontrol-white.png" alt="Kontrol Logo" class="logo">
            <h1>🔑 Reset Your Password</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>

            <p>
                We received a request to reset the password for your {{ config('app.name') }} account.
                Click the button below to create a new password.
            </p>

            <div class="button-wrapper">
                <a href="{{ $resetUrl }}" class="button">Reset Password</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px;">
                Or copy and paste this link in your browser:
                <br>
                <span style="word-break: break-all; font-size: 11px;">{{ $resetUrl }}</span>
            </p>

            <div class="expiry-info">
                <strong>⏱️ This link expires in 60 minutes</strong><br>
                For security, password reset links are only valid for a limited time.
            </div>

            <div class="info-box">
                <strong>💡 Didn't request this?</strong><br>
                If you didn't request a password reset, no action is needed. Your account remains secure.
                If you believe someone is trying to access your account, please contact our support team immediately.
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                Need help? Contact us at <a href="mailto:support@usekontrol.com" class="footer-link">support@usekontrol.com</a>
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
