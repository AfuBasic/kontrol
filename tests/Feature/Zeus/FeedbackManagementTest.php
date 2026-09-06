<?php

use App\Models\Estate;
use App\Models\Feedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('unauthenticated users cannot view zeus feedback inbox', function () {
    $response = $this->get(route('zeus.feedback.index'));

    $response->assertRedirect(route('zeus.login'));
});

test('authenticated zeus admin can view feedback inbox and stats', function () {
    $sessionKey = config('zeus.session_key');
    $user = User::factory()->create();
    $estate = Estate::factory()->create();

    Feedback::factory()->count(3)->create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'status' => 'new',
    ]);

    Feedback::factory()->count(2)->create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'status' => 'noted',
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.feedback.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Feedback/Index')
        ->has('feedbacks.data', 5)
        ->where('counts.new', 3)
        ->where('counts.noted', 2)
        ->where('counts.all', 5)
    );
});

test('zeus admin can filter feedback by status and category', function () {
    $sessionKey = config('zeus.session_key');
    $user = User::factory()->create();
    $estate = Estate::factory()->create();

    Feedback::factory()->create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'category' => 'problem',
        'status' => 'new',
    ]);

    Feedback::factory()->create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'category' => 'praise',
        'status' => 'noted',
    ]);

    $response = $this->withSession([$sessionKey => true])
        ->get(route('zeus.feedback.index', [
            'category' => 'problem',
            'status' => 'new',
        ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Zeus/Feedback/Index')
        ->has('feedbacks.data', 1)
        ->where('feedbacks.data.0.category', 'problem')
        ->where('feedbacks.data.0.status', 'new')
    );
});

test('zeus admin can update feedback status', function () {
    $sessionKey = config('zeus.session_key');
    $feedback = Feedback::factory()->create(['status' => 'new']);

    $response = $this->withSession([$sessionKey => true])
        ->patch(route('zeus.feedback.update-status', $feedback), [
            'status' => 'reviewing',
        ]);

    $response->assertRedirect();
    expect($feedback->fresh()->status)->toBe('reviewing');
});
