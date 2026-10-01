<?php

use App\Models\Estate;
use App\Models\EstateOrganization;
use Illuminate\Support\Facades\DB;

it('turns organizations that had walk-ins switched off into no-walk-in organizations', function () {
    $estate = Estate::factory()->create();
    $make = fn (string $policy, bool $switch) => tap(EstateOrganization::factory()->create([
        'estate_id' => $estate->id,
        'access_policy' => $policy,
    ]), fn ($org) => DB::table('estate_organizations')->where('id', $org->id)->update(['quick_entry_enabled' => $switch]));

    $switchedOffHours = $make('public_window', false);
    $switchedOffOpen = $make('unrestricted', false);
    $stillOn = $make('public_window', true);
    $alreadyManaged = $make('managed', false);

    $migration = require base_path('database/migrations/2026_10_01_223132_convert_disabled_quick_entry_orgs_to_managed.php');
    $migration->up();

    expect($switchedOffHours->fresh()->access_policy)->toBe('managed')
        ->and($switchedOffOpen->fresh()->access_policy)->toBe('managed')
        ->and($stillOn->fresh()->access_policy)->toBe('public_window')
        ->and($alreadyManaged->fresh()->access_policy)->toBe('managed');
});
