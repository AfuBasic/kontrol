<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class SuspendResidentAction
{
    public function execute(User $resident, Estate $estate): void
    {
        $resident->update([
            'suspended_at' => $resident->suspended_at ? null : now(),
        ]);

        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log($resident->suspended_at ? 'suspended resident ' . $resident->name : 'activated resident ' . $resident->name);
    }
}
