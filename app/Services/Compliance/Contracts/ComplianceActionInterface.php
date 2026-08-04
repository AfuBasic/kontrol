<?php

namespace App\Services\Compliance\Contracts;

use App\Models\Compliance\PolicyAction;
use App\Models\Compliance\Violation;

interface ComplianceActionInterface
{
    /**
     * Execute the policy action against the given violation.
     */
    public function execute(Violation $violation, PolicyAction $action): bool;
}
