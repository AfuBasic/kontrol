<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Auth\ContextManager;
use App\Models\Estate;
use App\Models\EstateInviteLink;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\Admin\NewResidentSignup;
use App\Notifications\VerifyResidentEmail;
use App\Services\ResidentSubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class InviteRegistrationController extends Controller
{
    public function __construct(
        protected ResidentSubscriptionService $subscriptionService
    ) {}

    /**
     * Show the registration form for the invite link.
     */
    public function show(string $token): Response
    {
        $inviteLink = EstateInviteLink::where('token', $token)
            ->where('is_active', true)
            ->with('estate')
            ->firstOrFail();

        if ($inviteLink->isExpired() || $inviteLink->isFull()) {
            abort(403, 'This invitation link is invalid or has reached its usage limit.');
        }

        return Inertia::render('Auth/Join', [
            'token' => $token,
            'estate' => [
                'name' => $inviteLink->estate->name,
                'address' => $inviteLink->estate->address,
                'logo' => $inviteLink->estate->logo_url,
            ],
        ]);
    }

    /**
     * Handle the registration submission.
     */
    public function store(Request $request, string $token)
    {
        $inviteLink = EstateInviteLink::where('token', $token)
            ->where('is_active', true)
            ->with('estate')
            ->firstOrFail();

        if ($inviteLink->isExpired() || $inviteLink->isFull()) {
            abort(403, 'This invitation link is invalid or has reached its usage limit.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        ]);

        return DB::transaction(function () use ($request, $inviteLink) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => null,
                'user_type' => 'user',
            ]);

            app(ContextManager::class)->setSystemContext($inviteLink->estate_id);

            // Assign roles scoped to this estate
            $residentRole = Role::where('name', 'resident')
                ->where('guard_name', 'web')
                ->whereNull('estate_id')
                ->firstOrFail();
            $user->assignRole($residentRole);

            if ($inviteLink->role === 'property_owner') {
                $poRole = Role::where('name', 'property_owner')
                    ->where('guard_name', 'web')
                    ->whereNull('estate_id')
                    ->firstOrFail();
                $user->assignRole($poRole);
            }

            // Send verification email
            $user->notify(new VerifyResidentEmail($inviteLink->estate));

            // Create profile
            UserProfile::create([
                'user_id' => $user->id,
                'property_owner_id' => $inviteLink->user_id,
            ]);

            // Create membership based on requires_approval setting
            $status = $inviteLink->requires_approval ? 'pending' : 'accepted';

            $user->estates()->attach($inviteLink->estate_id, [
                'status' => $status,
            ]);

            // Create resident subscription if required
            $this->subscriptionService->createForUser($user, $inviteLink->estate);

            // Increment usage count
            $inviteLink->increment('usage_count');

            // Notify estate admins only if manual approval is required
            if ($inviteLink->requires_approval) {
                $admins = User::withRole('admin', $inviteLink->estate_id)->get();
                if ($admins->isNotEmpty()) {
                    Notification::send($admins, new NewResidentSignup($user, $inviteLink->estate->name));
                }
            }

            return Inertia::render('Auth/JoinSuccess', [
                'estate' => $inviteLink->estate->name,
                'requires_approval' => $inviteLink->requires_approval,
            ]);
        });
    }
}
