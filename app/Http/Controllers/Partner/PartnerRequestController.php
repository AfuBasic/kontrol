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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        if (! in_array($tab, ['requests', 'estates'], true)) {
            $tab = 'estates';
        }

        $applications = EstateApplication::query()
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
            ->map(fn (EstateApplication $application) => $this->transformForPartner($application))
            ->values();

        $estates = collect();
        if ($partnerId) {
            $estates = Estate::query()
                ->where('partner_id', $partnerId)
                ->latest()
                ->get()
                ->map(fn (Estate $estate) => $this->transformEstateForPartner($estate, $partnerId))
                ->values();
        }

        $columns = [
            ['key' => 'submitted', 'label' => 'Submitted'],
            ['key' => 'accepted', 'label' => 'Accepted'],
            ['key' => 'rejected', 'label' => 'Rejected'],
        ];

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $applications,
            'estates' => $estates,
            'activeTab' => $tab,
            'columns' => $columns,
            'commission' => [
                'rate' => $partner?->commission_rate !== null ? (string) $partner->commission_rate : null,
                'type' => $partner?->commission_type,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'tab' => $tab,
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

            // Map unified field names back to partner form keys.
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
            ->route('partner.partner-requests.index')
            ->with('success', 'Partner request submitted successfully. Our team will review it shortly.');
    }

    /**
     * Soft-delete a rejected estate application from the partner portal.
     * The record remains available to Zeus until permanently deleted there.
     */
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
            'Only rejected estates can be removed from your list.',
        );

        $partnerRequest->delete();

        return redirect()
            ->route('partner.partner-requests.index')
            ->with('success', 'Rejected estate removed from your list.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformEstateForPartner(Estate $estate, int $partnerId): array
    {
        $roleCounts = $this->acceptedRoleCounts($estate->id);

        $commissionEarned = (int) CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->sum('commission_amount');

        $pendingCommission = (int) CommissionableRevenue::query()
            ->where('partner_id', $partnerId)
            ->where('estate_id', $estate->id)
            ->where('status', 'pending')
            ->sum('commission_amount');

        $totalMembers = (int) DB::table('estate_users_membership')
            ->where('estate_id', $estate->id)
            ->where('status', 'accepted')
            ->count();

        return [
            'id' => $estate->id,
            'ulid' => $estate->ulid,
            'name' => $estate->name,
            'email' => $estate->email,
            'address' => $estate->address,
            'status' => $estate->status,
            'status_label' => $estate->status === 'active' ? 'Active' : 'Inactive',
            'commission_status' => $estate->commission_status?->value ?? (string) $estate->commission_status,
            'partner_status' => $estate->partner_status?->value ?? (string) $estate->partner_status,
            'activation_date' => $estate->activation_date?->toDateString(),
            'commission_starts_at' => $estate->commission_starts_at?->toDateString(),
            'commission_ends_at' => $estate->commission_ends_at?->toDateString(),
            'created_at' => $estate->created_at?->toIso8601String(),
            'counts' => [
                'residents' => $roleCounts['resident'] ?? 0,
                'security' => $roleCounts['security'] ?? 0,
                'admins' => $roleCounts['admin'] ?? 0,
                'members' => $totalMembers,
            ],
            'commission' => [
                'earned_kobo' => $commissionEarned,
                'pending_kobo' => $pendingCommission,
            ],
        ];
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
            ->whereIn('roles.name', ['resident', 'security', 'admin'])
            ->groupBy('roles.name')
            ->selectRaw('roles.name as role_name, count(*) as aggregate')
            ->pluck('aggregate', 'role_name')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function transformForPartner(EstateApplication $application): array
    {
        $statusKey = $application->partnerStatusKey();
        $isGenerating = $statusKey === 'accepted'
            && $application->estate
            && in_array($application->estate->status, ['active', 'live', 'trial'], true);

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

        // Synthetic baseline when no audit trail yet.
        if ($timeline === []) {
            $timeline = $this->syntheticTimeline($application, $statusKey);
        }

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
            'estate_name' => $application->estate_name,
            'estate_address' => $application->address,
            'chairman_name' => $application->contact_name,
            'chairman_email' => $application->email,
            'chairman_phone' => $application->phone,
            'number_of_houses' => $application->number_of_houses,
            'state' => $application->state,
            'lga' => $application->lga,
            'notes' => $application->notes,
            'status' => $statusKey,
            'status_label' => $application->partnerStatusLabel(),
            'is_generating_revenue' => $isGenerating,
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
                'ulid' => $application->estate->ulid,
                'name' => $application->estate->name,
                'status' => $application->estate->status,
            ] : null,
            'timeline' => $timeline,
            'admin_notes' => $notes,
        ];
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
                'description' => 'Estate submitted for review',
                'creator_name' => 'Partner',
                'created_at' => $application->created_at?->toIso8601String(),
                'metadata' => null,
            ],
        ];

        if ($statusKey === 'accepted') {
            $events[] = [
                'id' => 'synth-accepted',
                'event_type' => 'accepted',
                'description' => $application->estate
                    ? 'Estate accepted: '.$application->estate->name
                    : 'Estate application accepted',
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
                    : 'Application rejected',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        return $events;
    }
}
