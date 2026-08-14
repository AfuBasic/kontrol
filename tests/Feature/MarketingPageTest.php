<?php

use App\Mail\ContactInquiryMail;
use App\Models\Plan;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('public home page returns ok and renders correct inertia component with plans data', function () {
    // 1. Seed features and plans
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    // 2. Access home route
    $response = $this->get(route('landing.home'));

    // 3. Assert status and component
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ? $page->component('Public/Home')
        : null
    );
});

test('public residents page returns ok and renders correct inertia component', function () {
    // Access residents route
    $response = $this->get(route('landing.residents'));

    // Assert status and component
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ? $page->component('Public/Residents')
        : null
    );
})->skip('Routes removed');

test('public estates page returns ok and renders correct inertia component', function () {
    // Access estates route
    $response = $this->get(route('landing.estates'));

    // Assert status and component
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ? $page->component('Public/Estates')
        : null
    );
})->skip('Routes removed');

test('public apply page returns ok and renders correct inertia component with plans data', function () {
    // 1. Seed features and plans
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    // 2. Access apply route
    $response = $this->get(route('landing.apply'));

    // 3. Assert status and component
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ? $page->component('Public/Apply')->has('plans')
        : null
    );
})->skip('Routes removed');

test('public download app page returns ok and renders correct inertia component', function () {
    // Access download app route
    $response = $this->get(route('landing.download'));

    // Assert status and component
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ? $page->component('Public/DownloadApp')
        : null
    );
});

test('submitting application stores details and redirects back with success message', function () {
    // 1. Seed features and plans
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);
    $plan = Plan::first();

    // 2. Post application details
    $response = $this->post(route('landing.apply.store'), [
        'estate_name' => 'Royal Gardens',
        'email' => 'admin@royal.com',
        'phone' => '+2348039999999',
        'address' => '12 Royal Way, Lekki',
        'notes' => 'Looking to onboard next month.',
        'plan_id' => $plan->id,
    ]);

    // 3. Assert redirect back and database persistence
    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('estate_applications', [
        'estate_name' => 'Royal Gardens',
        'email' => 'admin@royal.com',
        'phone' => '+2348039999999',
        'plan_id' => $plan->id,
        'status' => 'pending',
    ]);
})->skip('Routes removed');

test('public privacy page returns ok and renders correct inertia component', function () {
    $response = $this->get(route('landing.privacy'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Public/Privacy'));
})->skip('Routes removed');

test('public terms page returns ok and renders correct inertia component', function () {
    $response = $this->get(route('landing.terms'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Public/Terms'));
})->skip('Routes removed');

test('public contact page returns ok and renders correct inertia component', function () {
    $response = $this->get(route('landing.contact'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Public/Contact'));
})->skip('Routes removed');

test('submitting contact form sends email to support and redirects back with success message', function () {
    Mail::fake();

    $response = $this->post(route('landing.contact.submit'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'subject' => 'Setup Help',
        'message' => 'We want to onboard our gated community.',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    Mail::assertQueued(ContactInquiryMail::class, function ($mail) {
        return $mail->hasTo('support@usekontrol.com') &&
               $mail->hasReplyTo('test@example.com');
    });
})->skip('Routes removed');
