<?php

namespace App\Http\Controllers\Zeus;

use App\Enums\PartnerRequestStatus;
use App\Http\Controllers\Controller;
use App\Jobs\CreateEstateFromPartnerRequestJob;
use App\Models\PartnerRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');

        $partnerRequests = PartnerRequest::query()
            ->with(['partner', 'estate:id,ulid,name'])
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Zeus/PartnerRequests/Index', [
            'partnerRequests' => $partnerRequests,
            'filters' => [
                'status' => $status ?? '',
            ],
            'statusOptions' => collect(PartnerRequestStatus::cases())
                ->map(fn (PartnerRequestStatus $status) => [
                    'value' => $status->value,
                    'label' => $status->label(),
                ])
                ->values(),
        ]);
    }

    public function approve(PartnerRequest $partnerRequest): RedirectResponse
    {
        abort_unless(
            in_array($partnerRequest->status, [PartnerRequestStatus::Submitted, PartnerRequestStatus::Reviewing, PartnerRequestStatus::InfoRequested], true),
            422,
            'This partner request cannot be approved in its current status.'
        );

        $partnerRequest->update(['status' => PartnerRequestStatus::Approved]);

        CreateEstateFromPartnerRequestJob::dispatchSync($partnerRequest);

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Partner request approved and estate creation initiated.');
    }

    public function reject(Request $request, PartnerRequest $partnerRequest): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $partnerRequest->update([
            'status' => PartnerRequestStatus::Rejected,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Partner request rejected.');
    }

    public function requestInfo(Request $request, PartnerRequest $partnerRequest): RedirectResponse
    {
        $validated = $request->validate([
            'info_request_message' => ['required', 'string', 'max:1000'],
        ]);

        $partnerRequest->update([
            'status' => PartnerRequestStatus::InfoRequested,
            'info_request_message' => $validated['info_request_message'],
        ]);

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Additional information requested from partner.');
    }
}
