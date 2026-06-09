<?php

namespace App\Enums;

enum IncidentCategory: string
{
    case Electricity = 'electricity';
    case WaterPlumbing = 'water_plumbing';
    case RoadInfrastructure = 'road_infrastructure';
    case Security = 'security';
    case SanitationWaste = 'sanitation_waste';
    case NoiseDisturbance = 'noise_disturbance';
    case Lighting = 'lighting';
    case CommonAreas = 'common_areas';
    case InternetCable = 'internet_cable';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Electricity => 'Electricity',
            self::WaterPlumbing => 'Water & Plumbing',
            self::RoadInfrastructure => 'Road & Infrastructure',
            self::Security => 'Security',
            self::SanitationWaste => 'Sanitation & Waste',
            self::NoiseDisturbance => 'Noise & Disturbance',
            self::Lighting => 'Lighting',
            self::CommonAreas => 'Common Areas',
            self::InternetCable => 'Internet & Cable',
            self::Other => 'Other',
        };
    }
}
