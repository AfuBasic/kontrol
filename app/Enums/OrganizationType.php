<?php

namespace App\Enums;

enum OrganizationType: string
{
    case School = 'school';
    case Church = 'church';
    case Hospital = 'hospital';
    case Business = 'business';
    case Facility = 'facility';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::School => 'School',
            self::Church => 'Church',
            self::Hospital => 'Hospital',
            self::Business => 'Business',
            self::Facility => 'Facility',
            self::Other => 'Other',
        };
    }
}
