<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\InviteReferrerMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\InviteReferrerMemberRequest;
use App\Models\Referrer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReferrerController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Referrer::orderBy('name');

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        $referrers = $query->paginate(15);

        return Inertia::render('Zeus/Referrers/Index', [
            'referrers' => $referrers->through(function (Referrer $referrer) {
                return [
                    'id' => $referrer->id,
                    'name' => $referrer->name,
                    'email' => $referrer->email,
                    'contact_person' => $referrer->contact_person,
                    'commission_rate' => $referrer->commission_rate,
                    'status' => $referrer->status,
                    'estates_count' => $referrer->estates()->count(),
                ];
            }),
            'statuses' => ['active', 'inactive', 'suspended'],
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Zeus/Referrers/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:referrers,name'],
            'email' => ['required', 'email', 'unique:referrers,email'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'contact_person' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive,suspended'],
        ]);

        Referrer::create($validated);

        return redirect()
            ->route('zeus.referrers.index')
            ->with('success', 'Referrer created successfully.');
    }

    public function edit(Referrer $referrer): Response
    {
        return Inertia::render('Zeus/Referrers/Edit', [
            'referrer' => [
                'id' => $referrer->id,
                'name' => $referrer->name,
                'email' => $referrer->email,
                'description' => $referrer->description,
                'website' => $referrer->website,
                'contact_person' => $referrer->contact_person,
                'phone' => $referrer->phone,
                'commission_rate' => $referrer->commission_rate,
                'status' => $referrer->status,
                'notes' => $referrer->notes,
            ],
        ]);
    }

    public function update(Request $request, Referrer $referrer): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:referrers,name,'.$referrer->id],
            'email' => ['required', 'email', 'unique:referrers,email,'.$referrer->id],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'contact_person' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive,suspended'],
            'notes' => ['nullable', 'string'],
        ]);

        $referrer->update($validated);

        return redirect()
            ->route('zeus.referrers.index')
            ->with('success', 'Referrer updated successfully.');
    }

    public function destroy(Referrer $referrer): RedirectResponse
    {
        // Check if referrer has estates
        if ($referrer->estates()->exists()) {
            return redirect()
                ->route('zeus.referrers.index')
                ->with('error', 'Cannot delete referrer with associated estates.');
        }

        $referrer->delete();

        return redirect()
            ->route('zeus.referrers.index')
            ->with('success', 'Referrer deleted successfully.');
    }

    public function regenerateKey(Referrer $referrer): RedirectResponse
    {
        $newKey = $referrer->generateApiKey();

        return redirect()
            ->route('zeus.referrers.edit', $referrer)
            ->with('success', "API key regenerated: $newKey");
    }

    public function inviteMember(Referrer $referrer, InviteReferrerMemberRequest $request, InviteReferrerMemberAction $action): RedirectResponse
    {
        $action->execute($referrer, $request->email, $request->name);

        return redirect()
            ->route('zeus.referrers.edit', $referrer)
            ->with('success', 'Invitation sent successfully.');
    }
}
