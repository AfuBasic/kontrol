<?php

namespace App\Auth;

class ActiveContext
{
    public function __construct(
        public readonly int $userId,
        public readonly int $estateId,
        public readonly int $assignmentId,
        public readonly int $roleId,
        public readonly ?int $zoneId = null
    ) {
    }

    public function isEstateScoped(): bool
    {
        return $this->zoneId === null;
    }

    public function isZoneScoped(): bool
    {
        return $this->zoneId !== null;
    }
}
