<?php

namespace App\Console\Commands\Demo;

use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;

class SeedDemoData extends Command
{
    protected $signature = 'demo:seed {--fresh : Wipe existing demo data before seeding}';

    protected $description = 'Seed the database with thousands of realistic demo records for all roles';

    public function handle(): int
    {
        if ($this->option('fresh')) {
            $this->call('demo:wipe', ['--force' => true]);
        }

        $this->info('Starting demo seed...');

        $seeder = new DemoSeeder;
        $seeder->setCommand($this);
        $seeder->run();

        return self::SUCCESS;
    }
}
