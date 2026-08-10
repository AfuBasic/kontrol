<?php

use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('root domain loads public marketing landing page', function () {
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $domain = config('domains.root');

    $response = $this->get("http://{$domain}/");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Public/Home'));
});

test('www domain loads public marketing landing page', function () {
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    $domain = config('domains.www');

    $response = $this->get("http://{$domain}/");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Public/Home'));
});

test('app domain loads app login page when unauthenticated', function () {
    $domain = config('domains.app');

    $response = $this->get("http://{$domain}/login");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
});
