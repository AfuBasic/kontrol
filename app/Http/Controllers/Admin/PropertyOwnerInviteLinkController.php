<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInviteLinkRequest;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PropertyOwnerInviteLinkController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {
    }

    public function index(): Response
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->propertyOwnerInviteLink;

        return Inertia::render('Admin/PropertyOwners/InviteLink/Index', [
            'inviteLink' => $link ? [
                'token' => $link->token,
                'url' => url("/join/{$link->token}"),
                'is_active' => $link->is_active,
                'usage_count' => $link->usage_count,
                'max_usages' => $link->max_usages,
                'requires_approval' => $link->requires_approval,
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
            ] : null,
        ]);
    }

    public function store(StoreInviteLinkRequest $request): RedirectResponse
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $validated = $request->validated();
        $link = $estate->propertyOwnerInviteLink;

        if ($link) {
            $link->update([
                'max_usages' => $validated['max_usages'] ?? null,
                'requires_approval' => $validated['requires_approval'] ?? true,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);
        } else {
            $estate->propertyOwnerInviteLink()->create([
                'role' => 'property_owner',
                'token' => Str::random(32),
                'is_active' => true,
                'usage_count' => 0,
                'max_usages' => $validated['max_usages'] ?? null,
                'requires_approval' => $validated['requires_approval'] ?? true,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);
        }

        return back()->with('success', 'Invite link settings updated successfully.');
    }

    public function regenerate(): RedirectResponse
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->propertyOwnerInviteLink;

        if (!$link) {
            return back()->with('error', 'No invite link to regenerate.');
        }

        $link->update([
            'token' => Str::random(32),
            'usage_count' => 0,
        ]);

        return back()->with('success', 'Invite link regenerated successfully.');
    }

    public function toggle(): RedirectResponse
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->propertyOwnerInviteLink;

        if ($link) {
            $link->update(['is_active' => !$link->is_active]);
            $status = $link->is_active ? 'enabled' : 'disabled';

            return back()->with('success', "Invite link {$status} successfully.");
        }

        return back()->with('error', 'No invite link found.');
    }

    public function destroy(): RedirectResponse
    {
        $this->authorize('property_owners.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->propertyOwnerInviteLink;

        if (!$link) {
            return back()->with('error', 'No invite link to delete.');
        }

        if ($link->is_active) {
            return back()->with('error', 'Invite link must be disabled before it can be deleted.');
        }

        $link->delete();

        return to_route('admin.property-owners.index')->with('success', 'Invite link deleted successfully.');
    }
}
