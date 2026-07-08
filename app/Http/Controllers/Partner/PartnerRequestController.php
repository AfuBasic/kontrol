<?php

namespace App\Http\Controllers\Partner;

use App\Enums\PartnerRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequestRequest;
use App\Models\PartnerRequest;
use App\Models\ZeusNotification;
use App\Notifications\Zeus\PartnerEstateRequestSubmittedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $partnerId = $request->user()->partner_id;

        $partnerRequests = PartnerRequest::query()
            ->when($partnerId, fn ($query) => $query->where('partner_id', $partnerId))
            ->when(! $partnerId, fn ($query) => $query->whereRaw('1 = 0'))
            ->with('estate:id,ulid,name,status')
            ->latest()
            ->get()
            ->map(fn (PartnerRequest $partnerRequest) => $this->transformRequest($partnerRequest))
            ->values();

        $columns = collect(PartnerRequestStatus::cases())
            ->map(fn (PartnerRequestStatus $status) => [
                'key' => $status->value,
                'label' => $status->label(),
            ])
            ->values()
            ->all();

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $partnerRequests,
            'columns' => $columns,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $partner = $request->user()->partner;

        return Inertia::render('Partner/PartnerEstate', [
            'partner' => $partner ? [
                'id' => $partner->id,
                'name' => $partner->name,
                'commission_rate' => $partner->commission_rate !== null
                    ? (string) $partner->commission_rate
                    : null,
                'commission_type' => $partner->commission_type,
            ] : null,
        ]);
    }

    public function store(StorePartnerRequestRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->partner_id, 403, 'Your account is not linked to a partner organization.');

        $partnerRequest = PartnerRequest::create([
            ...$request->validated(),
            'partner_id' => $user->partner_id,
            'status' => PartnerRequestStatus::Submitted,
        ]);

        $partnerRequest->loadMissing('partner');
        $partnerName = $partnerRequest->partner?->name ?? 'A partner';

        ZeusNotification::notify(
            type: 'partner_estate_request',
            title: 'New partner estate request',
            body: "{$partnerName} submitted {$partnerRequest->estate_name} for review.",
            actionUrl: route('zeus.partner-requests.index'),
            data: [
                'partner_request_id' => $partnerRequest->id,
                'partner_id' => $partnerRequest->partner_id,
                'estate_name' => $partnerRequest->estate_name,
            ],
        );

        $zeusInbox = config('zeus.notification_email');

        if (filled($zeusInbox)) {
            Notification::route('mail', $zeusInbox)
                ->notify(new PartnerEstateRequestSubmittedNotification($partnerRequest));
        }

        return redirect()
            ->route('partner.partner-requests.index')
            ->with('success', 'Partner request submitted successfully. Our team will review it shortly.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformRequest(PartnerRequest $partnerRequest): array
    {
        $status = $partnerRequest->status instanceof PartnerRequestStatus
            ? $partnerRequest->status
            : PartnerRequestStatus::tryFrom((string) $partnerRequest->status);

        return [
            'id' => $partnerRequest->id,
            'estate_name' => $partnerRequest->estate_name,
            'estate_address' => $partnerRequest->estate_address,
            'chairman_name' => $partnerRequest->chairman_name,
            'chairman_email' => $partnerRequest->chairman_email,
            'chairman_phone' => $partnerRequest->chairman_phone,
            'number_of_houses' => $partnerRequest->number_of_houses,
            'state' => $partnerRequest->state,
            'lga' => $partnerRequest->lga,
            'notes' => $partnerRequest->notes,
            'status' => $status?->value ?? (string) $partnerRequest->status,
            'status_label' => $status?->label() ?? str_replace('_', ' ', (string) $partnerRequest->status),
            'rejection_reason' => $partnerRequest->rejection_reason,
            'info_request_message' => $partnerRequest->info_request_message,
            'created_at' => $partnerRequest->created_at?->toIso8601String(),
            'updated_at' => $partnerRequest->updated_at?->toIso8601String(),
            'estate' => $partnerRequest->estate ? [
                'ulid' => $partnerRequest->estate->ulid,
                'name' => $partnerRequest->estate->name,
                'status' => $partnerRequest->estate->status,
            ] : null,
        ];
    }
}
