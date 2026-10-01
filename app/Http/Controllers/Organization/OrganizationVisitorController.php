<?php

namespace App\Http\Controllers\Organization;

use App\Enums\AccessCodeStatus;
use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Services\OrganizationContextService;
use App\Services\Resident\AccessCodeService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationVisitorController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private AccessCodeService $accessCodeService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $search = $request->input('search');

        $visitorsQuery = AccessCode::where('organization_id', $organization->id)
            ->whereIn('type', ['single_use', 'event'])
            // Group (bulk invite) passes are managed on the Groups tab, not as individual visitors.
            ->whereNull('bulk_invite_recipient_id')
            ->with(['accessLogs' => fn ($q) => $q->latest()->limit(1)])
            ->latest('created_at');

        if ($search) {
            $visitorsQuery->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                    ->orWhere('visitor_phone', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $visitors = $visitorsQuery->paginate(15)->withQueryString();

        return Inertia::render('Organization/Visitors', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'visitors' => $visitors,
            'filters' => [
                'search' => $search,
            ],
            // Same estate-configured choices residents get when creating a pass.
            'durationOptions' => $this->accessCodeService->getDurationOptions($organization->estate),
            'durationConstraints' => $this->durationConstraints($organization),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Only organization administrators can invite visitors.');
        }

        ['min' => $minMinutes, 'max' => $maxMinutes] = $this->durationConstraints($organization);

        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'visitor_phone' => 'nullable|string|max:50',
            'purpose' => 'nullable|string|max:255',
            // Omitted means "starts now", like the resident pass flow.
            'starts_at' => 'nullable|date|after_or_equal:'.now()->subMinutes(5)->toDateTimeString(),
            'duration_minutes' => "required|integer|min:{$minMinutes}|max:{$maxMinutes}",
        ], [
            'starts_at.after_or_equal' => 'Start time cannot be in the past.',
            'duration_minutes.min' => 'Passes must last at least :min minutes.',
            'duration_minutes.max' => 'Passes can last at most :max minutes.',
        ]);

        $code = strtoupper(Str::random(6));

        while (AccessCode::where('code', $code)->exists()) {
            $code = strtoupper(Str::random(6));
        }

        // The browser sends UTC; convert to the app timezone before saving, as the resident flow does.
        $startsAt = ! empty($validated['starts_at'])
            ? Carbon::parse($validated['starts_at'])->setTimezone(config('app.timezone'))
            : now();
        $expiresAt = $startsAt->copy()->addMinutes((int) $validated['duration_minutes']);

        $pass = AccessCode::create([
            'estate_id' => $organization->estate_id,
            'organization_id' => $organization->id,
            'user_id' => $request->user()->id,
            'code' => $code,
            'type' => 'single_use',
            'status' => 'active',
            'visitor_name' => $validated['visitor_name'],
            'visitor_phone' => $validated['visitor_phone'] ?? null,
            'purpose' => $validated['purpose'] ?? 'Organization Visit',
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'source' => 'web',
            'created_by_id' => $request->user()->id,
        ]);

        // P2.5 Notification logic can be dispatched here (e.g., event(new OrganizationVisitorInvited($pass)))
        // For now, it will just return the pass so the user can copy the link.

        return back()->with('success', 'Visitor pass created successfully.');
    }

    public function storeBulk(Request $request): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin()) {
            abort(403, 'Only organization administrators can invite visitors.');
        }

        $validated = $request->validate([
            'date' => 'required|date|after_or_equal:today',
            'purpose' => 'nullable|string|max:255',
            'visitors' => 'required|array|min:1|max:100',
            'visitors.*.visitor_name' => 'required|string|max:255',
            'visitors.*.visitor_phone' => 'nullable|string|max:50',
        ]);

        $visitDate = Carbon::parse($validated['date']);
        $createdPasses = [];

        DB::transaction(function () use ($validated, $organization, $request, $visitDate, &$createdPasses) {
            foreach ($validated['visitors'] as $visitor) {
                $code = strtoupper(Str::random(6));

                while (AccessCode::where('code', $code)->exists()) {
                    $code = strtoupper(Str::random(6));
                }

                $pass = AccessCode::create([
                    'estate_id' => $organization->estate_id,
                    'organization_id' => $organization->id,
                    'user_id' => $request->user()->id,
                    'code' => $code,
                    'type' => 'event', // Use 'event' for bulk invites
                    'status' => 'active',
                    'visitor_name' => $visitor['visitor_name'],
                    'visitor_phone' => $visitor['visitor_phone'] ?? null,
                    'purpose' => $validated['purpose'] ?? 'Organization Event',
                    'starts_at' => $visitDate->startOfDay(),
                    'expires_at' => $visitDate->copy()->endOfDay(),
                    'source' => 'web',
                    'created_by_id' => $request->user()->id,
                ]);

                $createdPasses[] = [
                    'visitor_name' => $pass->visitor_name,
                    'code' => $pass->code,
                    'pass_uuid' => $pass->pass_uuid,
                ];
            }
        });

        // Flash the generated passes so the frontend can display a summary or "Copy all links"
        $request->session()->flash('bulk_passes', $createdPasses);

        return back()->with('success', count($createdPasses).' visitor passes created successfully.');
    }

    public function extend(Request $request, AccessCode $pass): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $pass->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        if ($pass->type === 'long_lived') {
            return back()->withErrors(['duration_minutes' => 'Long-term passes cannot be extended.']);
        }

        $validated = $request->validate([
            'duration_minutes' => ['required', 'integer', 'min:15'],
        ]);

        $minutes = (int) $validated['duration_minutes'];
        $currentExpiresAt = $pass->expires_at ? Carbon::parse($pass->expires_at) : now();
        $baseTime = $currentExpiresAt->isPast() ? now() : $currentExpiresAt;
        $newExpiresAt = $baseTime->copy()->addMinutes($minutes);

        $pass->update([
            'expires_at' => $newExpiresAt,
            'status' => AccessCodeStatus::Active->value,
        ]);

        return back()->with('success', 'Pass validity successfully extended.');
    }

    public function destroy(Request $request, AccessCode $pass): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        if (! $membership->isAdmin() || $pass->organization_id !== $organization->id) {
            abort(403, 'Unauthorized.');
        }

        // We revoke it instead of hard deleting to keep audit trails
        $pass->update(['status' => 'revoked']);

        return back()->with('success', 'Visitor pass revoked.');
    }

    /**
     * Pass lifespan bounds from estate settings, with the same defaults residents get.
     *
     * @return array{min: int, max: int}
     */
    private function durationConstraints(EstateOrganization $organization): array
    {
        $settings = EstateSettings::forEstate($organization->estate_id);

        return [
            'min' => (int) ($settings->access_code_min_lifespan_minutes ?? 30),
            'max' => (int) ($settings->access_code_max_lifespan_minutes ?? 1440),
        ];
    }
}
