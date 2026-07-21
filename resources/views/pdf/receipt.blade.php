<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - {{ $transaction['reference_number'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'DejaVu Sans', sans-serif;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #1e293b;
            background: white;
            padding: 40px;
            font-size: 14px;
            line-height: 1.5;
        }

        .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            background: #ffffff;
        }

        .header {
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }

        .estate-name {
            font-size: 18px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .title {
            font-size: 14px;
            font-weight: 600;
            color: #64748b;
        }

        .amount {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 15px;
        }

        .status {
            display: inline-block;
            background: #ecfdf5;
            color: #065f46;
            font-size: 11px;
            font-weight: bold;
            padding: 4px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            margin-top: 10px;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            margin-bottom: 40px;
        }

        .details-table td {
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
        }

        .label {
            color: #64748b;
            font-weight: 500;
            text-align: left;
        }

        .value {
            font-weight: bold;
            color: #0f172a;
            text-align: right;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
            border-top: 1px solid #f1f5f9;
            padding-top: 15px;
            margin-top: 30px;
        }
    </style>
</head>

<body>
    <div class="receipt-container">
        <div class="header">
            <div class="estate-name">{{ $estate->name }}</div>
            <div class="title">Transaction Receipt</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Ref: {{ $transaction['reference_number'] }}
            </div>

            <div class="amount">
                <span style="font-family: 'DejaVu Sans', sans-serif;">&#8358;</span>{{ number_format(($transaction['amount'] ?? 0) / 100, 2) }}
            </div>
            <div class="status">
                {{ $transaction['status_label'] ?? 'Successful' }}
            </div>
        </div>

        <table class="details-table">
            <tr>
                <td class="label">Resident / Owner</td>
                <td class="value">{{ $transaction['resident']['name'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Email Address</td>
                <td class="value">{{ $transaction['resident']['email'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Description</td>
                <td class="value">{{ $transaction['description'] ?? 'System Entry' }}</td>
            </tr>
            <tr>
                <td class="label">Payment Type</td>
                <td class="value">{{ $transaction['type_label'] ?? 'Payment' }}</td>
            </tr>
            <tr>
                <td class="label">Payment Method</td>
                <td class="value">{{ $transaction['payment_method_label'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Provider</td>
                <td class="value">{{ $transaction['provider'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Gateway Reference</td>
                <td class="value">{{ $transaction['gateway_reference'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Receipt Number</td>
                <td class="value">{{ $transaction['receipt_number'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Date Cleared</td>
                <td class="value">
                    {{ !empty($transaction['paid_at']) ? \Carbon\Carbon::parse($transaction['paid_at'])->format('M j, Y g:i A') : 'N/A' }}
                </td>
            </tr>
        </table>

        <div class="footer">
            Powered by Kontrol
        </div>
    </div>
</body>

</html>
