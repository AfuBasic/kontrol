<?php

namespace App\Console\Commands;

use App\Models\Estate;
use App\Models\EstateSettings;
use Illuminate\Console\Command;

class GenerateMissingEstateSettings extends Command
{
    protected $signature = 'app:generate-missing-estate-settings';

    protected $description = 'Create default settings rows for estates that don\'t have one yet';

    public function handle(): int
    {
        $estateIds = Estate::whereDoesntHave('settings')
            ->pluck('id');

        if ($estateIds->isEmpty()) {
            $this->info('All estates already have settings.');

            return self::SUCCESS;
        }

        $this->info("Found {$estateIds->count()} estate(s) without settings.");

        $created = 0;
        foreach ($estateIds as $estateId) {
            EstateSettings::forEstate($estateId);
            $created++;
        }

        $this->info("Created settings for {$created} estate(s).");

        return self::SUCCESS;
    }
}
