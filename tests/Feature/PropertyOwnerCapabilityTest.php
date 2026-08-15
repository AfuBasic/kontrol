<?php

use App\Enums\EstateBoardPostStatus;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateBoardPost;
use App\Models\EstateInviteLink;
use App\Models\EstateSettings;
use App\Models\EstateSubscription;
use App\Models\Plan;
use App\Models\Property;
use App\Models\User;
use App\Models\UserProfile;
use App\Notifications\EstateBoard\NewPostNotification;
use App\Services\PaystackService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed roles/permissions
    Role::create(['name' => 'admin']);
    Role::create(['name' => 'resident']);
    Role::create(['name' => 'property_owner']);

    // Seed essential permission for testing
    Permission::create(['name' => 'property_owners.view']);
    Permission::create(['name' => 'property_owners.create']);
    Permission::create(['name' => 'property_owners.edit']);
    Permission::create(['name' => 'property_owners.suspend']);
    Permission::create(['name' => 'residents.view']);
    Permission::create(['name' => 'residents.create']);
    Permission::create(['name' => 'residents.edit']);

    Role::findByName('admin')->givePermissionTo([
        'property_owners.view',
        'property_owners.create',
        'property_owners.edit',
        'property_owners.suspend',
        'residents.view',
        'residents.create',
        'residents.edit',
    ]);

    $this->estate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();

    setPermissionsTeamId($this->estate->id);
    $this->adminUser->assignRole('admin');
    $this->adminUser->estates()->attach($this->estate->id, ['status' => 'accepted']);

    // Seed features and plans
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);

    // Create estate subscription
    $plan = Plan::first();
    EstateSubscription::create([
        'estate_id' => $this->estate->id,
        'plan_id' => $plan->id,
        'status' => 'active',
        'billing_interval' => 'quarterly',
    ]);
});

test('admin can view, create, edit, suspend property owners', function () {
    $this->actingAs($this->adminUser);

    // 1. View Index
    $response = $this->get(route('admin.property-owners.index'));
    $response->assertOk();

    // 2. Create Property Owner
    $response = $this->post(route('admin.property-owners.store'), [
        'name' => 'John Owner',
        'email' => 'john@owner.com',
        'phone' => '1234567890',
        'unit_number' => 'Block A',
        'address' => '123 Main St',
    ]);
    $response->assertRedirect(route('admin.property-owners.index'));

    $owner = User::where('email', 'john@owner.com')->first();
    expect($owner)->not->toBeNull();
    setPermissionsTeamId($this->estate->id);
    expect($owner->hasRole('property_owner'))->toBeTrue();
    expect($owner->hasRole('resident'))->toBeTrue();

    // 3. Edit Property Owner details
    $response = $this->put(route('admin.property-owners.update', $owner->id), [
        'name' => 'John Owner Updated',
        'email' => 'john@owner.com',
        'phone' => '0987654321',
        'unit_number' => 'Block A2',
        'address' => '456 Main St',
    ]);
    $response->assertRedirect(route('admin.property-owners.index'));

    $owner->refresh();
    expect($owner->name)->toBe('John Owner Updated');
    expect($owner->profile->phone)->toBe('0987654321');

    // 4. Suspend Property Owner
    $response = $this->patch(route('admin.property-owners.suspend', $owner->id));
    $response->assertRedirect();

    $owner->refresh();
    $assignment = \App\Models\AdministrativeAssignment::where('user_id', $owner->id)
        ->where('estate_id', $this->estate->id)
        ->where('role_id', \Spatie\Permission\Models\Role::where('name', 'property_owner')->first()->id)
        ->first();
    expect($assignment->is_active)->toBeFalse();

    // 5. Reactivate
    $response = $this->patch(route('admin.property-owners.suspend', $owner->id));
    $response->assertRedirect();

    $owner->refresh();
    $assignment->refresh();
    expect($assignment->is_active)->toBeTrue();
});

