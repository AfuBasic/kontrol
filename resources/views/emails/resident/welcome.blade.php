@component('mail::message')
# Welcome to Kontrol, {{ $user->name }}! 🎉

You’re now in control of your estate experience. We've built Kontrol to make your daily life simpler, safer, and more connected.

<div style="margin: 40px 0;">
    <img src="{{ config('app.url') }}/assets/images/kontrol.png" alt="Welcome to Kontrol" style="width: 100%; max-width: 400px; display: block; margin: 0 auto; border-radius: 20px;">
</div>

## What you can do with Kontrol

<div style="display: grid; gap: 20px; margin: 30px 0;">
    <!-- Feature 1 -->
    <div style="background: #f8fafc; padding: 24px; border-radius: 24px; border: 1px solid #e2e8f0;">
        <div style="background: #6366f1; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <img src="{{ config('app.url') }}/assets/images/email/icons/access.png" alt="Access" style="width: 24px;">
        </div>
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 800;">Generate Access Codes</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">Generate visitor access codes in seconds. No more gate calls or delays.</p>
    </div>

    <!-- Feature 2 -->
    <div style="background: #f8fafc; padding: 24px; border-radius: 24px; border: 1px solid #e2e8f0; margin-top: 20px;">
        <div style="background: #10b981; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <img src="{{ config('app.url') }}/assets/images/email/icons/billing.png" alt="Billing" style="width: 24px;">
        </div>
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 800;">Pay Community Dues</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">Stay up to date with your payments. Secure and transparent billing for your peace of mind.</p>
    </div>

    <!-- Feature 3 -->
    <div style="background: #f8fafc; padding: 24px; border-radius: 24px; border: 1px solid #e2e8f0; margin-top: 20px;">
        <div style="background: #8b5cf6; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <img src="{{ config('app.url') }}/assets/images/email/icons/household.png" alt="Household" style="width: 24px;">
        </div>
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 800;">Add Household Members</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">Share access with your family. Let them manage visitors and receive alerts too.</p>
    </div>

    <!-- Feature 4 -->
    <div style="background: #f8fafc; padding: 24px; border-radius: 24px; border: 1px solid #e2e8f0; margin-top: 20px;">
        <div style="background: #f59e0b; width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <img src="{{ config('app.url') }}/assets/images/email/icons/emergency.png" alt="Emergency" style="width: 24px;">
        </div>
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 800;">Emergency Contacts</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">Stay prepared. Notify loved ones instantly when you need help via the SOS system.</p>
    </div>
</div>

## What to do next:

*   ✓ Add your first visitor
*   ✓ Add household members
*   ✓ Set up emergency contacts
*   ✓ Explore your dashboard

@component('mail::button', ['url' => config('app.url')])
Open Kontrol Dashboard
@endcomponent

You’re in control now. Kontrol is built to make your daily life simpler and safer.

Thanks,<br>
The {{ config('app.name') }} Team
@endcomponent
