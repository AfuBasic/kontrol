<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\InvitePartnerMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\InvitePartnerMemberRequest;
use App\Mail\Zeus\PartnerMemberInvitationMail;
use App\Models\Partner;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
                    ->orWhereHas('members', fn ($query) => $query->where('email', 'like', "%$search%"));
            });
        }

        $partners = $query->paginate(15);

        return Inertia::render('Zeus/Partners/Index', [
            'partners' => $partners->through(function (Partner $partner) {
                $primaryMember = $partner->members()->first();
                return [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'email' => $partner->email,
                    'primary_member_id' => $primaryMember?->id,
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
        $request->merge([
            'commission_length' => ($request->input('commission_length') === 'always' || $request->input('commission_length') === '')
                ? null
                : $request->input('commission_length'),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:partners,name'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'unique:user_profiles,phone'],
            'commission_type' => ['required', 'in:percentage,fixed'],
            'commission_rate' => [
                'required',
                'numeric',
                'min:0',
                $request->commission_type === 'percentage' ? 'max:100' : 'max:10000000',
            ],
            'commission_length' => ['nullable', 'integer', 'in:6,12,24'],
        ]);

        if ($validated['commission_type'] === 'fixed') {
            $validated['commission_rate'] = $validated['commission_rate'] * 100;
        }

        $validated['status'] = 'pending';

        DB::transaction(function () use ($validated, $inviteAction) {
            $partnerData = collect($validated)->except(['email', 'phone'])->toArray();
            $partner = Partner::create($partnerData);

            // Automatically invite the primary member on creation
            $user = $inviteAction->execute($partner, $validated['email'], $partner->name);

            if (!empty($validated['phone'])) {
                $user->profile()->updateOrCreate(
                    ['user_id' => $user->id],
                    ['phone' => $validated['phone']]
                );
            }
        });

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
                'commission_rate' => $partner->commission_type === 'fixed'
                    ? $partner->commission_rate / 100
                    : $partner->commission_rate,
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
                    'email_verified_at' => $m->email_verified_at?->toIso8601String(),
                    'created_at' => $m->created_at->toIso8601String(),
                ]),
            'partnerPortalUrl' => "$scheme://$appDomain/login",
        ]);
    }

    public function update(Request $request, Partner $partner): RedirectResponse
    {
        $request->merge([
            'commission_length' => ($request->input('commission_length') === 'always' || $request->input('commission_length') === '')
                ? null
                : $request->input('commission_length'),
        ]);

        $primaryMember = $partner->members()->first();
        $primaryMemberId = $primaryMember?->id;

        $validated = $request->validate([
            'name' => ['required', 'string', 'unique:partners,name,'.$partner->id],
            'email' => ['required', 'email', 'unique:users,email,'.$primaryMemberId],
            'phone' => ['nullable', 'string', 'unique:user_profiles,phone,'.$primaryMember?->profile?->id],
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

        if ($validated['commission_type'] === 'fixed') {
            $validated['commission_rate'] = $validated['commission_rate'] * 100;
        }

        DB::transaction(function () use ($partner, $validated, $primaryMember) {
            $partnerData = collect($validated)->except(['email', 'phone'])->toArray();
            $partner->update($partnerData);

            if ($primaryMember) {
                $primaryMember->update([
                    'email' => $validated['email'],
                ]);

                $primaryMember->profile()->updateOrCreate(
                    ['user_id' => $primaryMember->id],
                    ['phone' => $validated['phone']]
                );
            }
        });

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

    public function resendInvitation(Partner $partner, User $user): RedirectResponse
    {
        Mail::to($user->email)->send(new PartnerMemberInvitationMail($user, $partner));

        return back()
            ->with('success', 'Invitation email resent successfully.');
    }
}
