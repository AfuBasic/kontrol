<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Http\Controllers\Controller;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\EstateOrganization;
use App\Models\OrganizationBulkInvite;
use App\Services\OrganizationContextService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationBulkInviteController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $status = $request->query('status', 'all');

        $query = OrganizationBulkInvite::where('organization_id', $organization->id)
            ->withCount([
                'recipients',
                'renewals',
                'recipients as sent_recipients_count' => fn ($q) => $q->where('delivery_status', 'sent'),
                'recipients as failed_recipients_count' => fn ($q) => $q->where('delivery_status', 'failed'),
            ])
            ->with(['recipients' => fn ($q) => $q->latest()->limit(5)]);

        if ($status === 'active') {
            $query->where('status', 'active');
        } elseif ($status === 'expired') {
            $query->where('status', 'expired');
        } elseif ($status === 'cancelled') {
            $query->where('status', 'cancelled');
        }

        $bulkInvites = $query->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Organization/BulkInvites/Index', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'bulkInvites' => $bulkInvites,
            'currentStatus' => $status,
        ]);
    }

    public function store(Request $request, CreateBulkVisitorInviteAction $action): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Only organization administrators can create bulk visitor invites.');
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'purpose' => 'nullable|string|max:255',
            'role' => 'nullable|string|max:255',
            'emails' => 'required|array|min:1|max:30',
            'emails.*' => 'required|email|max:255',
            'valid_from' => 'nullable|date|after_or_equal:today',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'auto_renew' => 'boolean',
            'send_immediately' => 'boolean',
        ]);

        $validFrom = ! empty($validated['valid_from']) ? Carbon::parse($validated['valid_from']) : null;
        $validUntil = ! empty($validated['valid_until']) ? Carbon::parse($validated['valid_until']) : null;

        $bulkInvite = $action->execute(
            organization: $organization,
            user: $request->user(),
            emails: $validated['emails'],
            name: $validated['name'] ?? null,
            purpose: $validated['purpose'] ?? null,
            role: $validated['role'] ?? null,
            validFrom: $validFrom,
            validUntil: $validUntil,
            autoRenew: (bool) ($validated['auto_renew'] ?? false),
            sendImmediately: (bool) ($validated['send_immediately'] ?? true),
        );

        $recipientCount = $bulkInvite->recipients->count();

        return back()
            ->with('success', "Bulk visitor invite created successfully with {$recipientCount} recipients.")
            ->with('bulk_invite_created', [
                'id' => $bulkInvite->id,
                'total_recipients' => $recipientCount,
            ]);
    }

    public function show(Request $request, OrganizationBulkInvite $bulkInvite): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if ($bulkInvite->organization_id !== $organization->id) {
            abort(404);
        }

        $bulkInvite->load([
            'recipients.lastAccessCode',
            'renewals' => fn ($q) => $q->latest(),
        ]);

        return Inertia::render('Organization/BulkInvites/Show', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'bulkInvite' => $bulkInvite,
        ]);
    }

    public function renew(Request $request, OrganizationBulkInvite $bulkInvite): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $bulkInvite->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        // Run renewal job immediately for this bulk invite
        RenewBulkVisitorInvitesJob::dispatchSync($bulkInvite->id);

        $bulkInvite->refresh();

        if ($bulkInvite->renewal_blocked_reason) {
            return back()->with('error', "Renewal blocked: {$bulkInvite->renewal_blocked_reason}");
        }

        return back()->with('success', 'Bulk visitor invite renewed successfully.');
    }

    public function cancel(Request $request, OrganizationBulkInvite $bulkInvite): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $bulkInvite->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $bulkInvite->update([
            'status' => 'cancelled',
            'auto_renew' => false,
        ]);

        return back()->with('success', 'Bulk visitor invite cancelled successfully.');
    }

    public function retryFailed(Request $request, OrganizationBulkInvite $bulkInvite): JsonResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $bulkInvite->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        $failedRecipients = $bulkInvite->recipients()
            ->where('delivery_status', 'failed')
            ->whereNotNull('last_access_code_id')
            ->get();

        $count = 0;
        foreach ($failedRecipients as $recipient) {
            $recipient->update([
                'delivery_status' => 'queued',
                'delivery_error' => null,
            ]);

            DeliverBulkVisitorPassJob::dispatch($recipient->last_access_code_id, $recipient->id);
            $count++;
        }

        return response()->json([
            'success' => true,
            'retried_count' => $count,
            'message' => "Queued {$count} failed invite(s) for re-delivery.",
        ]);
    }

    public function deliveryStatus(Request $request, OrganizationBulkInvite $bulkInvite): JsonResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if ($bulkInvite->organization_id !== $organization->id) {
            abort(404);
        }

        $recipients = $bulkInvite->recipients()
            ->select(['id', 'bulk_invite_id', 'email', 'status', 'delivery_status', 'delivery_error', 'last_delivered_at'])
            ->get();

        $summary = [
            'total' => $recipients->count(),
            'pending' => $recipients->where('delivery_status', 'pending')->count(),
            'queued' => $recipients->where('delivery_status', 'queued')->count(),
            'sent' => $recipients->where('delivery_status', 'sent')->count(),
            'failed' => $recipients->where('delivery_status', 'failed')->count(),
        ];

        return response()->json([
            'bulk_invite_id' => $bulkInvite->id,
            'summary' => $summary,
            'recipients' => $recipients,
        ]);
    }
}
