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
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            color: #1e40af;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 10px;
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
            @if($isPasswordReset ?? false)
                <h1>🔑 Reset Your Password</h1>
            @else
                <h1>👋 Welcome to {{ $estateName }}</h1>
            @endif
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>

            @if($isPasswordReset ?? false)
                <p>
                    A password reset was requested for your account at <strong>{{ $estateName }}</strong>.
                    Click the button below to reset your password and regain access to your account.
                </p>
                <p style="font-size: 13px; color: #6b7280;">
                    <strong>Note:</strong> Your account will remain pending until you set a new password using the link below.
                </p>
            @else
                <p>
                    You've been invited to join <strong>{{ $estateName }}</strong> as a resident on {{ config('app.name') }}.
                    To complete your registration and get started, please set up your password by clicking the button below.
                </p>
                <div class="role-badge">👤 Resident</div>

                <div class="estate-info">
                    <span class="estate-info-label">Estate</span>
                    <div class="estate-info-value">{{ $estateName }}</div>
                </div>
            @endif

            <div class="button-wrapper">
                <a href="{{ $invitationUrl }}" class="button">Set Up Your Password</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px;">
                Or copy and paste this link:
                <br>
                <span style="word-break: break-all; font-size: 11px;">{{ $invitationUrl }}</span>
            </p>

            <div class="info-box">
                <strong>⏱️ This link expires in 72 hours</strong><br>
                @if($isPasswordReset ?? false)
                    Complete your password reset within this timeframe to reactivate your account.
                @else
                    Complete your registration within this timeframe to activate your account.
                @endif
            </div>

            @if(!($isPasswordReset ?? false))
                <p style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 4px; color: #15803d; font-size: 13px;">
                    <strong>💡 What happens next?</strong><br>
                    Once you set up your password, you'll have access to the resident portal where you can view estate announcements, submit requests, and stay connected with your community.
                </p>
            @endif

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
