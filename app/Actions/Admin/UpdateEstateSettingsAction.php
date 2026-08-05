<?php

namespace App\Actions\Admin;

use App\Models\EstateSettings;
use Illuminate\Support\Facades\Auth;

class UpdateEstateSettingsAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(EstateSettings $settings, array $data): void
    {
        if (isset($data['minimum_partial_payment_amount'])) {
            $data['minimum_partial_payment_amount'] = (int) round(((float) $data['minimum_partial_payment_amount']) * 100);
        }

        $settings->update($data);

        activity()
            ->performedOn($settings)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $settings->estate_id])
            ->log('updated estate settings');
    }
}
