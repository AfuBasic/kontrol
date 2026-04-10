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
        .role-badge {
            display: inline-block;
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            color: #92400e;
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
        .responsibilities {
            background-color: #f0fdf4;
            border-left: 4px solid #16a34a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .responsibilities-title {
            font-weight: 600;
            color: #15803d;
            margin-bottom: 10px;
        }
        .responsibility-item {
            color: #15803d;
            font-size: 14px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .responsibility-item:before {
            content: "✓";
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        .responsibility-item:last-child {
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
            <h1>👋 You're Invited!</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $userName }}</strong>,
            </div>

            <p>
                You've been invited to join <strong>{{ $estateName }}</strong> as an Administrator on {{ config('app.name') }}.
            </p>

            <div class="role-badge">👨‍💼 Administrator</div>

            <div class="estate-info">
                <span class="estate-info-label">Estate</span>
                <div class="estate-info-value">{{ $estateName }}</div>
            </div>

            <p>
                As an Administrator, you'll have full access to manage estate operations, settings, and team members.
                Click the button below to accept your invitation and set up your account.
            </p>

            <div class="button-wrapper">
                <a href="{{ $invitationUrl }}" class="button">Accept Invitation</a>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 15px;">
                Or copy and paste this link:
                <br>
                <span style="word-break: break-all; font-size: 11px;">{{ $invitationUrl }}</span>
            </p>

            <div class="responsibilities">
                <div class="responsibilities-title">Your responsibilities as Administrator:</div>
                <div class="responsibility-item">Manage estate settings and configurations</div>
                <div class="responsibility-item">Invite and manage team members</div>
                <div class="responsibility-item">Oversee residents and security personnel</div>
                <div class="responsibility-item">Access financial and reporting features</div>
            </div>

            <div class="info-box">
                <strong>⏱️ This invitation link expires in 72 hours</strong><br>
                Accept the invitation within this timeframe to activate your account.
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 13px; color: #6b7280; margin: 0;">
                Questions? Contact our support team at <a href="mailto:support@usekontrol.com" class="footer-link">support@usekontrol.com</a>
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