test('property owner dashboard, residents, properties, collections, and announcements access', function () {
    // 1. Create a Property Owner
    $owner = User::factory()->create();
    UserProfile::create([
        'user_id' => $owner->id,
        'paystack_subaccount_code' => 'ACCT_owner123',
    ]);
    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('resident');
    $owner->assignRole('property_owner');
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);
    \App\Models\AdministrativeAssignment::create([
        'user_id' => $owner->id,
        'estate_id' => $this->estate->id,
        'role_id' => \Spatie\Permission\Models\Role::where('name', 'property_owner')->first()->id,
        'is_active' => true,
    ]);

    // 2. Create managed residents
    $resident1 = User::factory()->create();
    $resident1->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $resident1->id, 'property_owner_id' => $owner->id]);

    $resident2 = User::factory()->create();
    $resident2->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $resident2->id, 'property_owner_id' => $owner->id]);

    // 3. Create property
    $property = Property::create([
        'estate_id' => $this->estate->id,
        'property_owner_id' => $owner->id,
        'name' => 'Villa A-12',
    ]);

    $this->actingAs($owner);

    // 4. Dashboard View
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.property-owner.dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/PropertyOwner/Dashboard')
        ->where('residentsCount', 2)
        ->where('propertiesCount', 1)
    );

    // 5. List Managed Residents
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.property-owner.residents.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/PropertyOwner/Residents/Index')
        ->has('residents.data', 2)
    );

    // 6. Assign resident to property
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.properties.assign-resident', $property->id), [
            'resident_ids' => [$resident1->id],
        ]);
    $response->assertRedirect();

    $resident1->refresh();
    expect($resident1->profile->property_id)->toBe($property->id);

    // 7. Create Collection
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.collections.store'), [
            'name' => 'July Rent',
            'description' => 'Annual Rent',
            'amount' => 150000,
            'billing_type' => 'one_time',
            'due_at' => now()->addDays(5)->toDateString(),
            'applies_to' => 'all',
        ]);
    $response->assertRedirect(route('resident.property-owner.collections.index'));

    $collection = Collection::where('name', 'July Rent')->first();
    expect($collection)->not->toBeNull();
    expect($collection->assignments()->count())->toBe(2);

    // 8. Create Announcement
    Notification::fake();

    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.announcements.store'), [
            'title' => 'Renovation Notice',
            'body' => 'Painting starts Monday',
            'category' => 'general',
            'priority' => 'normal',
            'applies_to' => 'all',
        ]);
    $response->assertRedirect(route('resident.property-owner.announcements.index'));

    $announcement = EstateBoardPost::where('title', 'Renovation Notice')->first();
    expect($announcement)->not->toBeNull();
    expect($announcement->property_owner_id)->toBe($owner->id);

    // Verify notifications were sent to managed residents
    Notification::assertSentTo(
        [$resident1, $resident2],
        NewPostNotification::class,
        fn ($notification) => $notification->post->id === $announcement->id
    );
});

test('admin can bulk invite property owners', function () {
    $this->actingAs($this->adminUser);

    $response = $this->post(route('admin.property-owners.bulk-invite'), [
        'emails' => ['bulk1@owner.com', 'bulk2@owner.com'],
    ]);

    $response->assertRedirect(route('admin.property-owners.index'));

    $user1 = User::where('email', 'bulk1@owner.com')->first();
    $user2 = User::where('email', 'bulk2@owner.com')->first();

    expect($user1)->not->toBeNull();
    expect($user2)->not->toBeNull();

    setPermissionsTeamId($this->estate->id);
    expect($user1->hasRole('property_owner'))->toBeTrue();
    expect($user1->hasRole('resident'))->toBeTrue();
    expect($user2->hasRole('property_owner'))->toBeTrue();
    expect($user2->hasRole('resident'))->toBeTrue();
});

