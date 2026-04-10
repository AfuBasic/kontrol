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
        .estate-info {
            background-color: #f3f4f6;
            border-left: 4px solid #1f6fdb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .estate-info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
            display: block;
        }
        .estate-info-value {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
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
        .info-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #1e40af;
        }
        .next-steps {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .next-steps-title {
            font-weight: 600;
            color: #15803d;
            margin-bottom: 10px;
        }
        .next-steps-item {
            color: #15803d;
            font-size: 14px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .next-steps-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        .next-steps-item:last-child {
            margin-bottom: 0;
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
            <h1>🎉 Welcome to Kontrol</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello,
            </div>

            <p>
                You've been invited to manage <strong>{{ $estateName }}</strong> on {{ config('app.name') }}.
                Get ready to streamline your estate operations with our powerful management platform.
            </p>

            <div class="estate-info">
                <span class="estate-info-label">You're managing</span>
                <div class="estate-info-value">{{ $estateName }}</div>
            </div>

            <p>
                To complete your setup and access your estate dashboard, please set up your password by clicking the button below.
            </p>

            <div class="button-wrapper">
                <a href="{{ $invitationUrl }}" class="button">Set Up Your Password</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px;">
                Or copy and paste this link:
                <br>
                <span style="word-break: break-all; font-size: 11px;">{{ $invitationUrl }}</span>
            </p>

            <div class="info-box">
                <strong>⏱️ This invitation link expires in 72 hours</strong><br>
                Complete your setup within this timeframe to activate your account.
            </div>

            <div class="next-steps">
                <div class="next-steps-title">What happens next?</div>
                <div class="next-steps-item">Set up your password to secure your account</div>
                <div class="next-steps-item">Access your estate dashboard and settings</div>
                <div class="next-steps-item">Start managing residents and security</div>
                <div class="next-steps-item">Invite your team members</div>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                Questions or need help? Contact us at <a href="mailto:support@usekontrol.com" class="footer-link">support@usekontrol.com</a>
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
