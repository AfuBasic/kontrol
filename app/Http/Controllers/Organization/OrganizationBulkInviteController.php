<?php

namespace App\Http\Controllers\Organization;

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Actions\Organization\RemoveBulkInviteRecipientAction;
use App\Enums\AccessCodeStatus;
use App\Http\Controllers\Controller;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Jobs\RenewBulkVisitorInvitesJob;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Services\Organization\BulkInviteVisitService;
use App\Services\OrganizationContextService;
use App\Services\Visitor\BulkInvitePdfService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\RateLimiter;
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

        $search = $request->string('search')->trim()->toString();
        $status = $request->query('status', 'all');

        $bulkInvites = Inertia::merge(function () use ($organization, $search, $status) {
            $query = OrganizationBulkInvite::where('organization_id', $organization->id)
                ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                ->withCount([
                    'recipients' => fn ($q) => $q->where('status', 'active'),
                    'renewals',
                    'recipients as sent_recipients_count' => fn ($q) => $q->where('status', 'active')->where('delivery_status', 'sent'),
                    'recipients as pending_recipients_count' => fn ($q) => $q->where('status', 'active')->whereIn('delivery_status', ['pending', 'queued']),
                    'recipients as failed_recipients_count' => fn ($q) => $q->where('status', 'active')->where('delivery_status', 'failed'),
                ])
                ->with(['recipients' => fn ($q) => $q->select(['id', 'bulk_invite_id', 'email'])->where('status', 'active')->oldest('id')->limit(3)]);

            if ($status === 'active') {
                $query->where('status', 'active');
            } elseif ($status === 'expired') {
                $query->where('status', 'expired');
            } elseif ($status === 'cancelled') {
                $query->where('status', 'cancelled');
            }

            $now = Carbon::now();
            $paginator = $query->latest()
                ->paginate(15)
                ->withQueryString();

            $defaultPurpose = "{$organization->name} - Visitor Pass";

            return $paginator->through(function (OrganizationBulkInvite $invite) use ($now, $defaultPurpose) {
                $status = $invite->status;
                $validFrom = $invite->valid_from ? Carbon::parse($invite->valid_from)->startOfDay() : null;
                $validUntil = $invite->valid_until ? Carbon::parse($invite->valid_until)->endOfDay() : null;
                $currentYear = $now->year;

                // Derive state
                if ($status === 'cancelled') {
                    $state = 'cancelled';
                } elseif ($validUntil && $now->isAfter($validUntil)) {
                    $state = 'expired';
                } elseif ($validFrom && $now->isBefore($validFrom)) {
                    $state = 'upcoming';
                } else {
                    $daysLeft = $validUntil ? (int) ceil($now->diffInDays($validUntil, false)) : 0;
                    if ($daysLeft <= 3 && ! $invite->auto_renew) {
                        $state = 'expiring';
                    } else {
                        $state = 'active';
                    }
                }

                $formatDateLabel = function (?Carbon $date) use ($currentYear) {
                    if (! $date) {
                        return '';
                    }

                    return $date->year === $currentYear
                        ? $date->isoFormat('D MMM')
                        : $date->isoFormat('D MMM YYYY');
                };

                $startsOnLabel = $formatDateLabel($validFrom);
                $endsOnLabel = $formatDateLabel($validUntil);
                $daysLeft = $validUntil ? max(0, (int) ceil($now->diffInDays($validUntil, false))) : 0;

                // Elapsed ratio (0 to 1)
                $elapsedRatio = 0;
                if ($validFrom && $validUntil && $validUntil->gt($validFrom)) {
                    $totalSecs = $validUntil->diffInSeconds($validFrom);
                    $elapsedSecs = max(0, $now->diffInSeconds($validFrom, false));
                    $elapsedRatio = min(1, max(0, $totalSecs > 0 ? $elapsedSecs / $totalSecs : 0));
                }

                $blockedReasonLabel = match ($invite->renewal_blocked_reason) {
                    'subscription_required' => 'subscription required',
                    'manual_intervention_required' => 'manual review required',
                    default => $invite->renewal_blocked_reason,
                };

                return [
                    'id' => $invite->id,
                    'name' => $invite->name,
                    'purpose' => $invite->purpose,
                    'purpose_label' => filled($invite->purpose) && $invite->purpose !== $defaultPurpose ? $invite->purpose : null,
                    'role' => $invite->role,
                    'valid_from' => $invite->valid_from?->toDateString(),
                    'valid_until' => $invite->valid_until?->toDateString(),
                    'status' => $invite->status,
                    'recipients_count' => (int) $invite->recipients_count,
                    'recipient_preview' => $invite->recipients->pluck('email')->values()->all(),
                    'renewals_count' => (int) $invite->renewals_count,
                    'validity' => [
                        'state' => $state,
                        'starts_on_label' => $startsOnLabel,
                        'ends_on_label' => $endsOnLabel,
                        'days_left' => $daysLeft,
                        'elapsed_ratio' => round($elapsedRatio, 4),
                    ],
                    'renewal' => [
                        'auto' => (bool) $invite->auto_renew,
                        'next_on_label' => $invite->next_renewal_at ? $formatDateLabel(Carbon::parse($invite->next_renewal_at)) : null,
                        'blocked_reason_label' => $blockedReasonLabel,
                    ],
                    'delivery' => [
                        'total' => (int) $invite->recipients_count,
                        'sent' => (int) ($invite->sent_recipients_count ?? 0),
                        'pending' => (int) ($invite->pending_recipients_count ?? 0),
                        'failed' => (int) ($invite->failed_recipients_count ?? 0),
                    ],
                ];
            });
        });

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
            'filters' => [
                'search' => $search,
            ],
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

    public function show(Request $request, OrganizationBulkInvite $bulkInvite, BulkInviteVisitService $visits): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if ($bulkInvite->organization_id !== $organization->id) {
            abort(404);
        }

        $bulkInvite->load([
            'recipients' => fn ($q) => $q->where('status', 'active')->with(['lastAccessCode', 'usablePasses'])->oldest('id'),
            'renewals' => fn ($q) => $q->latest(),
        ]);

        $validFrom = $bulkInvite->valid_from ? Carbon::parse($bulkInvite->valid_from)->startOfDay() : null;
        $validUntil = $bulkInvite->valid_until ? Carbon::parse($bulkInvite->valid_until)->endOfDay() : null;
        $now = Carbon::now();

        $visitStats = $visits->groupStats($bulkInvite, $bulkInvite->recipients);

        $state = match (true) {
            $bulkInvite->status === 'cancelled' => 'cancelled',
            $validUntil !== null && $now->isAfter($validUntil) => 'expired',
            $validFrom !== null && $now->isBefore($validFrom) => 'upcoming',
            default => 'active',
        };

        return Inertia::render('Organization/BulkInvites/Show', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'bulkInvite' => [
                'id' => $bulkInvite->id,
                'name' => $bulkInvite->name,
                'purpose_label' => filled($bulkInvite->purpose) && $bulkInvite->purpose !== "{$organization->name} - Visitor Pass" ? $bulkInvite->purpose : null,
                'role' => $bulkInvite->role,
                'status' => $bulkInvite->status,
                'state' => $state,
                'valid_from_label' => $this->shortDate($validFrom),
                'valid_until_label' => $this->shortDate($validUntil),
                'days_left' => $validUntil ? max(0, (int) ceil($now->diffInDays($validUntil, false))) : 0,
                'elapsed_ratio' => $validFrom && $validUntil && $validUntil->gt($validFrom)
                    ? round(min(1, max(0, $validFrom->diffInSeconds($now, false) / $validFrom->diffInSeconds($validUntil))), 4)
                    : 0,
                'auto_renew' => (bool) $bulkInvite->auto_renew,
                'next_renewal_label' => $bulkInvite->auto_renew && $bulkInvite->next_renewal_at
                    ? $this->shortDate(Carbon::parse($bulkInvite->next_renewal_at))
                    : null,
                'renewal_blocked_reason_label' => match ($bulkInvite->renewal_blocked_reason) {
                    null => null,
                    'subscription_required' => 'Subscription required',
                    'manual_intervention_required' => 'Manual review required',
                    default => ucfirst(str_replace('_', ' ', $bulkInvite->renewal_blocked_reason)),
                },
                'recipients' => $bulkInvite->recipients->map(fn (OrganizationBulkInviteRecipient $recipient) => [
                    'id' => $recipient->id,
                    'email' => $recipient->email,
                    'delivery_status' => $recipient->delivery_status,
                    'delivery_error' => $recipient->delivery_error,
                    'delivered_label' => $this->shortDate($recipient->last_delivered_at ? Carbon::parse($recipient->last_delivered_at) : null),
                    ...$this->currentPassPayload($bulkInvite, $recipient),
                    'can_resend' => $this->isResendable($recipient),
                    'visits_count' => $visitStats['by_recipient'][$recipient->id]['visits'] ?? 0,
                    'last_visit_label' => $visits->recencyLabel($visitStats['by_recipient'][$recipient->id]['last_visit_at'] ?? null),
                ])->values(),
                'visits' => [
                    'total' => $visitStats['total_visits'],
                    'visited_count' => $visitStats['visited_count'],
                    'inside_now' => $visitStats['inside_now'],
                    'last_visit_label' => $visits->recencyLabel($visitStats['last_visit_at']),
                ],
                'renewals' => $bulkInvite->renewals->map(fn ($renewal) => [
                    'id' => $renewal->id,
                    'period_label' => trim($this->shortDate(Carbon::parse($renewal->valid_from)).' – '.$this->shortDate(Carbon::parse($renewal->valid_until)), ' –'),
                    'processed_label' => $this->shortDate($renewal->created_at ? Carbon::parse($renewal->created_at) : null),
                    'status' => $renewal->status,
                    'recipients_renewed' => (int) $renewal->recipients_renewed,
                ])->values(),
            ],
        ]);
    }

    public function removeRecipient(
        Request $request,
        OrganizationBulkInvite $bulkInvite,
        OrganizationBulkInviteRecipient $recipient,
        RemoveBulkInviteRecipientAction $action,
    ): RedirectResponse {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $bulkInvite->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        abort_unless($recipient->bulk_invite_id === $bulkInvite->id, 404);

        $action->execute($recipient);

        return back()->with('success', "{$recipient->email} was removed and their pass no longer works.");
    }

    public function recipientVisits(
        Request $request,
        OrganizationBulkInvite $bulkInvite,
        OrganizationBulkInviteRecipient $recipient,
        BulkInviteVisitService $visits,
    ): JsonResponse {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();

        abort_unless(
            $bulkInvite->organization_id === $organization->id && $recipient->bulk_invite_id === $bulkInvite->id,
            404
        );

        $page = $visits->recipientVisits($recipient);

        return response()->json([
            'data' => collect($page->items())->map(function (AccessLog $log) {
                $enteredAt = $log->verified_at;
                $leftAt = $log->checked_out_at;

                return [
                    'id' => $log->id,
                    'day_label' => $enteredAt->isToday()
                        ? 'Today'
                        : ($enteredAt->isYesterday()
                            ? 'Yesterday'
                            : $enteredAt->isoFormat($enteredAt->year === now()->year ? 'ddd D MMM' : 'ddd D MMM YYYY')),
                    'entered_at_label' => $enteredAt->isoFormat('h:mm A'),
                    'left_at_label' => $leftAt?->isoFormat('h:mm A'),
                    'left_another_day' => $leftAt !== null && ! $leftAt->isSameDay($enteredAt),
                    'entry_point' => $log->entry_point,
                    // Check-out gate lives in meta (access_logs has no exit_point column).
                    'exit_point' => $leftAt ? ($log->meta['exit_point'] ?? null) : null,
                    'is_inside' => $leftAt === null && $enteredAt->isToday(),
                ];
            })->values(),
            'next_cursor' => $page->nextCursor()?->encode(),
        ]);
    }

    public function resendRecipient(
        Request $request,
        OrganizationBulkInvite $bulkInvite,
        OrganizationBulkInviteRecipient $recipient,
    ): RedirectResponse {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $bulkInvite->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        abort_unless($recipient->bulk_invite_id === $bulkInvite->id && $recipient->status === 'active', 404);

        if (! $this->isResendable($recipient)) {
            return back()->with('error', 'This pass is no longer valid. Renew the group to issue a new one.');
        }

        // Each resend is a slow external email call; cap it so a repeated tap can't flood an inbox.
        $limiterKey = "bulk-pass-resend:{$recipient->id}";
        if (RateLimiter::tooManyAttempts($limiterKey, 3)) {
            $minutes = (int) ceil(RateLimiter::availableIn($limiterKey) / 60);

            return back()->with('error', "This pass was resent recently. Try again in {$minutes} min.");
        }
        RateLimiter::hit($limiterKey, 600);

        $recipient->update([
            'delivery_status' => 'queued',
            'delivery_error' => null,
        ]);

        DeliverBulkVisitorPassJob::dispatch($recipient->last_access_code_id, $recipient->id);

        return back()->with('success', "Pass resent to {$recipient->email}.");
    }

    /**
     * A pass can be resent only while its current code can still open the gate.
     */
    private function isResendable(OrganizationBulkInviteRecipient $recipient): bool
    {
        $code = $recipient->lastAccessCode;

        return $recipient->status === 'active'
            && $code !== null
            && in_array($code->status, [AccessCodeStatus::Active, AccessCodeStatus::Scheduled], true)
            && ($code->expires_at === null || $code->expires_at->isFuture());
    }

    public function recipientQr(
        Request $request,
        OrganizationBulkInvite $bulkInvite,
        OrganizationBulkInviteRecipient $recipient,
        BulkInvitePdfService $qr,
    ): HttpResponse {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();

        abort_unless(
            $bulkInvite->organization_id === $organization->id
                && $recipient->bulk_invite_id === $bulkInvite->id
                && $recipient->status === 'active',
            404
        );

        $pass = $recipient->currentPass();
        abort_if($pass === null, 404);

        // The QR is a working gate credential: never cache it in shared caches.
        return response($qr->generateQrPng($pass->gateQrPayload()), 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * The pass shown for a recipient: the one valid today, else the next one to start.
     *
     * @return array{code: string|null, pass_uuid: string|null, pass_valid_label: string|null, pass_starts_later: bool, pass_starts_at: string|null, pass_expires_at: string|null, qr_url: string|null}
     */
    private function currentPassPayload(OrganizationBulkInvite $bulkInvite, OrganizationBulkInviteRecipient $recipient): array
    {
        $pass = $recipient->currentPass();

        if (! $pass) {
            return [
                'code' => $recipient->lastAccessCode?->code,
                'pass_uuid' => $recipient->lastAccessCode?->pass_uuid,
                'pass_valid_label' => null,
                'pass_starts_later' => false,
                'pass_starts_at' => null,
                'pass_expires_at' => null,
                'qr_url' => null,
            ];
        }

        $startsAt = $pass->starts_at ? Carbon::parse($pass->starts_at) : null;
        $expiresAt = $pass->expires_at ? Carbon::parse($pass->expires_at) : null;

        return [
            'code' => $pass->code,
            'pass_uuid' => $pass->pass_uuid,
            'pass_valid_label' => $startsAt && $expiresAt
                ? $this->shortDate($startsAt).' – '.$this->shortDate($expiresAt)
                : ($expiresAt ? 'Until '.$this->shortDate($expiresAt) : null),
            'pass_starts_later' => $startsAt !== null && $startsAt->isFuture(),
            'pass_starts_at' => $startsAt?->toISOString(),
            'pass_expires_at' => $expiresAt?->toISOString(),
            'qr_url' => route('org.bulk-invites.recipients.qr', [$bulkInvite, $recipient]),
        ];
    }

    /**
     * Human date for mobile: "16 Oct", with the year only when it differs from now.
     */
    private function shortDate(?Carbon $date): string
    {
        if (! $date) {
            return '';
        }

        return $date->year === now()->year ? $date->isoFormat('D MMM') : $date->isoFormat('D MMM YYYY');
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
            ->where('status', 'active')
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
