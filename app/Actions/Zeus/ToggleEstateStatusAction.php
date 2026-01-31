<?php

namespace App\Actions\Zeus;

use App\Models\Estate;

class ToggleEstateStatusAction
{
    public function execute(Estate $estate): Estate
    {
        $newStatus = $estate->status === 'active' ? 'inactive' : 'active';

        $estate->update(['status' => $newStatus]);

        return $estate->fresh();
    }

    public function activate(Estate $estate): Estate
    {
        $estate->update(['status' => 'active']);

        return $estate->fresh();
    }

    public function deactivate(Estate $estate): Estate
    {
        $estate->update(['status' => 'inactive']);

        return $estate->fresh();
    }
}
