<?php

use App\Models\EstateApplication;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

it('can update application status and create timeline event', function () {
    $application = EstateApplication::create([
        'estate_name' => 'Test Estate',
        'email' => 'test@example.com',
        'phone' => '1234567890',
        'status' => 'application_received',
    ]);

    // Mock Zeus Auth
    session()->put(config('zeus.session_key'), true);
    config(['zeus.username' => 'Test Zeus Admin']);

    $this->patch(route('zeus.applications.status.update', $application), [
            'status' => 'under_review',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    assertDatabaseHas('estate_applications', [
        'id' => $application->id,
        'status' => 'under_review',
    ]);

    assertDatabaseHas('application_timelines', [
        'estate_application_id' => $application->id,
        'event_type' => 'status_changed',
        'creator_name' => 'Test Zeus Admin',
    ]);
});

it('can add an internal note and create timeline event', function () {
    $application = EstateApplication::create([
        'estate_name' => 'Test Estate 2',
        'email' => 'test2@example.com',
        'phone' => '0987654321',
        'status' => 'application_received',
    ]);

    // Mock Zeus Auth
    session()->put(config('zeus.session_key'), true);
    config(['zeus.username' => 'Test Zeus Admin']);

    $this->post(route('zeus.applications.notes.store', $application), [
            'body' => 'This is a test internal note',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    assertDatabaseHas('application_notes', [
        'estate_application_id' => $application->id,
        'body' => 'This is a test internal note',
        'creator_name' => 'Test Zeus Admin',
    ]);

    assertDatabaseHas('application_timelines', [
        'estate_application_id' => $application->id,
        'event_type' => 'note_added',
        'creator_name' => 'Test Zeus Admin',
    ]);
});
