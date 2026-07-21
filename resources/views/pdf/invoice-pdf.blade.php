<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'DejaVu Sans', sans-serif;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #1f2937;
            background: white;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 50px;
            padding-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
        }

        .logo {
            height: 60px;
            width: 60px;
        }

        .logo img {
            height: 100%;
            width: 100%;
            object-fit: contain;
        }

        .header-right {
            text-align: right;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 5px;
        }

        .invoice-number {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-badge.paid {
            background-color: #d1fae5;
            color: #065f46;
        }

        .status-badge.pending {
            background-color: #dbeafe;
            color: #0c4a6e;
        }

        .status-badge.overdue {
            background-color: #fee2e2;
            color: #7f1d1d;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 50px;
        }

        .detail-section h3 {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            font-weight: 600;
        }

        .detail-section p {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .detail-section .company-name {
            font-size: 16px;
            font-weight: 600;
            color: #111827;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }

        .table thead {
            background-color: #f3f4f6;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
        }

        .table th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .table td {
            padding: 16px 12px;
            font-size: 14px;
            border-bottom: 1px solid #e5e7eb;
        }

        .table tr:last-child td {
            border-bottom: none;
        }

        .table .amount {
            text-align: right;
            font-weight: 500;
        }

        .table .description {
            color: #6b7280;
        }

        .totals {
            width: 100%;
            margin-bottom: 50px;
        }

        .totals-row {
            display: flex;
            justify-content: flex-end;
            padding: 12px 0;
            font-size: 14px;
        }

        .totals-row.total {
            font-size: 16px;
            font-weight: bold;
            color: #111827;
            padding-top: 20px;
            padding-bottom: 20px;
            border-top: 2px solid #e5e7eb;
            border-bottom: 2px solid #e5e7eb;
        }

        .totals-row.total .label {
            margin-right: 40px;
            min-width: 150px;
        }

        .totals-row .label {
            color: #6b7280;
            margin-right: 40px;
            min-width: 150px;
        }

        .totals-row .value {
            text-align: right;
            min-width: 120px;
        }

        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin-bottom: 30px;
            border-radius: 4px;
        }

        .info-box p {
            font-size: 13px;
            color: #374151;
            line-height: 1.6;
        }

        .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
        }

        .dates-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }

        .date-item {
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 6px;
        }

        .date-label {
            font-size: 11px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            font-weight: 600;
        }

        .date-value {
            font-size: 14px;
            color: #111827;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <img src="{{ public_path('assets/images/app-icon.png') }}" alt="Kontrol">
            </div>
            <div class="header-right">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">{{ $invoice->invoice_number }}</div>
                <span class="status-badge {{ $invoice->status }}">{{ $invoice->status }}</span>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="details-grid">
            <div class="detail-section">
                <h3>Bill To</h3>
                @if($invoice->user)
                    <p class="company-name">{{ $invoice->user->name }}</p>
                    <p>{{ $invoice->estate->name }}</p>
                    <p>{{ $invoice->user->email }}</p>
                @else
                    <p class="company-name">{{ $invoice->estate->name }}</p>
                    <p>{{ $invoice->estate->location ?? '' }}</p>
                    <p>{{ $invoice->estate->email ?? '' }}</p>
                @endif
            </div>

            <div class="detail-section">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Date:</strong><br>{{ $invoice->created_at->format('M d, Y') }}</p>
                <p><strong>Billing Period:</strong><br>{{ $invoice->billing_period_start->format('M d, Y') }} - {{ $invoice->billing_period_end->format('M d, Y') }}</p>
            </div>
        </div>

        <!-- Dates Info -->
        <div class="dates-grid">
            <div class="date-item">
                <div class="date-label">Due Date</div>
                <div class="date-value">{{ $invoice->due_date->format('M d, Y') }}</div>
            </div>
            @if(!$invoice->user)
            <div class="date-item">
                <div class="date-label">Residents Billed</div>
                <div class="date-value">{{ $invoice->resident_count }}</div>
            </div>
            @endif
            @if($invoice->paid_at)
            <div class="date-item">
                <div class="date-label">Paid Date</div>
                <div class="date-value">{{ $invoice->paid_at->format('M d, Y') }}</div>
            </div>
            @endif
        </div>

        <!-- Table -->
        <table class="table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        @if($invoice->user)
                            <strong>Resident Subscription</strong>
                        @else
                            <strong>{{ $invoice->plan?->name ?? 'Service' }}</strong>
                        @endif
                        <div class="description">
                            Kontrol Billing for the period of {{ $invoice->billing_period_start->format('M d, Y') }} - {{ $invoice->billing_period_end->format('M d, Y') }}
                        </div>
                    </td>
                    <td class="amount">{{ $invoice->formatted_amount }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-row total">
                <div class="label">Total Amount Due</div>
                <div class="value">{{ $invoice->formatted_amount }}</div>
            </div>
        </div>

        <!-- Info Box -->
        @if(!$invoice->isPaid())
        <div class="info-box">
            <p><strong>Payment Information:</strong> Please settle this invoice by the due date to avoid any service interruptions. Contact our support team if you have any questions about this invoice.</p>
        </div>
        @else
        <div class="info-box">
            <p><strong>Payment Received:</strong> Thank you for your payment. This invoice has been marked as paid on {{ $invoice->paid_at->format('M d, Y') }}.</p>
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>This is an automated invoice generated by Kontrol. For questions or concerns, please contact our support team.</p>
            <p style="margin-top: 8px;">© {{ date('Y') }} Kontrol. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
