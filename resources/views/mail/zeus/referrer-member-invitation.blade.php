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
        .role-badge {
            display: inline-block;
            background-color: #fef08a;
            border: 1px solid #fde047;
            color: #713f12;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 10px;
            margin-bottom: 20px;
        }
        .referrer-info {
            background-color: #f3f4f6;
            border-left: 4px solid #1f6fdb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .referrer-info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
            display: block;
        }
        .referrer-info-value {
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
        .benefits {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .benefits-title {
            font-weight: 600;
            color: #15803d;
            margin-bottom: 10px;
        }
        .benefit-item {
            color: #15803d;
            font-size: 14px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .benefit-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        .benefit-item:last-child {
            margin-bottom: 0;
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
            <h1>🤝 Referral Invitation</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>

            <p>
                You've been invited to join <strong>{{ $referrerName }}</strong> as a Referrer Member on {{ config('app.name') }}.
                Help us grow by referring estates and earn rewards.
            </p>

            <div class="role-badge">🤝 Referrer Member</div>

            <div class="referrer-info">
                <span class="referrer-info-label">Referrer Name</span>
                <div class="referrer-info-value">{{ $referrerName }}</div>
            </div>

            <p>
                To complete your setup and access your referrer dashboard, please set up your password by clicking the button below.
            </p>

            <div class="button-wrapper">
                <a href="{{ $invitationUrl }}" class="button">Set Up Your Password</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px;">
                Or copy and paste this link:
                <br>
                <span style="word-break: break-all; font-size: 11px;">{{ $invitationUrl }}</span>
            </p>

            <div class="benefits">
                <div class="benefits-title">As a referrer member, you'll get:</div>
                <div class="benefit-item">Access to your dedicated referrer dashboard</div>
                <div class="benefit-item">Unique referral links and tracking codes</div>
                <div class="benefit-item">Real-time performance analytics</div>
                <div class="benefit-item">Attractive commission structure</div>
            </div>

            <div class="info-box">
                <strong>⏱️ This invitation link expires in 72 hours</strong><br>
                Complete your setup within this timeframe to activate your referrer account.
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                Questions? Contact us at <a href="mailto:support@usekontrol.com" class="footer-link">support@usekontrol.com</a>
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
