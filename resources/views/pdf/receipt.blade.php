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

        .status-partial {
            background: #fffbe6;
            color: #b45309;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            margin-bottom: 25px;
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
            width: 40%;
        }

        .value {
            font-weight: bold;
            color: #0f172a;
            text-align: right;
            width: 60%;
            word-break: break-all;
        }

        .breakdown-box {
            margin-top: 25px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }

        .breakdown-title {
            font-size: 12px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
        }

        .breakdown-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding: 4px 0;
        }

        .breakdown-subrow {
            font-size: 11px;
            color: #64748b;
            padding-left: 12px;
        }

        .breakdown-total {
            font-weight: bold;
            border-top: 1px dashed #cbd5e1;
            margin-top: 8px;
            padding-top: 8px;
            color: #0f172a;
        }

        .breakdown-balance {
            font-weight: bold;
            color: #b45309;
        }
    </style>
</head>

<body>
    @php
        $pb = $transaction['payment_breakdown'] ?? null;
    @endphp
    <div class="receipt-container">
        <div class="header">
            <div class="estate-name">{{ $estate->name }}</div>
            <div class="title">Transaction Receipt</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Ref: {{ $transaction['reference_number'] }}
            </div>

            <div class="amount">
                <span style="font-family: 'DejaVu Sans', sans-serif;">&#8358;</span>{{ number_format(($transaction['amount'] ?? 0) / 100, 2) }}
            </div>

            @if($pb && $pb['is_partial'])
                <div class="status status-partial">PARTIAL PAYMENT</div>
            @else
                <div class="status">
                    {{ $transaction['status_label'] ?? 'Successful' }}
                </div>
            @endif
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
                <td class="label">Payment Method</td>
                <td class="value">{{ $transaction['payment_method_label'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td class="label">Provider</td>
                <td class="value">{{ $transaction['provider'] && $transaction['provider'] !== 'N/A' ? $transaction['provider'] : 'Paystack' }}</td>
            </tr>
            <tr>
                <td class="label">Gateway Reference</td>
                <td class="value">{{ $transaction['gateway_reference'] ?? 'N/A' }}</td>
            </tr>

            <tr>
                <td class="label">Date Cleared</td>
                <td class="value">
                    {{ !empty($transaction['paid_at']) ? \Carbon\Carbon::parse($transaction['paid_at'])->format('M j, Y g:i A') : 'N/A' }}
                </td>
            </tr>
        </table>

        @if($pb)
            <div class="breakdown-box">
                <div class="breakdown-title">Bill Settlement Breakdown</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tr>
                        <td style="padding: 4px 0; color: #64748b;">Original Bill Amount</td>
                        <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">
                            &#8358;{{ number_format($pb['original_bill_amount'] / 100, 2) }}
                        </td>
                    </tr>

                    @if(!empty($pb['previous_payments']))
                        <tr>
                            <td colspan="2" style="padding-top: 6px; font-weight: bold; color: #475569;">Previous Payments Made:</td>
                        </tr>
                        @foreach($pb['previous_payments'] as $prev)
                            <tr>
                                <td style="padding: 2px 0 2px 12px; color: #64748b; font-size: 11px;">
                                    Ref: {{ $prev['reference'] }} &bull; {{ $prev['paid_at'] }}
                                </td>
                                <td style="padding: 2px 0; text-align: right; font-size: 11px; color: #0f172a;">
                                    &#8358;{{ number_format($prev['amount'] / 100, 2) }}
                                </td>
                            </tr>
                        @endforeach
                    @endif

                    <tr>
                        <td style="padding: 4px 0; color: #64748b;">Current Payment (This Receipt)</td>
                        <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #16a34a;">
                            &#8358;{{ number_format($pb['current_payment_amount'] / 100, 2) }}
                        </td>
                    </tr>

                    <tr style="border-top: 1px dashed #cbd5e1;">
                        <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">Total Cumulative Paid</td>
                        <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">
                            &#8358;{{ number_format($pb['total_paid_to_date'] / 100, 2) }}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 6px 0; font-weight: bold; color: {{ $pb['remaining_balance'] > 0 ? '#b45309' : '#16a34a' }};">
                            Remaining Outstanding Balance
                        </td>
                        <td style="padding: 6px 0; text-align: right; font-weight: bold; color: {{ $pb['remaining_balance'] > 0 ? '#b45309' : '#16a34a' }};">
                            &#8358;{{ number_format($pb['remaining_balance'] / 100, 2) }}
                        </td>
                    </tr>
                </table>
            </div>
        @endif

        <div class="footer" style="margin-top: 30px; text-align: center; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
            Powered by Kontrol
        </div>
    </div>
</body>

</html>
