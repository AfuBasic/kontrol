<?php

namespace App\Actions\Zeus;

use App\Models\Estate;

class UpdateEstateAction
{
    /**
     * @param  array{name?: string, email?: string, address?: string|null, status?: string}  $data
     */
    public function execute(Estate $estate, array $data): Estate
    {
        // Check if email is being changed
        if (isset($data['email']) && $data['email'] !== $estate->email) {
            if ($estate->hasAcceptedAdmin()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'The estate admin email cannot be changed once the invitation has been accepted.',
                ]);
            }

            // Sync email to the pending user(s)
            // We find users attached to this estate (via pivot) and update their email.
            // Since this is a "fix typo" scenario, we assume the user attached is the one we want to update.
            // We should only update the user if they haven't accepted yet (which matches logic above).
            foreach ($estate->users as $user) {
                if ($user->email === $estate->email) {
                    $user->update(['email' => $data['email']]);
                }
            }
        }

        $estate->update($data);

        return $estate->fresh();
    }
}
