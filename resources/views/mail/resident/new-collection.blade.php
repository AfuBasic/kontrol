@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #e0f2fe; color: #0369a1;">New Collection</div>
    <h1>{{ $assignment->collection->name }}</h1>

    <p>Hello <span class="bold">{{ $assignment->user->name }}</span>,</p>

    <p>A new payment collection <span class="bold">{{ $assignment->collection->name }}</span> has been set up at <span
            class="bold">{{ $assignment->estate->name }}</span>.</p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%;">
            <tr>
                <td style="padding: 8px 0; color: #475569;">Amount Due</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">
                    {{ \Illuminate\Support\Number::currency($assignment->amount_due, 'NGN') }}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #475569;">Due Date</td>
                <td style="padding: 8px 0; text-align: right;" class="bold">{{ $assignment->due_date->format('M d, Y') }}
                </td>
            </tr>
        </table>
    </div>

    @if($assignment->collection->description)
        <p style="color: #475569; font-style: italic;">{{ $assignment->collection->description }}</p>
    @endif

    <p>Please log in to your mobile app to see details and complete your payment:</p>

    <div class="button-container">
        <a href="{{ url('/resident/billing') }}" class="button shadow"
            style="background-color: #0a3d91; box-shadow: 0 4px 14px 0 rgba(10, 61, 145, 0.3);">View & Pay</a>
    </div>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">Secure estate billing powered by Kontrol.</p>
@endsection
