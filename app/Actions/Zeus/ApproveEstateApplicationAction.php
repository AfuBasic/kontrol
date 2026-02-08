<?php

namespace App\Actions\Zeus;

use App\Models\Estate;
use App\Models\EstateApplication;
use Illuminate\Support\Facades\DB;

class ApproveEstateApplicationAction
{
    public function __construct(
        private CreateEstateAction $createEstateAction,
    ) {}

    /**
     * Approve an estate application and create the estate.
     *
     * Uses the information from the application to create the estate,
     * which triggers the existing invitation flow.
     */
    public function execute(EstateApplication $application): Estate
    {
        return DB::transaction(function () use ($application) {
            // Create the estate using the application data
            $estate = $this->createEstateAction->execute([
                'name' => $application->estate_name,
                'email' => $application->email,
                'address' => $application->address,
            ]);

            // Mark the application as approved
            $application->markAsApproved();

            return $estate;
        });
    }
}
