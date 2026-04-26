@extends('mail.layout')

@section('content')
    <h1>Welcome to Kontrol, {{ $user->name }}!</h1>
    
    <p>You’re now in control of your estate experience. We've built Kontrol to make your daily life simpler, safer, and more connected.</p>
    
    <div style="margin: 32px 0;">
        <img src="{{ config('app.url') }}/assets/images/kontrol-hero.png" alt="Welcome to Kontrol" style="width: 100%; border-radius: 16px; border: 1px solid #f1f5f9;">
    </div>

    <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 32px 0 16px;">What you can do now</h2>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 16px;">
        <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td width="40" style="vertical-align: top;">
                            <table width="40" height="40" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #4f46e5; border-radius: 10px; border-collapse: separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height: 40px;">
                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/key.png" width="20" height="20" style="display: block; border: 0;" alt="Access">
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1e293b;">Access Codes</h3>
                            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 20px;">Generate visitor codes in seconds. No more gate calls or delays.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 16px;">
        <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td width="40" style="vertical-align: top;">
                            <table width="40" height="40" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #10b981; border-radius: 10px; border-collapse: separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height: 40px;">
                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/wallet.png" width="20" height="20" style="display: block; border: 0;" alt="Billing">
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1e293b;">Community Dues</h3>
                            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 20px;">Stay up to date with your payments. Secure and transparent billing for your estate.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 16px;">
        <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td width="40" style="vertical-align: top;">
                            <table width="40" height="40" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #8b5cf6; border-radius: 10px; border-collapse: separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height: 40px;">
                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/conference-call.png" width="20" height="20" style="display: block; border: 0;" alt="Household">
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1e293b;">Household Management</h3>
                            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 20px;">Share access with your family. Let them manage visitors and receive estate alerts.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
        <tr>
            <td style="padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td width="40" style="vertical-align: top;">
                            <table width="40" height="40" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f59e0b; border-radius: 10px; border-collapse: separate;">
                                <tr>
                                    <td align="center" valign="middle" style="height: 40px;">
                                        <img src="https://img.icons8.com/ios-filled/50/ffffff/high-importance.png" width="20" height="20" style="display: block; border: 0;" alt="SOS">
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="padding-left: 16px; vertical-align: top;">
                            <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1e293b;">SOS & Safety</h3>
                            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 20px;">Stay prepared. Notify loved ones and estate security instantly in an emergency.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="button-container">
        <a href="{{ config('app.url') }}" class="button">Go to Dashboard</a>
    </div>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b; line-height: 20px; margin-bottom: 0;">
        We're excited to have you on board! If you have any questions, feel free to contact your estate administrator.
    </p>
@endsection
