<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\ApproveEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
use App\Notifications\Partner\EstateRequestRejectedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Partner-sourced applications (legacy routes preserved for Zeus UI).
 * Data lives on estate_applications with source=partner.
 */
class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');

        $partnerRequests = EstateApplication::query()
            ->where('source', EstateApplication::SOURCE_PARTNER)
            ->with(['partner', 'estate:id,ulid,name'])
            ->when($status, function ($query) use ($status) {
                $mapped = match ($status) {
                    'submitted' => ['received', 'pending', 'under_review', 'info_requested'],
                    'accepted' => ['approved'],
                    'rejected' => ['rejected'],
                    default => [$status],
                };

                $query->whereIn('status', $mapped);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (EstateApplication $application) => [
                'id' => $application->id,
                'estate_name' => $application->estate_name,
                'chairman_name' => $application->contact_name,
                'chairman_email' => $application->email,
                'chairman_phone' => $application->phone,
                'status' => $application->partnerStatusKey(),
                'number_of_houses' => $application->number_of_houses,
                'state' => $application->state,
                'lga' => $application->lga,
                'notes' => $application->notes,
                'rejection_reason' => $application->rejection_reason,
                'info_request_message' => $application->info_request_message,
                'created_at' => $application->created_at?->toIso8601String(),
                'partner' => $application->partner ? [
                    'id' => $application->partner->id,
                    'name' => $application->partner->name,
                    'commission_rate' => (string) $application->partner->commission_rate,
                ] : null,
                'estate' => $application->estate ? [
                    'id' => $application->estate->id,
                    'ulid' => $application->estate->ulid,
                    'name' => $application->estate->name,
                ] : null,
            ]);

        return Inertia::render('Zeus/PartnerRequests/Index', [
            'partnerRequests' => $partnerRequests,
            'filters' => [
                'status' => $status ?? '',
            ],
            'statusOptions' => [
                ['value' => 'submitted', 'label' => 'Submitted'],
                ['value' => 'accepted', 'label' => 'Accepted'],
                ['value' => 'rejected', 'label' => 'Rejected'],
            ],
        ]);
    }

    public function approve(EstateApplication $partnerRequest, ApproveEstateApplicationAction $action): RedirectResponse
    {
        abort_unless(
            $partnerRequest->source === EstateApplication::SOURCE_PARTNER,
            404
        );

        abort_unless(
            in_array($partnerRequest->status, ['received', 'pending', 'under_review', 'info_requested'], true),
            422,
            'This partner request cannot be approved in its current status.'
        );

        $action->execute($partnerRequest);

        Cache::forget('zeus.applications.metrics');
        Cache::forget('zeus.applications.funnel');

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Partner request approved and estate creation initiated.');
    }

    public function reject(Request $request, EstateApplication $partnerRequest): RedirectResponse
    {
        abort_unless($partnerRequest->source === EstateApplication::SOURCE_PARTNER, 404);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $partnerRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_at' => now(),
        ]);

        // Notify partner members via email + in-app
        if ($partnerRequest->partner) {
            $partnerMembers = $partnerRequest->partner->members;
            foreach ($partnerMembers as $member) {
                $member->notify(new EstateRequestRejectedNotification($partnerRequest, $validated['rejection_reason']));
            }
        }

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Partner request rejected.');
    }

    public function requestInfo(Request $request, EstateApplication $partnerRequest): RedirectResponse
    {
        abort_unless($partnerRequest->source === EstateApplication::SOURCE_PARTNER, 404);

        $validated = $request->validate([
            'info_request_message' => ['required', 'string', 'max:1000'],
        ]);

        $partnerRequest->update([
            'status' => 'info_requested',
            'info_request_message' => $validated['info_request_message'],
            'reviewed_at' => now(),
        ]);

        return redirect()
            ->route('zeus.partner-requests.index')
            ->with('success', 'Information requested from partner.');
    }
}