test('admin can manage property owner invite link and users can join', function () {
    $this->actingAs($this->adminUser);

    // 1. Get index (should be null)
    $response = $this->get(route('admin.property-owners.invite-link.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/PropertyOwners/InviteLink/Index')
        ->where('inviteLink', null)
    );

    // 2. Generate link
    $response = $this->post(route('admin.property-owners.invite-link.store'), [
        'max_usages' => 10,
        'requires_approval' => true,
        'expires_at' => now()->addDays(5)->toDateString(),
    ]);
    $response->assertRedirect();

    $this->estate->refresh();
    $link = $this->estate->propertyOwnerInviteLinks()->first();
    expect($link)->not->toBeNull();
    expect($link->role)->toBe('property_owner');
    expect($link->max_usages)->toBe(10);
    expect($link->requires_approval)->toBeTrue();

    // 3. Get index (should return the link details)
    $response = $this->get(route('admin.property-owners.invite-link.index'));
    $response->assertOk();

    // 4. Toggle link
    $response = $this->post(route('admin.property-owners.invite-link.toggle'), ['id' => $link->id]);
    $response->assertRedirect();
    $link->refresh();
    expect($link->is_active)->toBeFalse();

    // Toggle back to active
    $response = $this->post(route('admin.property-owners.invite-link.toggle'), ['id' => $link->id]);
    $response->assertRedirect();
    $link->refresh();
    expect($link->is_active)->toBeTrue();

    // 5. Regenerate token
    $oldToken = $link->token;
    $response = $this->post(route('admin.property-owners.invite-link.regenerate'), ['id' => $link->id]);
    $response->assertRedirect();
    $link->refresh();
    expect($link->token)->not->toBe($oldToken);

    // 6. User accepts invitation through the public join route
    $this->post(route('logout')); // Log out admin

    // View registration page
    $response = $this->get(url("/join/{$link->token}"));
    $response->assertOk();

    // Register
    $response = $this->post(url("/join/{$link->token}"), [
        'name' => 'Public Owner',
        'email' => 'public@owner.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);
    $response->assertOk(); // returns Inertia::render('Auth/JoinSuccess')

    // Verify registration details
    $user = User::where('email', 'public@owner.com')->first();
    expect($user)->not->toBeNull();
    setPermissionsTeamId($this->estate->id);
    expect($user->hasRole('property_owner'))->toBeTrue();
    expect($user->hasRole('resident'))->toBeTrue();

    // Verify membership status (requires_approval was true, so status should be pending)
    expect($user->estates->first()->pivot->status)->toBe('pending');
});

test('property owner can invite resident manually', function () {
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $profile = UserProfile::create(['user_id' => $owner->id]);

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');

    $property = Property::create([
        'estate_id' => $this->estate->id,
        'property_owner_id' => $owner->id,
        'name' => 'Villa 5B',
        'address' => '789 Oak Ave',
    ]);

    $this->actingAs($owner);

    // 1. Get Create View
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.property-owner.residents.create'));
    $response->assertOk();

    // 2. Post Store Resident
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.residents.store'), [
            'name' => 'Delegated Resident',
            'email' => 'delegated@resident.com',
            'phone' => '1122334455',
            'unit_number' => 'Flat 5B',
            'address' => '789 Oak Ave',
            'property_id' => $property->id,
        ]);
    $response->assertRedirect(route('resident.property-owner.residents.index'));

    $resident = User::where('email', 'delegated@resident.com')->first();
    expect($resident)->not->toBeNull();

    setPermissionsTeamId($this->estate->id);
    expect($resident->hasRole('resident'))->toBeTrue();
    expect($resident->profile->property_owner_id)->toBe($owner->id);
    expect($resident->profile->property_id)->toBe($property->id);
});

test('property owner can manage their own invite link and users can join', function () {
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);

    $profile = UserProfile::create(['user_id' => $owner->id]);

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');

    $this->actingAs($owner);

    // 1. Generate Invite Link
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.residents.invite-link.store'), [
            'max_usages' => 5,
            'requires_approval' => false,
            'expires_at' => now()->addDays(2)->toDateString(),
        ]);
    $response->assertSessionHasNoErrors();
    $response->assertRedirect();

    $link = EstateInviteLink::where('estate_id', $this->estate->id)
        ->where('user_id', $owner->id)
        ->first();

    expect($link)->not->toBeNull();
    expect($link->max_usages)->toBe(5);
    expect($link->requires_approval)->toBeTrue(); // Enforced true on backend
    expect($link->role)->toBe('resident');

    // 2. Toggle active state
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.residents.invite-link.toggle'));
    $response->assertRedirect();
    $link->refresh();
    expect($link->is_active)->toBeFalse();

    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.residents.invite-link.toggle'));
    $response->assertRedirect();
    $link->refresh();
    expect($link->is_active)->toBeTrue();

    // 3. Regenerate invite link
    $oldToken = $link->token;
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.property-owner.residents.invite-link.regenerate'));
    $response->assertRedirect();
    $link->refresh();
    expect($link->token)->not->toBe($oldToken);

    // 4. Sign up via public route using this link
    $this->post(route('logout'));

    $response = $this->get(url("/join/{$link->token}"));
    $response->assertOk();

    $response = $this->post(url("/join/{$link->token}"), [
        'name' => 'Joined Resident Under PO',
        'email' => 'joined.under.po@resident.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);
    $response->assertOk();

    $resident = User::where('email', 'joined.under.po@resident.com')->first();
    expect($resident)->not->toBeNull();

    setPermissionsTeamId($this->estate->id);
    expect($resident->hasRole('resident'))->toBeTrue();
    expect($resident->profile->property_owner_id)->toBe($owner->id);
    expect($resident->estates->first()->pivot->status)->toBe('pending'); // Enforced true by backend
});

