<!DOCTYPE html>
<html>
<head>
    <title>New Estate Application</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
    <div style="max-w: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0;">New Estate Application</h2>
        <p style="color: #475569; font-size: 16px;">A new estate has applied for a Kontrol trial.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 140px; color: #334155;">Estate Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $application->estate_name }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Location:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $application->address }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Contact Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $application->email }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Contact Phone:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $application->phone ?: 'Not provided' }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold; vertical-align: top; color: #334155;">Notes/Name:</td>
                <td style="padding: 10px; color: #0f172a; white-space: pre-wrap;">{{ $application->notes }}</td>
            </tr>
        </table>

        <div style="margin-top: 30px; text-align: center;">
            <a href="{{ config('app.url') }}/login" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in Dashboard</a>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            &copy; {{ date('Y') }} Kontrol. All rights reserved.
        </div>
    </div>
</body>
</html>
