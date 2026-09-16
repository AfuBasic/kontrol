<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
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
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $search = $request->input('search');

        $visitorsQuery = AccessCode::where('organization_id', $organization->id)
            ->whereIn('type', ['single_use', 'event'])
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
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'visitors' => $visitors,
            'filters' => [
                'search' => $search,
            ],
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

        $validated = $request->validate([
            'visitor_name' => 'required|string|max:255',
            'visitor_phone' => 'nullable|string|max:50',
            'purpose' => 'nullable|string|max:255',
            'date' => 'required|date|after_or_equal:today',
        ]);

        $code = strtoupper(Str::random(6)); // simple unique code generation, in prod usually relies on a service

        // Ensure unique code
        while (AccessCode::where('code', $code)->exists()) {
            $code = strtoupper(Str::random(6));
        }

        $visitDate = Carbon::parse($validated['date']);

        $pass = AccessCode::create([
            'estate_id' => $organization->estate_id, // inherited from org
            'organization_id' => $organization->id,
            'user_id' => $request->user()->id, // The admin who created the pass
            'code' => $code,
            'type' => 'single_use',
            'status' => 'active',
            'visitor_name' => $validated['visitor_name'],
            'visitor_phone' => $validated['visitor_phone'] ?? null,
            'purpose' => $validated['purpose'] ?? 'Organization Visit',
            'starts_at' => $visitDate->startOfDay(),
            'expires_at' => $visitDate->copy()->endOfDay(),
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
}
