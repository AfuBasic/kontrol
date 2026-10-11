<?php

use App\Events\Admin\CollectionPublished;
use App\Models\Collection;
use App\Models\User;
use App\Notifications\Admin\CollectionPublishedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// A collection is named by its "name". There is no "title", and reading one gave null, which crashed the
// queued push ("WebPushMessage::title(): Argument #1 must be of type string, null given") and blanked the rest.

beforeEach(function () {
    $this->collection = Collection::factory()->create(['name' => 'Q4 Security Levy']);
    $this->notification = new CollectionPublishedNotification($this->collection, 12);
    $this->admin = User::factory()->make(['name' => 'Ada']);
});

it('builds the push message with the collection name, so queued push delivery cannot crash', function () {
    $push = $this->notification->toWebPush($this->admin);

    $title = (new ReflectionProperty($push, 'title'))->getValue($push);

    expect($title)->toBe('Q4 Security Levy');
});

it('puts the collection name in the app push too', function () {
    $fcm = $this->notification->toFcm($this->admin)->toArray();

    expect(json_encode($fcm))->toContain('Q4 Security Levy')
        ->and($fcm['data']['title'])->toBe('Q4 Security Levy');
});

it('names the collection in the email subject and body', function () {
    $mail = $this->notification->toMail($this->admin);

    expect($mail->subject)->toBe('Collection Published: Q4 Security Levy')
        ->and(implode(' ', $mail->introLines))->toContain("Your collection 'Q4 Security Levy'");
});

it('stores and broadcasts the collection name as the title', function () {
    $array = $this->notification->toArray($this->admin);

    expect($array['title'])->toBe('Q4 Security Levy')
        ->and($array['message'])->toContain("Collection 'Q4 Security Levy'")
        ->and($array['message'])->toContain('12 resident(s)')
        ->and($this->notification->toBroadcast($this->admin)->data['title'])->toBe('Q4 Security Levy');
});

it('names the collection in the published event', function () {
    $payload = (new CollectionPublished($this->collection, 12))->broadcastWith();

    expect($payload['title'])->toBe('Q4 Security Levy')
        ->and($payload['message'])->toContain("Collection 'Q4 Security Levy'");
});
