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
        $settings->update($data);

        activity()
            ->performedOn($settings)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $settings->estate_id])
            ->log('updated estate settings');
    }
}
