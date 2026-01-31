<?php

namespace Database\Seeders;

use App\Models\Estate;
use Illuminate\Database\Seeder;

class EstateSeeder extends Seeder
{
    public function run(): void
    {
        Estate::factory()->count(10)->active()->create();
        Estate::factory()->count(5)->inactive()->create();
    }
}
