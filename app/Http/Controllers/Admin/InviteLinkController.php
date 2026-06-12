<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInviteLinkRequest;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InviteLinkController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    public function index(): Response
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->inviteLink;

        return Inertia::render('Admin/Residents/InviteLink/Index', [
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
        $estate = $this->estateContext->getEstate();
        $validated = $request->validated();
        $link = $estate->inviteLink;

        if ($link) {
            $link->update([
                'max_usages' => $validated['max_usages'] ?? null,
                'requires_approval' => $validated['requires_approval'] ?? true,
                'expires_at' => $validated['expires_at'] ?? null,
            ]);
        } else {
            $estate->inviteLink()->create([
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
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->inviteLink;

        if (! $link) {
            return back()->with('error', 'No invite link to regenerate.');
        }

        $link->update([
            'token' => Str::random(32),
            'usage_count' => 0, // Reset usage count on regeneration? User didn't specify, but usually yes for fresh link.
        ]);

        return back()->with('success', 'Invite link regenerated successfully.');
    }

    public function toggle(): RedirectResponse
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->inviteLink;

        if ($link) {
            $link->update(['is_active' => ! $link->is_active]);
            $status = $link->is_active ? 'enabled' : 'disabled';

            return back()->with('success', "Invite link {$status} successfully.");
        }

        return back()->with('error', 'No invite link found.');
    }

    public function destroy(): RedirectResponse
    {
        $this->authorize('residents.create');
        $estate = $this->estateContext->getEstate();
        $link = $estate->inviteLink;

        if (! $link) {
            return back()->with('error', 'No invite link to delete.');
        }

        if ($link->is_active) {
            return back()->with('error', 'Invite link must be disabled before it can be deleted.');
        }

        $link->delete();

        return to_route('admin.residents.index')->with('success', 'Invite link deleted successfully.');
    }
}
