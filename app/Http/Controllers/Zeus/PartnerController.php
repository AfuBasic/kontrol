<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\InvitePartnerMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\InvitePartnerMemberRequest;
use App\Mail\Zeus\PartnerMemberInvitationMail;
use App\Models\CommissionableRevenue;
use App\Models\Estate;
use App\Models\Partner;
use App\Models\PartnerEarning;
use App\Models\PaymentTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
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

    public function show(Partner $partner): Response
    {
        $appDomain = config('domains.app');
        $scheme = app()->environment('local') ? 'http' : 'https';

        $estates = $partner->estates()
            ->orderBy('name')
            ->get()
            ->map(function (Estate $estate) use ($partner) {
                $activeResidents = DB::table('estate_users_membership')
                    ->join('model_has_roles', function ($join) use ($estate) {
                        $join->on('estate_users_membership.user_id', '=', 'model_has_roles.model_id')
                            ->where('model_has_roles.model_type', User::class)
                            ->where('model_has_roles.estate_id', $estate->id);
                    })
                    ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                    ->where('estate_users_membership.estate_id', $estate->id)
                    ->where('estate_users_membership.status', 'accepted')
                    ->whereIn('roles.name', ['resident', 'property_owner'])
                    ->distinct('estate_users_membership.user_id')
                    ->count('estate_users_membership.user_id');

                $estateRevenue = (int) PaymentTransaction::where('estate_id', $estate->id)
                    ->where('status', 'success')
                    ->sum('amount');

                $commissionEarned = (int) CommissionableRevenue::where('estate_id', $estate->id)
                    ->where('partner_id', $partner->id)
                    ->sum('commission_amount');

                return [
                    'id' => $estate->id,
                    'ulid' => $estate->ulid,
                    'name' => $estate->name,
                    'code' => $estate->code ?? null,
                    'email' => $estate->email,
                    'address' => $estate->address,
                    'status' => $estate->status,
                    'created_at' => $estate->created_at?->toIso8601String(),
                    'activation_date' => $estate->activation_date?->format('Y-m-d'),
                    'partner_date' => $estate->partner_date?->format('Y-m-d'),
                    'commission_starts_at' => $estate->commission_starts_at?->format('Y-m-d'),
                    'commission_ends_at' => $estate->commission_ends_at?->format('Y-m-d'),
                    'partner_status' => $estate->partner_status?->value ?? (string) $estate->partner_status,
                    'commission_status' => $estate->commission_status?->value ?? (string) $estate->commission_status,
                    'residents_count' => $activeResidents,
                    'total_revenue' => $estateRevenue,
                    'commission_earned' => $commissionEarned,
                ];
            });

        $earnings = $partner->earnings()
            ->orderByDesc('month')
            ->get()
            ->map(fn (PartnerEarning $earning) => [
                'id' => $earning->id,
                'month' => $earning->month->format('Y-m-01'),
                'month_label' => $earning->month->format('F Y'),
                'total_amount' => $earning->total_amount,
                'revenue_amount' => $earning->revenue_amount,
                'settled_at' => $earning->settled_at?->toDateTimeString(),
                'is_settled' => $earning->isSettled(),
                'is_pending' => $earning->isPendingSettlement() && ! $earning->isAccruing(),
                'is_accruing' => $earning->isAccruing(),
                'status' => $earning->statusKey(),
                'status_label' => $earning->statusLabel(),
                'payment_reference_masked' => $earning->maskedPaymentReference(),
                'payment_note' => $earning->payment_note,
            ]);

        $recentCommissions = $partner->commissionableRevenues()
            ->with(['estate:id,name', 'user:id,name,email'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (CommissionableRevenue $cr) => [
                'id' => $cr->id,
                'estate_name' => $cr->estate?->name ?? 'Unknown Estate',
                'user_name' => $cr->user?->name ?? 'Anonymous',
                'user_email' => $cr->user?->email,
                'revenue_amount' => $cr->revenue_amount,
                'commission_amount' => $cr->commission_amount,
                'status' => $cr->status,
                'created_at' => $cr->created_at?->toIso8601String(),
            ]);

        $members = $partner->members()
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'phone' => $m->profile?->phone,
                'email_verified_at' => $m->email_verified_at?->toIso8601String(),
                'suspended_at' => $m->suspended_at?->toIso8601String(),
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        $partnerEstateIds = $partner->estates()->pluck('id');
        $totalGrossRevenue = (int) PaymentTransaction::whereIn('estate_id', $partnerEstateIds)
            ->where('status', 'success')
            ->sum('amount');

        $stats = [
            'total_estates' => $estates->count(),
            'active_estates' => $estates->where('status', 'active')->count(),
            'total_settled_earnings' => (int) $partner->earnings()->whereNotNull('settled_at')->sum('total_amount'),
            'pending_commissions' => (int) $partner->earnings()
                ->whereNull('settled_at')
                ->where('month', '<', now()->startOfMonth())
                ->sum('total_amount'),
            'accruing_commissions' => (int) $partner->commissionableRevenues()
                ->where('created_at', '>=', now()->startOfMonth())
                ->whereIn('status', ['pending', 'aggregated'])
                ->sum('commission_amount'),
            'total_unpaid_commissions' => (int) $partner->commissionableRevenues()
                ->whereIn('status', ['pending', 'aggregated'])
                ->sum('commission_amount'),
            'total_gross_revenue' => $totalGrossRevenue,
            'next_settlement_date' => CarbonImmutable::now()->addMonthNoOverflow()->startOfMonth()->format('Y-m-d'),
        ];

        return Inertia::render('Zeus/Partners/Show', [
            'partner' => [
                'id' => $partner->id,
                'name' => $partner->name,
                'email' => $partner->email,
                'phone' => $partner->phone,
                'website' => $partner->website,
                'contact_person' => $partner->contact_person,
                'description' => $partner->description,
                'notes' => $partner->notes,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_type === 'fixed'
                    ? $partner->commission_rate / 100
                    : $partner->commission_rate,
                'commission_length' => $partner->commission_length,
                'status' => $partner->status,
                'api_key' => $partner->api_key,
                'has_bank_account' => $partner->hasVerifiedBankAccount(),
                'bank_name' => $partner->bank_name,
                'account_name' => $partner->account_name,
                'account_number_masked' => $partner->maskedAccountNumber(),
                'account_number' => $partner->account_number,
                'account_verified_at' => $partner->account_verified_at?->toIso8601String(),
                'created_at' => $partner->created_at?->toIso8601String(),
            ],
            'estates' => $estates,
            'earnings' => $earnings,
            'recentCommissions' => $recentCommissions,
            'members' => $members,
            'stats' => $stats,
            'partnerPortalUrl' => "$scheme://$appDomain/login",
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

            if (! empty($validated['phone'])) {
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

            // Keep portal member login state in sync with partner status (users.suspended_at).
            if ($validated['status'] === 'suspended') {
                $partner->members()
                    ->whereNull('suspended_at')
                    ->update(['suspended_at' => now()]);
            } else {
                $partner->members()
                    ->whereNotNull('suspended_at')
                    ->update(['suspended_at' => null]);
            }

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
