<?php

namespace App\Http\Controllers\Partner;

use App\Actions\Public\StoreEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequestRequest;
use App\Models\ApplicationNote;
use App\Models\ApplicationTimeline;
use App\Models\CommissionableRevenue;
use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $partnerId = $request->user()->partner_id;
        $partner = $request->user()->partner;
        $tab = $request->string('tab')->toString();
        if (! in_array($tab, ['estates', 'referrals'], true)) {
            // Legacy alias
            if ($tab === 'requests') {
                $tab = 'referrals';
            } else {
                $tab = 'estates';
            }
        }

        $referrals = EstateApplication::query()
            ->when($partnerId, fn ($query) => $query->forPartner($partnerId))
            ->when(! $partnerId, fn ($query) => $query->whereRaw('1 = 0'))
            ->with([
                'estate:id,ulid,name,status',
                'assignedTo:id,name',
                'timelineEvents' => fn ($query) => $query->latest(),
                'notesList' => fn ($query) => $query->latest(),
            ])
            ->latest()
            ->get()
            ->map(fn (EstateApplication $application) => $this->transformReferral($application))
            ->values();

        $estates = collect();
        if ($partnerId) {
            $estates = Estate::query()
                ->where('partner_id', $partnerId)
                ->with(['residentSubscriptions' => fn ($q) => $q->select('id', 'estate_id', 'status', 'user_id', 'created_at')])
                ->latest()
                ->get()
                ->map(fn (Estate $estate) => $this->transformEstateForPartner($estate, $partnerId))
                ->values();
        }

        $portfolio = $this->buildPortfolioSummary($estates, $partnerId);

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $referrals,
            'referrals' => $referrals,
            'estates' => $estates,
            'portfolio' => $portfolio,
            'activeTab' => $tab,
            'columns' => [
                ['key' => 'submitted', 'label' => 'Submitted'],
                ['key' => 'under_review', 'label' => 'Under Review'],
                ['key' => 'info_requested', 'label' => 'Info Requested'],
                ['key' => 'accepted', 'label' => 'Approved'],
                ['key' => 'rejected', 'label' => 'Rejected'],
            ],
            'commission' => [
                'rate' => $partner?->commission_rate !== null ? (string) $partner->commission_rate : null,
                'type' => $partner?->commission_type,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'tab' => $tab,
            ],
            'statusOptions' => [
                ['value' => '', 'label' => 'All'],
                ['value' => 'active', 'label' => 'Active'],
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'under_review', 'label' => 'Under Review'],
                ['value' => 'suspended', 'label' => 'Suspended'],
                ['value' => 'archived', 'label' => 'Archived'],
            ],
        ]);
    }

    public function showEstate(Request $request, Estate $estate): Response
    {
        $partnerId = $request->user()->partner_id;
        abort_unless($partnerId && (int) $estate->partner_id === (int) $partnerId, 404);

        $estate->load(['residentSubscriptions']);
        $payload = $this->transformEstateForPartner($estate, $partnerId);

        $recentResidents = $estate->users()
            ->wherePivot('status', 'accepted')
            ->wherePivot('created_at', '>=', now()->subDays(30))
            ->orderByPivot('created_at', 'desc')
            ->limit(8)
            ->get(['users.id', 'users.name', 'users.email'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'joined_at' => $user->pivot->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        $monthlySeries = CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->get(['created_at', 'revenue_amount', 'commission_amount'])
            ->groupBy(fn (CommissionableRevenue $row) => $row->created_at?->format('Y-m') ?? 'unknown')
            ->map(fn ($rows, $month) => [
                'month' => (string) $month,
                'revenue_kobo' => (int) $rows->sum('revenue_amount'),
                'commission_kobo' => (int) $rows->sum('commission_amount'),
            ])
            ->sortKeys()
            ->values()
            ->all();

        $application = EstateApplication::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->with(['timelineEvents' => fn ($q) => $q->latest(), 'assignedTo:id,name'])
            ->latest()
            ->first();

        $timeline = $application
            ? $this->transformReferral($application)['timeline']
            : [[
                'id' => 'live',
                'event_type' => 'activated',
                'description' => 'Estate connected to your partnership',
                'creator_name' => 'Kontrol',
                'created_at' => $estate->created_at?->toIso8601String(),
                'metadata' => null,
            ]];

        return Inertia::render('Partner/Estates/Show', [
            'estate' => $payload,
            'recentResidents' => $recentResidents,
            'monthlySeries' => $monthlySeries,
            'timeline' => $timeline,
            'commission' => [
                'rate' => $request->user()->partner?->commission_rate !== null
                    ? (string) $request->user()->partner->commission_rate
                    : null,
                'type' => $request->user()->partner?->commission_type,
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

    public function store(
        StorePartnerRequestRequest $request,
        StoreEstateApplicationAction $storeApplication,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user->partner_id, 403, 'Your account is not linked to a partner organization.');

        $validated = $request->validated();

        try {
            $storeApplication->execute([
                'source' => EstateApplication::SOURCE_PARTNER,
                'partner_id' => $user->partner_id,
                'estate_name' => $validated['estate_name'],
                'contact_name' => $validated['chairman_name'],
                'email' => $validated['chairman_email'],
                'phone' => $validated['chairman_phone'],
                'address' => $validated['estate_address'] ?? null,
                'state' => $validated['state'] ?? null,
                'lga' => $validated['lga'] ?? null,
                'number_of_houses' => $validated['number_of_houses'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (ValidationException $exception) {
            $errors = $exception->errors();

            if (isset($errors['contact_name'])) {
                $errors['chairman_name'] = $errors['contact_name'];
                unset($errors['contact_name']);
            }
            if (isset($errors['email'])) {
                $errors['chairman_email'] = $errors['email'];
                unset($errors['email']);
            }
            if (isset($errors['phone'])) {
                $errors['chairman_phone'] = $errors['phone'];
                unset($errors['phone']);
            }

            throw ValidationException::withMessages($errors);
        }

        return redirect()
            ->route('partner.partner-requests.index', ['tab' => 'referrals'])
            ->with('success', 'Referral submitted successfully. Our team will review it shortly.');
    }

    public function destroy(Request $request, EstateApplication $partnerRequest): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->partner_id, 403);
        abort_unless(
            (int) $partnerRequest->partner_id === (int) $user->partner_id,
            403,
            'You can only manage estates belonging to your organization.',
        );
        abort_unless(
            $partnerRequest->partnerStatusKey() === 'rejected',
            422,
            'Only rejected referrals can be removed from your list.',
        );

        $partnerRequest->delete();

        return redirect()
            ->route('partner.partner-requests.index', ['tab' => 'referrals'])
            ->with('success', 'Rejected referral removed from your list.');
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $estates
     * @return array<string, mixed>
     */
    private function buildPortfolioSummary($estates, ?int $partnerId): array
    {
        $connected = $estates->count();
        $active = $estates->where('portfolio_status', 'active')->count();
        $residents = (int) $estates->sum(fn (array $e) => $e['counts']['people'] ?? $e['counts']['residents'] ?? 0);

        $monthStart = CarbonImmutable::now()->startOfMonth();
        $monthlyRevenue = 0;
        $lifetimeCommission = 0;
        $pendingSettlement = 0;

        if ($partnerId) {
            $monthlyRevenue = (int) CommissionableRevenue::query()
                ->where('partner_id', $partnerId)
                ->where('created_at', '>=', $monthStart)
                ->sum('revenue_amount');

            $lifetimeCommission = (int) CommissionableRevenue::query()
                ->where('partner_id', $partnerId)
                ->sum('commission_amount');

            $pendingSettlement = (int) CommissionableRevenue::query()
                ->where('partner_id', $partnerId)
                ->where('status', 'pending')
                ->sum('commission_amount');
        }

        return [
            'connected_estates' => $connected,
            'active_estates' => $active,
            'residents' => $residents,
            'monthly_revenue_kobo' => $monthlyRevenue,
            'lifetime_commission_kobo' => $lifetimeCommission,
            'pending_settlement_kobo' => $pendingSettlement,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEstateForPartner(Estate $estate, int $partnerId): array
    {
        $roleCounts = $this->acceptedRoleCounts($estate->id);
        $residentCount = $roleCounts['resident'] ?? 0;
        $propertyOwnerCount = $roleCounts['property_owner'] ?? 0;
        $residents = $residentCount + $propertyOwnerCount;

        $subscribed = (int) $estate->residentSubscriptions()
            ->whereIn('status', ['active', 'trialing', 'trial', 'past_due'])
            ->count();

        if ($subscribed === 0 && $residents > 0) {
            // Fallback: accepted residents with a resident subscription row of any non-cancelled status
            $subscribed = (int) $estate->residentSubscriptions()
                ->whereNotIn('status', ['cancelled', 'canceled', 'inactive'])
                ->count();
        }

        $monthStart = CarbonImmutable::now()->startOfMonth();
        $monthlyRevenue = (int) CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->where('created_at', '>=', $monthStart)
            ->sum('revenue_amount');

        $commissionEarned = (int) CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->sum('commission_amount');

        $pendingCommission = (int) CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->where('status', 'pending')
            ->sum('commission_amount');

        $weekAgo = now()->subWeek();
        $newResidentsWeek = (int) DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $estate->id)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $estate->id)
            ->whereIn('roles.name', ['resident', 'property_owner'])
            ->where('estate_users_membership.created_at', '>=', $weekAgo)
            ->count();

        $portfolio = $this->portfolioStatus($estate);
        $progress = $residents > 0
            ? (int) min(100, round(($subscribed / max(1, $residents)) * 100))
            : ($estate->status === 'active' ? 35 : 10);

        $application = EstateApplication::query()
            ->where('partner_id', $partnerId)
            ->where(function ($q) use ($estate) {
                $q->where('estate_id', $estate->id)
                    ->orWhere('estate_name', $estate->name);
            })
            ->latest()
            ->first();

        $location = collect([
            $application?->lga,
            $application?->state,
        ])->filter()->implode(' • ');

        if ($location === '' && $estate->address) {
            $location = $estate->address;
        }

        $activityLine = $newResidentsWeek > 0
            ? $newResidentsWeek.' new resident'.($newResidentsWeek === 1 ? '' : 's').' this week'
            : ($pendingCommission > 0
                ? 'Pending commission ready for settlement'
                : ($estate->status === 'active' ? 'Estate is live on Kontrol' : 'Awaiting activation'));

        return [
            'id' => $estate->id,
            'ulid' => $estate->ulid,
            'reference' => strtoupper(substr((string) $estate->ulid, -8)),
            'name' => $estate->name,
            'email' => $estate->email,
            'address' => $estate->address,
            'location' => $location !== '' ? $location : null,
            'chairman_name' => $application?->contact_name,
            'chairman_email' => $application?->email ?? $estate->email,
            'chairman_phone' => $application?->phone,
            'status' => $estate->status,
            'status_label' => $portfolio['label'],
            'portfolio_status' => $portfolio['key'],
            'commission_status' => $estate->commission_status?->value ?? (string) $estate->commission_status,
            'partner_status' => $estate->partner_status?->value ?? null,
            'activation_date' => $estate->activation_date?->toDateString(),
            'commission_starts_at' => $estate->commission_starts_at?->toDateString(),
            'commission_ends_at' => $estate->commission_ends_at?->toDateString(),
            'created_at' => $estate->created_at?->toIso8601String(),
            'counts' => [
                'residents' => $residents,
                'resident_only' => $residentCount,
                'property_owners' => $propertyOwnerCount,
                'people' => $residents,
                'subscribed' => $subscribed,
                'security' => $roleCounts['security'] ?? 0,
                'admins' => $roleCounts['admin'] ?? 0,
                'members' => $residents,
            ],
            'commission' => [
                'earned_kobo' => $commissionEarned,
                'pending_kobo' => $pendingCommission,
                'monthly_revenue_kobo' => $monthlyRevenue,
            ],
            'progress' => $progress,
            'recent_activity' => $activityLine,
            'new_residents_week' => $newResidentsWeek,
            'href' => route('partner.estates.show', $estate, false),
            'earnings_href' => '/partner/earnings',
        ];
    }

    /**
     * @return array{key: string, label: string}
     */
    private function portfolioStatus(Estate $estate): array
    {
        return match ($estate->status) {
            'active' => ['key' => 'active', 'label' => 'Active'],
            'pending' => ['key' => 'pending', 'label' => 'Pending Activation'],
            'under_review' => ['key' => 'under_review', 'label' => 'Under Review'],
            'suspended' => ['key' => 'suspended', 'label' => 'Suspended'],
            'archived' => ['key' => 'archived', 'label' => 'Archived'],
            default => ['key' => 'unknown', 'label' => ucfirst($estate->status)],
        };
    }

    /**
     * @return array<string, int>
     */
    private function acceptedRoleCounts(int $estateId): array
    {
        return DB::table('estate_users_membership')
            ->join('model_has_roles', function ($join) {
                $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('estate_users_membership.estate_id', $estateId)
            ->where('estate_users_membership.status', 'accepted')
            ->where('model_has_roles.estate_id', $estateId)
            ->whereIn('roles.name', ['resident', 'property_owner', 'security', 'admin'])
            ->groupBy('roles.name')
            ->selectRaw('roles.name as role_name, count(*) as aggregate')
            ->pluck('aggregate', 'role_name')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformReferral(EstateApplication $application): array
    {
        $stage = $this->referralStage($application);

        $timeline = $application->timelineEvents
            ->map(fn (ApplicationTimeline $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'description' => $event->description,
                'creator_name' => $event->creator_name,
                'created_at' => $event->created_at?->toIso8601String(),
                'metadata' => $event->metadata,
            ])
            ->values()
            ->all();

        if ($timeline === []) {
            $timeline = $this->syntheticTimeline($application, $application->partnerStatusKey());
        }

        $latest = $timeline[0] ?? null;
        $nextStep = match ($stage['key']) {
            'submitted' => 'Kontrol will begin reviewing your submission.',
            'under_review' => 'Our team is evaluating estate fit and documentation.',
            'info_requested' => 'Provide the requested information to continue review.',
            'accepted' => $application->estate
                ? 'Estate is live - track performance in Estates.'
                : 'Estate workspace is being prepared.',
            'rejected' => 'Review the rejection reason or submit a new referral.',
            default => 'Awaiting the next update from Kontrol.',
        };

        $notes = $application->notesList
            ->map(fn (ApplicationNote $note) => [
                'id' => $note->id,
                'body' => $note->body,
                'type' => $note->type,
                'creator_name' => $note->creator_name,
                'created_at' => $note->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'id' => $application->id,
            'reference' => 'REF-'.str_pad((string) $application->id, 5, '0', STR_PAD_LEFT),
            'estate_name' => $application->estate_name,
            'estate_address' => $application->address,
            'chairman_name' => $application->contact_name,
            'chairman_email' => $application->email,
            'chairman_phone' => $application->phone,
            'number_of_houses' => $application->number_of_houses,
            'state' => $application->state,
            'lga' => $application->lga,
            'notes' => $application->notes,
            'status' => $application->partnerStatusKey(),
            'status_label' => $application->partnerStatusLabel(),
            'stage' => $stage['key'],
            'stage_label' => $stage['label'],
            'is_generating_revenue' => $stage['key'] === 'accepted'
                && $application->estate
                && $application->estate->status === 'active',
            'rejection_reason' => $application->rejection_reason,
            'info_request_message' => $application->info_request_message,
            'challenges' => $application->challenges,
            'reviewed_at' => $application->reviewed_at?->toIso8601String(),
            'created_at' => $application->created_at?->toIso8601String(),
            'updated_at' => $application->updated_at?->toIso8601String(),
            'assigned_manager' => $application->assignedTo ? [
                'name' => $application->assignedTo->name,
            ] : null,
            'estate' => $application->estate ? [
                'id' => $application->estate->id,
                'ulid' => $application->estate->ulid,
                'name' => $application->estate->name,
                'status' => $application->estate->status,
            ] : null,
            'latest_activity' => $latest['description'] ?? 'Submitted for review',
            'expected_next_step' => $nextStep,
            'timeline' => $timeline,
            'admin_notes' => $notes,
        ];
    }

    /**
     * @return array{key: string, label: string}
     */
    private function referralStage(EstateApplication $application): array
    {
        return match ($application->status) {
            'info_requested' => ['key' => 'info_requested', 'label' => 'Information Requested'],
            'under_review' => ['key' => 'under_review', 'label' => 'Under Review'],
            'approved' => ['key' => 'accepted', 'label' => 'Approved'],
            'rejected' => ['key' => 'rejected', 'label' => 'Rejected'],
            default => ['key' => 'submitted', 'label' => 'Submitted'],
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function syntheticTimeline(EstateApplication $application, string $statusKey): array
    {
        $events = [
            [
                'id' => 'synth-submitted',
                'event_type' => 'submitted',
                'description' => 'Referral submitted for review',
                'creator_name' => 'Partner',
                'created_at' => $application->created_at?->toIso8601String(),
                'metadata' => null,
            ],
        ];

        if (in_array($application->status, ['under_review', 'info_requested', 'approved', 'rejected'], true)) {
            $events[] = [
                'id' => 'synth-review',
                'event_type' => 'under_review',
                'description' => 'Documents under review by Kontrol',
                'creator_name' => 'Kontrol',
                'created_at' => $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($application->status === 'info_requested') {
            $events[] = [
                'id' => 'synth-info',
                'event_type' => 'info_requested',
                'description' => $application->info_request_message
                    ? 'Information requested: '.$application->info_request_message
                    : 'Additional information requested',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($statusKey === 'accepted') {
            $events[] = [
                'id' => 'synth-accepted',
                'event_type' => 'accepted',
                'description' => $application->estate
                    ? 'Approved and converted to estate: '.$application->estate->name
                    : 'Referral approved',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($statusKey === 'rejected') {
            $events[] = [
                'id' => 'synth-rejected',
                'event_type' => 'rejected',
                'description' => $application->rejection_reason
                    ? 'Rejected: '.$application->rejection_reason
                    : 'Referral rejected',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        return array_reverse($events);
    }
}
