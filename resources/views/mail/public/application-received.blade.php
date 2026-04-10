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
        .details {
            background-color: #f3f4f6;
            border-left: 4px solid #1f6fdb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .details-item {
            margin-bottom: 10px;
            font-size: 14px;
        }
        .details-item strong {
            color: #1f2937;
            display: inline-block;
            min-width: 120px;
        }
        .details-item:last-child {
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
        .button {
            display: inline-block;
            background-color: #1f6fdb;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: 500;
        }
        .cta-section {
            text-align: center;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ config('app.url') }}/assets/images/kontrol-white.png" alt="Kontrol Logo" class="logo">
            <h1>✓ Application Received</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hello <strong>{{ $estateName }}</strong>,
            </div>

            <p>
                Thank you for submitting your application to <strong>{{ config('app.name') }}</strong>!
                We've received your request and we're excited to get you set up.
            </p>

            <div class="details">
                <strong style="display: block; margin-bottom: 12px; color: #1f2937;">Application Details</strong>
                <div class="details-item">
                    <strong>Estate Name:</strong> {{ $estateName }}
                </div>
                <div class="details-item">
                    <strong>Email:</strong> {{ $email }}
                </div>
                @if ($planName)
                <div class="details-item">
                    <strong>Selected Plan:</strong> {{ $planName }}
                    @if ($planInterval)
                        <span style="font-size: 12px; color: #6b7280;">
                            ({{ ucfirst($planInterval) }} Billing)
                        </span>
                    @endif
                </div>
                @endif
            </div>

            <p>
                We review every application personally and will get back to you <strong>within 24-48 hours</strong> with next steps.
            </p>

            <div class="info-box">
                <strong>What's Next?</strong><br>
                Our team will review your estate details, reach out to schedule setup, and help you onboard residents and security personnel.
            </div>

            <div class="cta-section">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    Questions? Contact us at <a href="mailto:support@usekontrol.com" style="color: #1f6fdb; text-decoration: none;">support@usekontrol.com</a>
                </p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0;">
                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
