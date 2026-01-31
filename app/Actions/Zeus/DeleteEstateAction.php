<?php

namespace App\Actions\Zeus;

use App\Models\Estate;
use Illuminate\Support\Facades\DB;

class DeleteEstateAction
{
    public function execute(Estate $estate): void
    {
        DB::transaction(function () use ($estate) {
            // Detach all users from the estate (pivot records deleted via cascade)
            // Delete the estate (cascades to pivot table via foreign key)
            $estate->delete();
        });
    }
}
