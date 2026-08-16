<?php

namespace App\Http\Controllers\Admin;

use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreZoneRequest;
use App\Http\Requests\Admin\UpdateZoneRequest;
use App\Models\Scopes\ZoneScope;
use App\Models\Zone;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ZoneController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Zone::class);

        $context = app(ContextManager::class)->current();

        $zones = Zone::withoutGlobalScope(ZoneScope::class)
            ->where('estate_id', $context->estateId)
            ->withCount(['residents', 'propertyOwners'])
            ->latest()
            ->get();

        return Inertia::render('Admin/Zones/Index', [
            'zones' => $zones,
        ]);
    }

    public function store(StoreZoneRequest $request): RedirectResponse
    {
        $context = app(ContextManager::class)->current();

        if (! $context) {
            abort(403, 'No active context.');
        }

        Zone::create([
            'estate_id' => $context->estateId,
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->back()->with('success', 'Zone created successfully.');
    }

    public function update(UpdateZoneRequest $request, Zone $zone): RedirectResponse
    {
        $context = app(ContextManager::class)->current();

        if (! $context || $zone->estate_id !== $context->estateId) {
            abort(403, 'Unauthorized action on zone belonging to another estate.');
        }

        $zone->update([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : $zone->is_active,
        ]);

        return redirect()->back()->with('success', 'Zone updated successfully.');
    }

    public function destroy(Zone $zone): RedirectResponse
    {
        $this->authorize('delete', $zone);

        $context = app(ContextManager::class)->current();

        if (! $context || $zone->estate_id !== $context->estateId) {
            abort(403, 'Unauthorized action on zone belonging to another estate.');
        }

        $zone->delete();

        return redirect()->back()->with('success', 'Zone archived successfully.');
    }
}
