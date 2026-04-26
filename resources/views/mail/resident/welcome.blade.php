@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #f5f3ff; color: #5b21b6;">Onboarding</div>
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
                            <div style="background-color: #4f46e5; width: 40px; height: 40px; border-radius: 10px; text-align: center; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 10px; margin-left: 10px;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z"/></svg>
                            </div>
                        </td>
                        <td style="padding-left: 16px;">
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
                            <div style="background-color: #10b981; width: 40px; height: 40px; border-radius: 10px; text-align: center; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 10px; margin-left: 10px;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            </div>
                        </td>
                        <td style="padding-left: 16px;">
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
                            <div style="background-color: #8b5cf6; width: 40px; height: 40px; border-radius: 10px; text-align: center; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 10px; margin-left: 10px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                        </td>
                        <td style="padding-left: 16px;">
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
                            <div style="background-color: #f59e0b; width: 40px; height: 40px; border-radius: 10px; text-align: center; display: flex; align-items: center; justify-content: center;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top: 10px; margin-left: 10px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            </div>
                        </td>
                        <td style="padding-left: 16px;">
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