test('resident can distinguish between estate and property owner notices and collections', function () {
    // 1. Create a Property Owner and Resident
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $owner->id]);

    $resident = User::factory()->create();
    $resident->estates()->attach($this->estate->id, ['status' => 'accepted', 'property_owner_id' => $owner->id]);
    UserProfile::create([
        'user_id' => $resident->id,
    ]);

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');
    $resident->assignRole('resident');

    // 2. Create Estate notice
    $estatePost = EstateBoardPost::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->adminUser->id,
        'title' => 'Estate Notice Title',
        'body' => 'Estate Notice Body',
        'audience' => 'residents',
        'status' => EstateBoardPostStatus::Published,
        'published_at' => now(),
    ]);

    // 3. Create Property Owner notice
    $ownerPost = EstateBoardPost::create([
        'estate_id' => $this->estate->id,
        'user_id' => $owner->id,
        'title' => 'Owner Notice Title',
        'body' => 'Owner Notice Body',
        'audience' => 'residents',
        'status' => EstateBoardPostStatus::Published,
        'published_at' => now(),
        'property_owner_id' => $owner->id,
    ]);

    // 4. Create Estate Collection Bill
    $estateCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Estate Dues',
        'amount' => 5000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'due_day' => 1,
        'grace_days' => 0,
        'applies_to' => 'all',
        'status' => 'active',
        'created_by' => $this->adminUser->id,
    ]);
    CollectionAssignment::create([
        'collection_id' => $estateCollection->id,
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'amount_due' => 5000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    // 5. Create Property Owner Collection Bill
    $ownerCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Landlord Rent',
        'amount' => 100000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'due_day' => 1,
        'grace_days' => 0,
        'applies_to' => 'all',
        'status' => 'active',
        'created_by' => $owner->id,
    ]);
    CollectionAssignment::create([
        'collection_id' => $ownerCollection->id,
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'amount_due' => 100000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    // 6. Act: Access Notice Feed as Resident
    $this->actingAs($resident);

    // Default Notices (defaults to estate)
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/EstateBoard/Index')
        ->has('posts.data', 1)
        ->where('posts.data.0.title', 'Estate Notice Title')
    );

    // Filter by Estate Notices
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index', ['filter' => 'estate']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/EstateBoard/Index')
        ->has('posts.data', 1)
        ->where('posts.data.0.title', 'Estate Notice Title')
    );

    // Filter by Landlord Notices
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.estate-board.index', ['filter' => 'property_owner']));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/EstateBoard/Index')
        ->has('posts.data', 1)
        ->where('posts.data.0.title', 'Owner Notice Title')
    );

    // 7. Act: Access Dues list as Resident
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.collections.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/Collections/Index')
        ->has('summary.outstanding', 2)
        ->where('summary.outstanding.0.billing_source', 'estate')
        ->where('summary.outstanding.1.billing_source', 'property_owner')
    );
});

test('property owner can set up banking settlement account', function () {
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $owner->id]);

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');

    $this->mock(PaystackService::class, function ($mock) {
        $mock->shouldReceive('getBanks')->andReturn([
            ['name' => 'Access Bank', 'code' => '044'],
        ]);
        $mock->shouldReceive('resolveAccountNumber')->with('0123456789', '044')->andReturn([
            'account_name' => 'Verified Landlord Name',
        ]);
        $mock->shouldReceive('createSubaccount')->andReturn([
            'subaccount_code' => 'ACCT_landlord123',
        ]);
    });

    $this->actingAs($owner);

    // 1. Visit settlement config index
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.property-owner.settlement.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/PropertyOwner/Settlement')
        ->has('banks', 1)
    );

    // 2. Resolve account name
    $response = $this->postJson(route('resident.property-owner.settlement.resolve'), [
        'account_number' => '0123456789',
        'bank_code' => '044',
    ]);
    $response->assertOk();
    $response->assertJsonPath('account_name', 'Verified Landlord Name');

    // 3. Save settlement account details
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->put(route('resident.property-owner.settlement.update'), [
            'bank_name' => 'Access Bank',
            'bank_code' => '044',
            'account_number' => '0123456789',
        ]);
    $response->assertRedirect();

    $owner->refresh();
    expect($owner->profile->bank_name)->toBe('Access Bank');
    expect($owner->profile->account_number)->toBe('0123456789');
    expect($owner->profile->account_name)->toBe('Verified Landlord Name');
    expect($owner->profile->paystack_subaccount_code)->toBe('ACCT_landlord123');
});

