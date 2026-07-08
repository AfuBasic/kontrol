<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\InvitePartnerMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\InvitePartnerMemberRequest;
use App\Models\Partner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Partner::orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        $partners = $query->paginate(15);

        return Inertia::render('Zeus/Partners/Index', [
            'partners' => $partners->through(function (Partner $partner) {
                return [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'email' => $partner->email,
                    'contact_person' => $partner->contact_person,
                    'commission_type' => $partner->commission_type,
                    'commission_rate' => $partner->commission_rate,
                    'status' => $partner->status,
                    'estates_count' => $partner->estates()->count(),
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
        return Inertia::render('Zeus/Partners/Create');
    }

    public function store(Request $request, InvitePartnerMemberAction $inviteAction): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:partners,name'],
            'email' => ['required', 'email', 'unique:partners,email'],
            'phone' => ['nullable', 'string'],
            'commission_type' => ['required', 'in:percentage,fixed'],
            'commission_rate' => [
                'required',
                'numeric',
                'min:0',
                $request->commission_type === 'percentage' ? 'max:100' : 'max:10000000',
            ],
            'commission_length' => ['nullable', 'integer', 'in:6,12,24'],
        ]);

        $validated['status'] = 'pending';

        $partner = Partner::create($validated);

        // Automatically invite the primary member on creation
        $inviteAction->execute($partner, $partner->email, $partner->name);

        return redirect()
            ->route('zeus.partners.index')
            ->with('success', 'Partner created and invitation email sent.');
    }

    public function edit(Partner $partner): Response
    {
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        return Inertia::render('Zeus/Partners/Edit', [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'email' => $partner->email,
                'phone' => $partner->phone,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_rate,
                'commission_length' => $partner->commission_length,
                'status' => $partner->status,
            ],
            'members' => $partner->members()
                ->orderBy('name')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'email' => $m->email,
                    'created_at' => $m->created_at->toIso8601String(),
                ]),
            'partnerPortalUrl' => "$scheme://partner.$appDomain/login",
        ]);
    }

    public function update(Request $request, Partner $partner): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:partners,name,'.$partner->id],
            'email' => ['required', 'email', 'unique:partners,email,'.$partner->id],
            'phone' => ['nullable', 'string'],
            'commission_type' => ['required', 'in:percentage,fixed'],
            'commission_rate' => [
                'required',
                'numeric',
                'min:0',
                $request->commission_type === 'percentage' ? 'max:100' : 'max:10000000',
            ],
            'commission_length' => ['nullable', 'integer', 'in:6,12,24'],
            'status' => ['required', 'in:active,inactive,suspended,pending'],
        ]);

        $partner->update($validated);

        return redirect()
            ->route('zeus.partners.index')
            ->with('success', 'Partner updated successfully.');
    }

    public function destroy(Partner $partner): RedirectResponse
    {
        if ($partner->estates()->exists()) {
            return redirect()
                ->route('zeus.partners.index')
                ->with('error', 'Cannot delete partner with associated estates.');
        }

        $partner->delete();

        return redirect()
            ->route('zeus.partners.index')
            ->with('success', 'Partner deleted successfully.');
    }

    public function regenerateKey(Partner $partner): RedirectResponse
    {
        $newKey = $partner->generateApiKey();

        return redirect()
            ->route('zeus.partners.edit', $partner)
            ->with('success', "API key regenerated: $newKey");
    }

    public function inviteMember(Partner $partner, InvitePartnerMemberRequest $request, InvitePartnerMemberAction $action): RedirectResponse
    {
        $action->execute($partner, $request->email, $request->name);

        return redirect()
            ->route('zeus.partners.edit', $partner)
            ->with('success', 'Portal invitation sent successfully.');
    }
}
