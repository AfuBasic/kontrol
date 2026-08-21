<?php

namespace App\Actions\Auth;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\MagicLoginToken;
use App\Models\User;
use App\Support\IntendedDestinationGuard;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class GenerateMagicLoginUrlAction
{
    public function __construct(
        private ContextManager $contextManager,
        private IntendedDestinationGuard $intendedDestinationGuard,
    ) {}

    /**
     * Generate a one-time-use magic login URL for a user.
     *
     * @param  User  $user  The user to authenticate
     * @param  string|null  $destination  The relative path to redirect to after login
     * @param  AdministrativeAssignment|null  $assignment  Explicit assignment to activate on login
     * @param  int  $ttlMinutes  Time to live in minutes (default 5)
     */
    public function execute(
        User $user,
        ?string $destination = null,
        ?AdministrativeAssignment $assignment = null,
        int $ttlMinutes = 5
    ): string {
        $token = Str::random(64);

        if ($assignment === null) {
            $activeAssignmentId = session('active_context_assignment_id');
            if ($activeAssignmentId) {
                $assignment = $this->contextManager->getValidAssignments($user)->firstWhere('id', $activeAssignmentId);
            }

            if ($assignment === null && $destination) {
                $assignment = $this->intendedDestinationGuard->matchAssignment($user, $destination);
            }
        }

        MagicLoginToken::create([
            'user_id' => $user->id,
            'assignment_id' => $assignment?->id,
            'token' => $token,
            'destination_url' => $destination,
            'expires_at' => now()->addMinutes($ttlMinutes),
        ]);

        return URL::temporarySignedRoute(
            'auth.magic-login',
            now()->addMinutes($ttlMinutes),
            ['token' => $token]
        );
    }
}
