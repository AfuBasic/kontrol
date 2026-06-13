<!DOCTYPE html>
<html>
<head>
    <title>New Support Request</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
    <div style="max-w: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0;">New Support Request</h2>
        <p style="color: #475569; font-size: 16px;">You have received a new support request from the public website.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 120px; color: #334155;">Name:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $data['name'] }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #334155;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">{{ $data['email'] }}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold; vertical-align: top; color: #334155;">Message:</td>
                <td style="padding: 10px; color: #0f172a; white-space: pre-wrap;">{{ $data['message'] }}</td>
            </tr>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
            &copy; {{ date('Y') }} Kontrol. All rights reserved.
        </div>
    </div>
</body>
</html>
