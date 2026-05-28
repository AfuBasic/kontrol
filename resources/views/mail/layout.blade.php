<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            width: 100% !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            background-color: #f8fafc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
        }

        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Container */
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f8fafc;
            padding-bottom: 40px;
        }

        .main {
            background-color: #ffffff;
            margin: 0 auto;
            width: 100%;
            max-width: 600px;
            border-spacing: 0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }

        /* Header */
        .header {
            padding: 40px 0 20px;
            text-align: center;
        }

        .logo {
            width: 140px;
            margin-bottom: 24px;
        }

        /* Content */
        .content {
            padding: 40px 48px;
        }

        h1 {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
            margin: 0 0 16px;
        }

        p {
            font-size: 16px;
            line-height: 26px;
            margin: 0 0 24px;
            color: #475569;
        }

        /* Button */
        .button-container {
            padding: 8px 0 32px;
            text-align: center;
        }

        .button {
            background-color: #4f46e5;
            border-radius: 12px;
            color: #ffffff !important;
            display: inline-block;
            font-size: 16px;
            font-weight: 600;
            line-height: 56px;
            text-align: center;
            text-decoration: none;
            width: 240px;
            -webkit-text-size-adjust: none;
            box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);
        }

        /* Footer */
        .footer {
            padding: 32px 48px;
            text-align: center;
            font-size: 14px;
            color: #94a3b8;
        }

        .footer p {
            font-size: 14px;
            line-height: 20px;
            margin-bottom: 8px;
            color: #94a3b8;
        }

        .footer a {
            color: #6366f1;
            text-decoration: none;
        }

        /* Utilities */
        .divider {
            height: 1px;
            background-color: #f1f5f9;
            margin: 32px 0;
        }

        .bold {
            font-weight: 600;
            color: #1e293b;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            background-color:
                @yield('badge-bg', '#eef2ff')
            ;
            color:
                @yield('badge-color', '#4338ca')
            ;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            margin-bottom: 16px;
        }

        /* Mobile Adjustments */
        @media only screen and (max-width: 620px) {
            .main {
                border-radius: 0 !important;
            }

            .content {
                padding: 32px 24px !important;
            }

            .button {
                width: 100% !important;
            }
        }

        /* Dark Mode — Apple Mail, iOS Mail, Outlook iOS/Android, Samsung Email */
        @media (prefers-color-scheme: dark) {

            body,
            .wrapper {
                background-color: #020617 !important;
            }

            .main {
                background-color: #0f172a !important;
                border-color: #1e293b !important;
            }

            h1 {
                color: #f1f5f9 !important;
            }

            p {
                color: #94a3b8 !important;
            }

            .bold {
                color: #e2e8f0 !important;
            }

            .divider {
                background-color: #1e293b !important;
            }

            .footer p,
            .footer a {
                color: #475569 !important;
            }

            /* Logo swap */
            .logo-light {
                display: none !important;
                max-height: 0 !important;
                overflow: hidden !important;
                mso-hide: all !important;
            }

            .logo-dark {
                display: block !important;
                max-height: none !important;
                overflow: visible !important;
            }
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <table class="main" style="margin-top: 40px;">
            <tr>
                <td style="padding: 40px 48px 0; text-align: center;">
                    <a href="{{ config('app.url') }}" target="_blank">
                        {{-- Light mode logo (default) --}}
                        <img src="{{ config('app.url') }}/assets/images/kontrol-logo-horizontal.png" alt="Kontrol"
                            class="logo logo-light" style="width: 160px; margin-bottom: 0; display: block;">
                        {{-- Dark mode logo (shown when device is in dark mode) --}}
                        <img src="{{ config('app.url') }}/assets/images/kontrol-white-logo-new.png" alt="Kontrol"
                            class="logo logo-dark" style="width: 160px; margin-bottom: 0; display: none;">
                    </a>
                </td>
            </tr>
            <tr>
                <td class="content">
                    @yield('content')
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                    <p>Designed to keep your community secure and connected.</p>
                    <p>
                        <a href="{{ config('app.url') }}/privacy">Privacy Policy</a> •
                        <a href="{{ config('app.url') }}/terms">Terms of Service</a>
                    </p>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
