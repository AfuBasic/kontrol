<?php

namespace App\Actions\Zeus;

use App\Jobs\Billing\SyncEstateTrialSettingsJob;
use App\Models\Estate;
use Illuminate\Validation\ValidationException;

class UpdateEstateAction
{
    /**
     * @param  array{name?: string, email?: string, address?: string|null, status?: string, charge_type?: string, free_trial_enabled?: bool, free_trial_days?: int, grace_period_days?: int}  $data
     */
    public function execute(Estate $estate, array $data): Estate
    {
        // Extract settings-related fields before updating estate
        $chargeType = $data['charge_type'] ?? null;
        $freeTrialEnabled = $data['free_trial_enabled'] ?? null;
        $freeTrialDays = $data['free_trial_days'] ?? null;
        $gracePeriodDays = $data['grace_period_days'] ?? null;

        if (isset($data['charge_type'])) {
            unset($data['charge_type']);
        }
        if (isset($data['free_trial_enabled'])) {
            unset($data['free_trial_enabled']);
        }
        if (isset($data['free_trial_days'])) {
            unset($data['free_trial_days']);
        }
        if (isset($data['grace_period_days'])) {
            unset($data['grace_period_days']);
        }

        // Check if email is being changed
        if (isset($data['email']) && $data['email'] !== $estate->email) {
            if ($estate->hasAcceptedAdmin()) {
                throw ValidationException::withMessages([
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

        // Update settings if any settings-related fields are provided
        $settingsData = [];
        if ($chargeType !== null) {
            $settingsData['charge_type'] = $chargeType;
        }
        if ($freeTrialEnabled !== null) {
            $settingsData['free_trial_enabled'] = $freeTrialEnabled;
        }
        if ($freeTrialDays !== null) {
            $settingsData['free_trial_days'] = $freeTrialDays;
        }
        if ($gracePeriodDays !== null) {
            $settingsData['grace_period_days'] = $gracePeriodDays;
        }

        if (! empty($settingsData)) {
            $estate->settings()->updateOrCreate(
                ['estate_id' => $estate->id],
                $settingsData
            );

            if ($chargeType !== null || $freeTrialEnabled !== null || $freeTrialDays !== null) {
                SyncEstateTrialSettingsJob::dispatch($estate);
            }
        }

        return $estate->fresh();
    }
}
