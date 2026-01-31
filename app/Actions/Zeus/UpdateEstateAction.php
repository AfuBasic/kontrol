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
        $estate->update($data);

        return $estate->fresh();
    }
}
