<?php

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\OrganizationContextService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->estate = Estate::factory()->create(['name' => 'Golden Heights']);
    $this->org = EstateOrganization::factory()->create([
        'estate_id' => $this->estate->id,
        'name' => 'OSBA',
        'type' => 'business',
        'is_active' => true,
    ]);

    $this->user = User::factory()->create([
        'name' => 'Organization Staff',
        'email' => 'staff@osba.test',
    ]);

    $this->membership = OrganizationMembership::create([
        'user_id' => $this->user->id,
        'organization_id' => $this->org->id,
        'role' => 'member',
        'is_active' => true,
    ]);
});

test('organization user can view estate announcements feed with unread count and read state', function () {
    $estateAuthor = User::factory()->create(['name' => 'Estate Manager']);

    $post1 = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $estateAuthor->id,
        'title' => 'Annual General Residents Assembly',
        'body' => 'Notice of upcoming assembly...',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now()->subDay(),
    ]);

    $post2 = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $estateAuthor->id,
        'title' => 'Security Guidelines Update',
        'body' => 'Important security protocols...',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now()->subHours(2),
    ]);

    // Another estate's post should not appear
    $otherEstate = Estate::factory()->create();
    EstateBoardPost::factory()->create([
        'estate_id' => $otherEstate->id,
        'user_id' => $estateAuthor->id,
        'title' => 'Other Estate Post',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Organization/Announcements')
            ->where('organization.name', 'OSBA')
            ->where('organization.estate_name', 'Golden Heights')
            ->where('unread_count', 2)
            ->has('posts.data', 2)
            ->where('posts.data.0.title', 'Security Guidelines Update')
            ->where('posts.data.0.is_read', false)
        );
});

test('viewing an announcement marks it as read and renders detail page', function () {
    $estateAuthor = User::factory()->create(['name' => 'Ada Tunde']);

    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $estateAuthor->id,
        'title' => 'Annual General Residents Assembly & Security Roadmap',
        'body' => '<p>Meeting Overview Dear Residents, We are pleased to invite you...</p>',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now()->subDays(3),
    ]);

    $response = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Organization/AnnouncementDetail')
            ->where('post.title', 'Annual General Residents Assembly & Security Roadmap')
            ->where('post.author_name', 'Ada Tunde')
            ->where('post.is_read', true)
        );

    // Database must record the read
    $this->assertDatabaseHas('estate_board_post_reads', [
        'estate_board_post_id' => $post->id,
        'user_id' => $this->user->id,
    ]);

    // Feed now reflects 0 unread
    $feedResponse = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.index'));

    $feedResponse->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('unread_count', 0)
            ->where('posts.data.0.is_read', true)
        );
});

test('announcement detail presents an exact publication time in the application timezone', function () {
    config()->set('app.timezone', 'Africa/Lagos');
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-16 10:00:00', 'Africa/Lagos'));

    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => User::factory(),
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => CarbonImmutable::parse('2026-09-16 08:37:00', 'Africa/Lagos'),
    ]);

    $response = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post));

    $response->assertInertia(fn (Assert $page) => $page
        ->where('post.published_at_label', 'Today · 8:37 AM')
        ->where('post.published_at_timezone', 'Africa/Lagos')
        ->where('post.published_at_source', 'published_at')
    );

    $post->forceFill(['published_at' => CarbonImmutable::parse('2026-09-15 23:42:00', 'Africa/Lagos')])->save();

    $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.published_at_label', 'Yesterday · 11:42 PM')
        );

    $post->forceFill(['published_at' => CarbonImmutable::parse('2026-08-30 09:15:00', 'Africa/Lagos')])->save();

    $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.published_at_label', '30 Aug 2026 · 9:15 AM')
        );

    CarbonImmutable::setTestNow();
});

test('announcement detail falls back to its creation timestamp', function () {
    config()->set('app.timezone', 'Africa/Lagos');
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-09-16 10:00:00', 'Africa/Lagos'));

    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => User::factory(),
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => null,
        'created_at' => CarbonImmutable::parse('2026-09-16 08:15:00', 'Africa/Lagos'),
    ]);

    $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.published_at_label', 'Today · 8:15 AM')
            ->where('post.published_at_source', 'created_at')
        );

    CarbonImmutable::setTestNow();
});

test('announcement publication time conversion is daylight saving safe', function () {
    config()->set('app.timezone', 'America/New_York');
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-11-01 12:00:00', 'UTC'));

    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => User::factory(),
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => CarbonImmutable::parse('2026-11-01 05:30:00', 'UTC'),
    ]);

    $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.published_at_label', 'Today · 1:30 AM')
            ->where('post.published_at_timezone', 'America/New_York')
        );

    CarbonImmutable::setTestNow();
});

test('announcement detail lists the newest comments first', function () {
    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => User::factory(),
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now(),
    ]);

    EstateBoardComment::factory()->create([
        'estate_board_post_id' => $post->id,
        'estate_id' => $this->estate->id,
        'body' => 'Earlier response',
        'created_at' => now()->subHour(),
    ]);
    EstateBoardComment::factory()->create([
        'estate_board_post_id' => $post->id,
        'estate_id' => $this->estate->id,
        'body' => 'Latest response',
        'created_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('comments.data.0.body', 'Latest response')
            ->where('comments.data.1.body', 'Earlier response')
        );
});

test('organization user cannot view announcement from another estate', function () {
    $otherEstate = Estate::factory()->create();
    $otherAuthor = User::factory()->create();

    $otherPost = EstateBoardPost::factory()->create([
        'estate_id' => $otherEstate->id,
        'user_id' => $otherAuthor->id,
        'title' => 'Secret Other Estate Notice',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->get(route('org.announcements.show', ['post' => $otherPost->id]));

    $response->assertNotFound();
});

test('organization user can post comments on estate announcements', function () {
    $estateAuthor = User::factory()->create();
    $post = EstateBoardPost::factory()->create([
        'estate_id' => $this->estate->id,
        'user_id' => $estateAuthor->id,
        'title' => 'Community Clean-up Exercise',
        'body' => 'Notice for the community...',
        'status' => EstateBoardPostStatus::Published,
        'audience' => EstateBoardPostAudience::All,
        'published_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->withSession([OrganizationContextService::SESSION_KEY => $this->org->id])
        ->post(route('org.announcements.comments.store', $post), [
            'body' => 'Our business unit will contribute volunteers and materials.',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('estate_board_comments', [
        'estate_board_post_id' => $post->id,
        'estate_id' => $this->estate->id,
        'user_id' => $this->user->id,
        'body' => 'Our business unit will contribute volunteers and materials.',
    ]);
});
