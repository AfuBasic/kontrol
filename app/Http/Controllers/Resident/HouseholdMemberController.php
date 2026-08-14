<?php

namespace App\Http\Controllers\Resident;

use App\Actions\Resident\CreateHouseholdMemberAction;
use App\Actions\Resident\DeleteHouseholdMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Resident\StoreHouseholdMemberRequest;
use App\Mail\Resident\HouseholdMemberInvitationMail;
use App\Models\HouseholdMember;
use App\Services\EstateContextService;
use App\Services\Resident\HouseholdMemberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class HouseholdMemberController extends Controller
{
    public function __construct(
        protected HouseholdMemberService $householdMemberService,
    ) {}

    /**
     * Display the household members list.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $members = $this->householdMemberService->getHouseholdMembers($user);

        return Inertia::render('Resident/Household/Index', [
            'members' => $members->map(fn (HouseholdMember $hm) => [
                'id' => $hm->id,
                'ulid' => $hm->member->ulid,
                'name' => $hm->member->name,
                'email' => $hm->member->email,
                'status' => $hm->member->estates->first()?->pivot?->status ?? 'pending',
                'created_at' => $hm->created_at->toISOString(),
            ]),
        ]);
    }

    /**
     * Store a newly created household member.
     */
    public function store(StoreHouseholdMemberRequest $request): RedirectResponse
    {
        $user = $request->user();
        $estate = app(EstateContextService::class)->getEstate();

        if (! $estate->canAddMoreHouseholdMembers($user)) {
            $limit = $estate->getFeatureLimit('household-management');

            return back()->with('error', "You have reached your limit of {$limit} household members for this plan.");
        }

        app(CreateHouseholdMemberAction::class)->execute(
            $request->validated(),
            $estate,
            $user,
        );

        return back()->with('success', 'Household member added. An invitation email has been sent.');
    }

    /**
     * Remove the specified household member.
     */
    public function destroy(Request $request, HouseholdMember $householdMember): RedirectResponse
    {
        $user = $request->user();
        $estate = app(EstateContextService::class)->getEstate();

        // Ensure the household member belongs to this primary resident
        if ($householdMember->primary_resident_id !== $user->id || $householdMember->estate_id !== $estate->id) {
            abort(403, 'You can only remove your own household members.');
        }

        app(DeleteHouseholdMemberAction::class)->execute($householdMember, $estate);

        return back()->with('success', 'Household member removed.');
    }

    /**
     * Send a password reset email to a household member.
     */
    public function resetPassword(Request $request, HouseholdMember $householdMember): RedirectResponse
    {
        $user = $request->user();
        $estate = app(EstateContextService::class)->getEstate();

        // Ensure the household member belongs to this primary resident
        if ($householdMember->primary_resident_id !== $user->id || $householdMember->estate_id !== $estate->id) {
            abort(403, 'You can only reset passwords for your own household members.');
        }

        // Clear the password to force reset
        $householdMember->member->update(['password' => null]);

        // Update membership status back to pending
        $householdMember->member->estates()->updateExistingPivot($estate->id, ['status' => 'pending']);

        // Send password reset email
        Mail::to($householdMember->member)->send(
            new HouseholdMemberInvitationMail(
                user: $householdMember->member,
                estate: $estate,
                primaryResident: $user,
                passwordReset: true,
            )
        );

        return back()->with('success', "Password reset email sent to {$householdMember->member->name}.");
    }
}
