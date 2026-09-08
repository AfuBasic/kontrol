<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrganizationType;
use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    /**
     * Display a listing of estate organizations.
     */
    public function index(Request $request): Response
    {
        $estate = app(EstateContextService::class)->getEstate();

        $search = $request->input('search');
        $type = $request->input('type');

        $organizations = EstateOrganization::where('estate_id', $estate->id)
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($type && $type !== 'all', function ($query) use ($type) {
                $query->where('type', $type);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Organizations/Index', [
            'organizations' => $organizations,
            'filters' => [
                'search' => $search,
                'type' => $type ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created organization.
     */
    public function store(Request $request): RedirectResponse
    {
        $estate = app(EstateContextService::class)->getEstate();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(OrganizationType::class)],
            'access_policy' => ['nullable', 'string', 'in:managed,public_window,unrestricted'],
            'arrival_confirmation_required' => ['boolean'],
            'confirmation_window_minutes' => ['nullable', 'integer', 'between:5,120'],
            'confirmation_escalation' => ['nullable', 'string', 'in:alert_only,flag_security'],
            'operating_hours' => ['nullable', 'array'],
            'hours_enforcement' => ['nullable', 'string', 'in:inherit,off,warn,block'],
            'quick_entry_enabled' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $policy = $validated['access_policy'] ?? match ($validated['type']) {
            OrganizationType::Hospital->value => 'unrestricted',
            OrganizationType::Church->value => 'public_window',
            default => 'managed',
        };

        EstateOrganization::create([
            'estate_id' => $estate->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'access_policy' => $policy,
            'arrival_confirmation_required' => $policy === 'unrestricted' ? false : ($validated['arrival_confirmation_required'] ?? false),
            'confirmation_window_minutes' => $validated['confirmation_window_minutes'] ?? 15,
            'confirmation_escalation' => $validated['confirmation_escalation'] ?? 'alert_only',
            'operating_hours' => $validated['operating_hours'] ?? null,
            'hours_enforcement' => $validated['hours_enforcement'] ?? 'inherit',
            'quick_entry_enabled' => $validated['quick_entry_enabled'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', 'Organization created successfully.');
    }

    /**
     * Update the specified organization.
     */
    public function update(Request $request, EstateOrganization $organization): RedirectResponse
    {
        $estate = app(EstateContextService::class)->getEstate();

        if ($organization->estate_id !== $estate->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(OrganizationType::class)],
            'access_policy' => ['nullable', 'string', 'in:managed,public_window,unrestricted'],
            'arrival_confirmation_required' => ['boolean'],
            'confirmation_window_minutes' => ['nullable', 'integer', 'between:5,120'],
            'confirmation_escalation' => ['nullable', 'string', 'in:alert_only,flag_security'],
            'operating_hours' => ['nullable', 'array'],
            'hours_enforcement' => ['nullable', 'string', 'in:inherit,off,warn,block'],
            'quick_entry_enabled' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        if (isset($validated['access_policy']) && $validated['access_policy'] === 'unrestricted') {
            $validated['arrival_confirmation_required'] = false;
        }

        $organization->update($validated);

        return back()->with('success', 'Organization updated successfully.');
    }

    /**
     * Remove the specified organization.
     */
    public function destroy(EstateOrganization $organization): RedirectResponse
    {
        $estate = app(EstateContextService::class)->getEstate();

        if ($organization->estate_id !== $estate->id) {
            abort(403);
        }

        $organization->delete();

        return back()->with('success', 'Organization deleted successfully.');
    }
}
