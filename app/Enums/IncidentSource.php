<?php

namespace App\Enums;

enum IncidentSource: string
{
    case ResidentReport = 'resident_report';
    case SecurityReport = 'security_report';
    case EstateManagement = 'estate_management';
    case SystemGenerated = 'system_generated';
    case Inspection = 'inspection';

    public function label(): string
    {
        return match ($this) {
            self::ResidentReport => 'Resident Report',
            self::SecurityReport => 'Security Report',
            self::EstateManagement => 'Estate Management',
            self::SystemGenerated => 'System Generated',
            self::Inspection => 'Inspection',
        };
    }
}
