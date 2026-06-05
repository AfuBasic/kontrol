@extends('mail.layout')

@section('content')
    @if(isset($isPropertyOwner) && $isPropertyOwner)
        <div class="badge" style="background-color: #fef2f2; color: #991b1b;">House Bill Reminder</div>
    @else
        <div class="badge" style="background-color: #fef2f2; color: #991b1b;">Payment Reminder</div>
    @endif
    <h1>{{ $assignment->collection->name }}</h1>

    <p>Hello <span class="bold">{{ $assignment->user->name }}</span>,</p>

    @if(isset($isPropertyOwner) && $isPropertyOwner)
        <p>This is a reminder regarding your pending payment for <span class="bold">{{ $assignment->collection->name }}</span> set up by your property owner, <span class="bold">{{ $ownerName }}</span>, for your house @if(isset($propertyName) && $propertyName)<span class="bold">({{ $propertyName }})</span>@endif. Please note that this is a private bill from your property owner/house, not from the estate administration.</p>
    @else
        <p>This is a reminder regarding your pending payment for <span class="bold">{{ $assignment->collection->name }}</span> at <span class="bold">{{ $assignment->estate->name }}</span>.</p>
    @endif

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%;">
            @if($assignment->amount_paid > 0)
            <tr>
                <td style="padding: 8px 0; color: #475569;">Total Expected</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ \Illuminate\Support\Number::currency($assignment->amount_due, 'NGN') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #10b981;">Amount Paid</td>
                <td style="padding: 8px 0; text-align: right; color: #10b981;" class="bold">{{ \Illuminate\Support\Number::currency($assignment->amount_paid, 'NGN') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Outstanding Balance</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ \Illuminate\Support\Number::currency($assignment->amount_due - $assignment->amount_paid, 'NGN') }}</td>
            </tr>
            @else
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Due</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ \Illuminate\Support\Number::currency($assignment->amount_due, 'NGN') }}</td>
            </tr>
            @endif
            <tr>
                <td style="padding: 8px 0; color: #475569;">Due Date</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $assignment->due_date->format('M d, Y') }}</td>
            </tr>
            @if($assignment->isOverdue())
            <tr>
                <td style="padding: 8px 0; color: #991b1b;">Status</td>
                <td style="padding: 8px 0; text-align: right; color: #991b1b;" class="bold">Overdue</td>
            </tr>
            @endif
        </table>
    </div>

    <p>Please ensure payment is made promptly to maintain access to estate services. You can view and pay this collection by clicking the button below:</p>

    <div class="button-container">
        <a href="{{ route('resident.collections.show', $assignment->ulid) }}" class="button shadow" style="background-color: #4f46e5; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3);">Pay Now</a>
    </div>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">If you have already made this payment, please disregard this message.</p>
@endsection
