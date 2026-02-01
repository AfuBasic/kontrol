<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DeleteResidentAction
{
    public function execute(User $resident, Estate $estate): void
    {
        activity()
            ->performedOn($resident)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('deleted resident ' . $resident->name);

        $resident->delete();
    }
}
