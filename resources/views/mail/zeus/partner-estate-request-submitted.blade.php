@extends('mail.layout')

@section('content')
    <div class="badge" style="background-color: #eff6ff; color: #1d4ed8;">Partner Pipeline</div>
    <h1>New estate request</h1>

    <p>Hello Zeus,</p>

    <p>
        <span class="bold">{{ $partnerName }}</span> submitted a new estate referral for review.
    </p>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0; border: 1px solid #e2e8f0;">
        <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Estate</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $estateName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Partner</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $partnerName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Contact person</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $contactName }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Contact email</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $contactEmail }}</td>
            </tr>
            <tr>
                <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Contact phone</td>
                <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">{{ $contactPhone }}</td>
            </tr>
            @if ($state || $lga)
                <tr>
                    <td style="padding-bottom: 12px; color: #64748b; font-size: 14px;">Location</td>
                    <td style="padding-bottom: 12px; color: #0f172a; font-weight: 600; text-align: right;">
                        {{ collect([$lga, $state])->filter()->implode(', ') }}
                    </td>
                </tr>
            @endif
            @if ($numberOfHouses)
                <tr>
                    <td style="color: #64748b; font-size: 14px;">Houses</td>
                    <td style="color: #0f172a; font-weight: 600; text-align: right;">{{ $numberOfHouses }}</td>
                </tr>
            @endif
        </table>
    </div>

    <div class="button-container">
        <a href="{{ $url }}" class="button shadow" style="background-color: #1e293b; box-shadow: 0 4px 14px 0 rgba(30, 41, 59, 0.3);">
            Review in Zeus
        </a>
    </div>

    <div class="divider"></div>

    <p style="font-size: 14px; color: #64748b;">This alert was sent automatically when a partner submitted an estate request.</p>
@endsection
