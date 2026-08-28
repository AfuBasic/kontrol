<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>{{ $invoice->isPaid() ? 'Receipt' : 'Invoice' }} #{{ $invoice->invoice_number }}</title>
    <style>
        @page {
            size: a4 portrait;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            font-family: 'DejaVu Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.4;
            padding: 42px 42px 32px 42px;
        }

        /* Layout Grid via Table for 100% reliable Dompdf rendering */
        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
        }

        /* Header */
        .header-table {
            margin-bottom: 24px;
            padding-bottom: 18px;
            border-bottom: 1px solid #e2e8f0;
        }

        .header-table td {
            vertical-align: top;
        }

        .logo-img {
            height: 28px;
            width: auto;
            display: block;
            margin-bottom: 4px;
        }

        .doc-descriptor {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            letter-spacing: 0.02em;
        }

        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 4px;
        }

        .status-badge.paid {
            background-color: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }

        .status-badge.pending {
            background-color: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
        }

        .status-badge.overdue {
            background-color: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
        }

        .status-badge.cancelled {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        .doc-number {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.01em;
        }

        /* Information Columns (Bill To & Invoice Details) */
        .info-table {
            margin-bottom: 20px;
        }

        .info-table td {
            vertical-align: top;
            width: 50%;
        }

        .section-label {
            font-size: 9px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 6px;
        }

        .bill-to-name {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .bill-to-sub {
            font-size: 11px;
            color: #475569;
            line-height: 1.35;
        }

        .meta-table td {
            padding: 2px 0;
            font-size: 11px;
            vertical-align: top;
        }

        .meta-label {
            color: #64748b;
            font-weight: 500;
            width: 95px;
        }

        .meta-value {
            color: #0f172a;
            font-weight: 600;
        }

        /* Date Summary Panel */
        .dates-panel {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 22px;
            padding: 11px 16px;
        }

        .dates-panel td {
            vertical-align: middle;
        }

        .date-cell-label {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
        }

        .date-cell-value {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
        }

        /* Line Items Table */
        .items-table {
            margin-bottom: 16px;
        }

        .items-table th {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 8px 10px;
            background-color: #f1f5f9;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
        }

        .items-table th.amount-col {
            text-align: right;
        }

        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .item-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 2px;
        }

        .item-desc {
            font-size: 11px;
            color: #64748b;
        }

        .item-amount {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            text-align: right;
            white-space: nowrap;
        }

        /* Financial Breakdown & Totals */
        .summary-table {
            margin-bottom: 20px;
        }

        .summary-table td {
            vertical-align: top;
        }

        .totals-box {
            width: 270px;
            margin-left: auto;
        }

        .totals-table td {
            padding: 3px 0;
            font-size: 11px;
        }

        .totals-table .t-label {
            color: #64748b;
            text-align: left;
        }

        .totals-table .t-value {
            color: #0f172a;
            font-weight: 600;
            text-align: right;
            white-space: nowrap;
        }

        .totals-table .discount-row td {
            color: #047857;
            font-weight: 600;
        }

        .total-final-row td {
            padding-top: 8px;
            padding-bottom: 4px;
            border-top: 1.5px solid #0f172a;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
        }

        .total-final-row .t-value {
            font-size: 13px;
            font-weight: 800;
        }

        /* Payment Confirmation Box */
        .payment-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 11px 16px;
            margin-bottom: 22px;
        }

        .payment-box.unpaid {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
        }

        .payment-title {
            font-size: 11px;
            font-weight: 700;
            color: #15803d;
            margin-bottom: 2px;
        }

        .payment-title.unpaid {
            color: #334155;
        }

        .payment-desc {
            font-size: 11px;
            color: #166534;
            line-height: 1.35;
        }

        .payment-desc.unpaid {
            color: #64748b;
        }

        /* Footer & Support */
        .footer-divider {
            height: 1px;
            background-color: #e2e8f0;
            margin-bottom: 12px;
        }

        .support-table {
            font-size: 10px;
            color: #64748b;
            line-height: 1.4;
        }

        .support-table td {
            vertical-align: top;
        }

        .support-table a {
            color: #4f46e5;
            text-decoration: none;
        }

        .copyright-text {
            text-align: right;
            color: #94a3b8;
            font-size: 9px;
        }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('assets/images/kontrol-logo-horizontal.png');
        $logoBase64 = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;

        $metadata = $invoice->metadata ?? [];
        $subtotalKobo = $metadata['subtotal'] ?? null;
        $discountKobo = $metadata['discount_amount'] ?? null;
        $couponCode = $metadata['coupon_code'] ?? null;

        // Extract payment method from finalized transaction if recorded
        $latestTx = $invoice->paymentTransactions->firstWhere('status', 'success');
        $paymentMethodLabel = null;
        if ($latestTx && $latestTx->payment_method) {
            $paymentMethodLabel = match (strtolower($latestTx->payment_method)) {
                'card' => 'Card Payment',
                'bank_transfer', 'transfer' => 'Bank Transfer',
                'ussd' => 'USSD',
                default => ucfirst(str_replace('_', ' ', $latestTx->payment_method)),
            };
        }
    @endphp

    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Kontrol" class="logo-img">
                @else
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">KONTROL</div>
                @endif
                <div class="doc-descriptor">
                    {{ $invoice->isPaid() ? 'Subscription Receipt' : 'Subscription Invoice' }}
                </div>
            </td>
            <td style="width: 45%; text-align: right;">
                <span class="status-badge {{ $invoice->status }}">{{ $invoice->status }}</span>
                <div class="doc-number">#{{ $invoice->invoice_number }}</div>
            </td>
        </tr>
    </table>

    <!-- Information Columns: Bill To & Invoice Details -->
    <table class="info-table">
        <tr>
            <!-- Left: Bill To -->
            <td>
                <div class="section-label">Bill To</div>
                @if($invoice->user)
                    <div class="bill-to-name">{{ $invoice->user->name }}</div>
                    <div class="bill-to-sub">{{ $invoice->estate->name }}</div>
                    <div class="bill-to-sub">{{ $invoice->user->email }}</div>
                @else
                    <div class="bill-to-name">{{ $invoice->estate->name }}</div>
                    @if($invoice->estate->location)
                        <div class="bill-to-sub">{{ $invoice->estate->location }}</div>
                    @endif
                    @if($invoice->estate->email)
                        <div class="bill-to-sub">{{ $invoice->estate->email }}</div>
                    @endif
                @endif
            </td>

            <!-- Right: Invoice Details -->
            <td style="padding-left: 20px;">
                <div class="section-label">Invoice Details</div>
                <table class="meta-table">
                    <tr>
                        <td class="meta-label">Invoice Date:</td>
                        <td class="meta-value">{{ $invoice->created_at->format('M d, Y') }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">Billing Period:</td>
                        <td class="meta-value">{{ $invoice->billing_period_start->format('M d, Y') }} – {{ $invoice->billing_period_end->format('M d, Y') }}</td>
                    </tr>
                    @if(!$invoice->user && $invoice->resident_count)
                    <tr>
                        <td class="meta-label">Residents Billed:</td>
                        <td class="meta-value">{{ $invoice->resident_count }}</td>
                    </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <!-- Dates Summary Panel -->
    <div class="dates-panel">
        <table>
            <tr>
                <td style="width: 33.33%;">
                    <div class="date-cell-label">Due Date</div>
                    <div class="date-cell-value">{{ $invoice->due_date->format('M d, Y') }}</div>
                </td>
                @if($invoice->paid_at)
                <td style="width: 33.33%;">
                    <div class="date-cell-label">Paid Date</div>
                    <div class="date-cell-value">{{ $invoice->paid_at->format('M d, Y') }}</div>
                </td>
                @endif
                @if($paymentMethodLabel)
                <td style="width: 33.33%; text-align: right;">
                    <div class="date-cell-label">Payment Method</div>
                    <div class="date-cell-value">{{ $paymentMethodLabel }}</div>
                </td>
                @endif
            </tr>
        </table>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th class="amount-col" style="width: 140px;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="item-title">
                        @if($invoice->user)
                            Resident Subscription
                        @else
                            {{ $invoice->plan?->name ?? 'Estate Subscription' }}
                        @endif
                    </div>
                    <div class="item-desc">
                        Kontrol Billing for {{ $invoice->billing_period_start->format('M d, Y') }} – {{ $invoice->billing_period_end->format('M d, Y') }}
                    </div>
                </td>
                <td class="item-amount">
                    @if($subtotalKobo && $subtotalKobo > 0 && $discountKobo && $discountKobo > 0)
                        ₦{{ number_format($subtotalKobo / 100, 2) }}
                    @else
                        {{ $invoice->formatted_amount }}
                    @endif
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Financial Breakdown & Totals -->
    <table class="summary-table">
        <tr>
            <td style="width: 50%;">
                <!-- Left empty space -->
            </td>
            <td style="width: 50%;">
                <div class="totals-box">
                    <table class="totals-table">
                        @if($subtotalKobo && $discountKobo && $discountKobo > 0)
                            <tr>
                                <td class="t-label">Subtotal</td>
                                <td class="t-value">₦{{ number_format($subtotalKobo / 100, 2) }}</td>
                            </tr>
                            <tr class="discount-row">
                                <td class="t-label">
                                    Discount{{ $couponCode ? " ($couponCode)" : '' }}
                                </td>
                                <td class="t-value">−₦{{ number_format($discountKobo / 100, 2) }}</td>
                            </tr>
                        @endif
                        <tr class="total-final-row">
                            <td class="t-label">{{ $invoice->isPaid() ? 'Total Paid' : 'Total Amount Due' }}</td>
                            <td class="t-value">{{ $invoice->formatted_amount }}</td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <!-- Payment Confirmation or Instructions -->
    @if($invoice->isPaid())
        <div class="payment-box">
            <div class="payment-title">✓ Payment Received</div>
            <div class="payment-desc">
                Thank you for your payment. This invoice was successfully paid on {{ $invoice->paid_at ? $invoice->paid_at->format('M d, Y') : ($invoice->updated_at ? $invoice->updated_at->format('M d, Y') : now()->format('M d, Y')) }}.
            </div>
        </div>
    @else
        <div class="payment-box unpaid">
            <div class="payment-title unpaid">Payment Instructions</div>
            <div class="payment-desc unpaid">
                Please settle this invoice by {{ $invoice->due_date->format('M d, Y') }} to maintain uninterrupted access.
            </div>
        </div>
    @endif

    <!-- Footer & Support Information -->
    <div class="footer-divider"></div>
    <table class="support-table">
        <tr>
            <td style="width: 60%;">
                <div style="font-weight: 600; color: #334155; margin-bottom: 2px;">Questions about this receipt?</div>
                <div>Email: <a href="mailto:support@usekontrol.com">support@usekontrol.com</a> · WhatsApp / Phone: +234 703 648 1189</div>
            </td>
            <td style="width: 40%; text-align: right;" class="copyright-text">
                <div>Automated Kontrol billing document.</div>
                <div>© {{ date('Y') }} Kontrol. All rights reserved.</div>
            </td>
        </tr>
    </table>
</body>
</html>