test('property owner cannot create collections without configuring settlement account first', function () {
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create(['user_id' => $owner->id]); // no paystack_subaccount_code

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');

    $this->actingAs($owner);

    // 1. Trying to view collection create page is successful but passes hasSettlementAccount = false
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->get(route('resident.property-owner.collections.create'));
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Resident/PropertyOwner/Collections/Create')
        ->where('hasSettlementAccount', false)
    );

    // 2. Trying to store a collection redirects back with error
    $response = $this->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->from(route('resident.property-owner.collections.create'))
        ->post(route('resident.property-owner.collections.store'), [
            'name' => 'July Rent',
            'amount' => 150000,
            'billing_type' => 'one_time',
            'due_at' => now()->addDays(5)->toDateString(),
            'applies_to' => 'all',
        ]);
    $response->assertRedirect(route('resident.property-owner.collections.create'));
    $response->assertSessionHasErrors(['message']);
});

test('payment routing dynamically switches subaccounts and prevents bulk mismatch', function () {
    // 1. Setup Property Owner with settlement configured
    $owner = User::factory()->create();
    $owner->estates()->attach($this->estate->id, ['status' => 'accepted']);
    UserProfile::create([
        'user_id' => $owner->id,
        'paystack_subaccount_code' => 'ACCT_owner123',
    ]);

    // 2. Setup Resident
    $resident = User::factory()->create();
    $resident->estates()->attach($this->estate->id, ['status' => 'accepted', 'property_owner_id' => $owner->id]);
    UserProfile::create([
        'user_id' => $resident->id,
    ]);

    setPermissionsTeamId($this->estate->id);
    $owner->assignRole('property_owner');
    $owner->assignRole('resident');
    $resident->assignRole('resident');

    // 3. Create Estate settings subaccount
    $settings = EstateSettings::forEstate($this->estate->id);
    $settings->update(['paystack_subaccount_code' => 'ACCT_estate123']);

    // 4. Create landlord collection & assignment
    $ownerCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Landlord Rent',
        'amount' => 100000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'due_day' => 1,
        'grace_days' => 0,
        'applies_to' => 'all',
        'status' => 'active',
        'created_by' => $owner->id,
    ]);
    $ownerAssignment = CollectionAssignment::create([
        'collection_id' => $ownerCollection->id,
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'amount_due' => 100000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    // 5. Create Estate Collection & assignment
    $estateCollection = Collection::create([
        'estate_id' => $this->estate->id,
        'name' => 'Estate Levy',
        'amount' => 5000,
        'billing_type' => 'one_time',
        'start_date' => now()->toDateString(),
        'due_at' => now()->addDays(5)->toDateString(),
        'due_day' => 1,
        'grace_days' => 0,
        'applies_to' => 'all',
        'status' => 'active',
        'created_by' => $this->adminUser->id,
    ]);
    $estateAssignment = CollectionAssignment::create([
        'collection_id' => $estateCollection->id,
        'user_id' => $resident->id,
        'estate_id' => $this->estate->id,
        'amount_due' => 5000,
        'status' => 'pending',
        'due_date' => now()->addDays(5)->toDateString(),
    ]);

    $this->actingAs($resident);

    // 6. Test Single Payment Routing for Landlord Bill
    $response = $this->postJson(url("/billing/collection/{$ownerAssignment->id}/initiate"));
    $response->assertOk();
    $response->assertJsonPath('subaccount', 'ACCT_owner123');

    // 7. Test Single Payment Routing for Estate Bill
    $response = $this->postJson(url("/billing/collection/{$estateAssignment->id}/initiate"));
    $response->assertOk();
    $response->assertJsonPath('subaccount', 'ACCT_estate123');

    // 8. Test Bulk Mismatch (cannot mix landlord and estate bills)
    $mismatchedUlids = "{$ownerAssignment->ulid},{$estateAssignment->ulid}";

    // showBulk fails
    $response = $this->get(url("/billing/collections/bulk?assignments={$mismatchedUlids}"));
    $response->assertStatus(400);

    // initiateBulk fails
    $response = $this->postJson(url('/billing/collections/bulk/initiate'), [
        'assignments' => $mismatchedUlids,
    ]);
    $response->assertStatus(400);
});
