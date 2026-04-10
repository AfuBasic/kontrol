<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\InviteAffiliateMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\InviteAffiliateMemberRequest;
use App\Models\Affiliate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AffiliateController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Affiliate::orderBy('name');

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

        $affiliates = $query->paginate(15);

        return Inertia::render('zeus/affiliates/index', [
            'affiliates' => $affiliates->through(function (Affiliate $affiliate) {
                return [
                    'id' => $affiliate->id,
                    'name' => $affiliate->name,
                    'email' => $affiliate->email,
                    'contact_person' => $affiliate->contact_person,
                    'commission_rate' => $affiliate->commission_rate,
                    'status' => $affiliate->status,
                    'estates_count' => $affiliate->estates()->count(),
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
        return Inertia::render('zeus/affiliates/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:affiliates,name'],
            'email' => ['required', 'email', 'unique:affiliates,email'],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'contact_person' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive,suspended'],
        ]);

        Affiliate::create($validated);

        return redirect()
            ->route('zeus.affiliates.index')
            ->with('success', 'Affiliate created successfully.');
    }

    public function edit(Affiliate $affiliate): Response
    {
        return Inertia::render('zeus/affiliates/edit', [
            'affiliate' => [
                'id' => $affiliate->id,
                'name' => $affiliate->name,
                'email' => $affiliate->email,
                'description' => $affiliate->description,
                'website' => $affiliate->website,
                'contact_person' => $affiliate->contact_person,
                'phone' => $affiliate->phone,
                'commission_rate' => $affiliate->commission_rate,
                'status' => $affiliate->status,
                'notes' => $affiliate->notes,
            ],
        ]);
    }

    public function update(Request $request, Affiliate $affiliate): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:affiliates,name,'.$affiliate->id],
            'email' => ['required', 'email', 'unique:affiliates,email,'.$affiliate->id],
            'description' => ['nullable', 'string'],
            'website' => ['nullable', 'url'],
            'contact_person' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status' => ['required', 'in:active,inactive,suspended'],
            'notes' => ['nullable', 'string'],
        ]);

        $affiliate->update($validated);

        return redirect()
            ->route('zeus.affiliates.index')
            ->with('success', 'Affiliate updated successfully.');
    }

    public function destroy(Affiliate $affiliate): RedirectResponse
    {
        // Check if affiliate has estates
        if ($affiliate->estates()->exists()) {
            return redirect()
                ->route('zeus.affiliates.index')
                ->with('error', 'Cannot delete affiliate with associated estates.');
        }

        $affiliate->delete();

        return redirect()
            ->route('zeus.affiliates.index')
            ->with('success', 'Affiliate deleted successfully.');
    }

    public function regenerateKey(Affiliate $affiliate): RedirectResponse
    {
        $newKey = $affiliate->generateApiKey();

        return redirect()
            ->route('zeus.affiliates.edit', $affiliate)
            ->with('success', "API key regenerated: $newKey");
    }

    public function inviteMember(Affiliate $affiliate, InviteAffiliateMemberRequest $request, InviteAffiliateMemberAction $action): RedirectResponse
    {
        $action->execute($affiliate, $request->email, $request->name);

        return redirect()
            ->route('zeus.affiliates.edit', $affiliate)
            ->with('success', 'Invitation sent successfully.');
    }
}
