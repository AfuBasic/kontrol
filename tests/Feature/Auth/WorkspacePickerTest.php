<?php

use App\Actions\Auth\ActivateContext;
use App\Auth\ContextManager;
use App\Enums\AssignmentScope;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\MagicLoginToken;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\OrganizationContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

/*
 * A person can be a resident and also belong to an organization. They used to be sent straight into the estate, because
 * an organization was only looked at when they had no estate role at all, and the picker never listed one.
 */

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->estate = Estate::factory()->create(['name' => 'Lekki Gardens']);
    $this->residentRole = Role::create(['name' => 'resident', 'guard_name' => 'web', 'estate_id' => $this->estate->id]);

    $this->resident = function (): User {
        $user = User::factory()->create();
        $this->estate->users()->attach($user->id, ['status' => 'accepted']);
        $this->assignment = AdministrativeAssignment::create([
            'user_id' => $user->id, 'estate_id' => $this->estate->id, 'role_id' => $this->residentRole->id,
            'scope_type' => AssignmentScope::Estate, 'is_active' => true,
        ]);

        return $user;
    };

    $this->join = fn (User $user, string $name = 'Acme School', array $overrides = []) => OrganizationMembership::create([
        'user_id' => $user->id,
        'organization_id' => EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'name' => $name, 'is_active' => true, ...($overrides['organization'] ?? [])])->id,
        'role' => $overrides['role'] ?? 'admin',
        'is_active' => $overrides['is_active'] ?? true,
    ]);
});

// ---------- At login ----------

it('asks a resident who also belongs to an organization which workspace to enter', function () {
    $user = ($this->resident)();
    ($this->join)($user);

    $this->actingAs($user);

    expect(app(ActivateContext::class)->execute($user))->toBe(route('context.select'))
        ->and(session('active_context_assignment_id'))->toBeNull();
});

it('still sends a plain resident straight in', function () {
    $user = ($this->resident)();

    $this->actingAs($user);

    expect(app(ActivateContext::class)->execute($user))->toBe(route('resident.dashboard'))
        ->and(session('active_context_assignment_id'))->toBe($this->assignment->id);
});

it('still sends someone who only belongs to an organization to its dashboard', function () {
    $user = User::factory()->create();
    ($this->join)($user);

    $this->actingAs($user)->get(route('context.select'))->assertRedirect(route('org.dashboard'));
});

it('does not ask about an organization that has been switched off or a membership that has ended', function () {
    $user = ($this->resident)();
    ($this->join)($user, 'Closed Org', ['organization' => ['is_active' => false]]);
    ($this->join)($user, 'Former Org', ['is_active' => false]);

    $this->actingAs($user);

    expect(app(ActivateContext::class)->execute($user))->toBe(route('resident.dashboard'));
});

// ---------- The picker ----------

it('lists the estate role and the organization side by side', function () {
    $user = ($this->resident)();
    ($this->join)($user, 'Acme School', ['role' => 'admin']);

    $this->actingAs($user)->get(route('context.select'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/ContextPicker')
            ->has('availableContexts', 2)
            ->where('availableContexts.0.type', 'estate')
            ->where('availableContexts.0.estate_name', 'Lekki Gardens')
            ->where('availableContexts.0.role_name', 'resident')
            ->where('availableContexts.1.type', 'organization')
            ->where('availableContexts.1.estate_name', 'Acme School')
            ->where('availableContexts.1.role_name', 'organization admin')
            ->where('availableContexts.1.organization_id', fn ($id) => is_int($id))
        );
});

it('lists every organization a person belongs to, by name', function () {
    $user = ($this->resident)();
    ($this->join)($user, 'Zeta Clinic', ['role' => 'staff']);
    ($this->join)($user, 'Alpha School');

    $this->actingAs($user)->get(route('context.select'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('availableContexts', 3)
            ->where('availableContexts.1.estate_name', 'Alpha School')
            ->where('availableContexts.2.estate_name', 'Zeta Clinic')
            ->where('availableContexts.2.role_name', 'organization staff')
        );
});

it('marks the estate as current while its role is active', function () {
    $user = ($this->resident)();
    ($this->join)($user);

    $contexts = $this->actingAs($user)->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('context.select'))->viewData('page')['props']['availableContexts'];

    expect(collect($contexts)->firstWhere('is_current', true)['type'])->toBe('estate');
});

it('marks the organization as current once the person is working in it', function () {
    $user = ($this->resident)();
    $membership = ($this->join)($user);

    $contexts = $this->actingAs($user)->withSession([OrganizationContextService::SESSION_KEY => $membership->organization_id])
        ->get(route('context.select'))->viewData('page')['props']['availableContexts'];

    expect(collect($contexts)->firstWhere('is_current', true))->toMatchArray(['type' => 'organization', 'organization_id' => $membership->organization_id]);
});

// ---------- Choosing ----------

it('takes someone into the organization they pick, and puts the estate down', function () {
    $user = ($this->resident)();
    $membership = ($this->join)($user);

    $this->actingAs($user)->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->post(route('context.switch'), ['organization_id' => $membership->organization_id])
        ->assertRedirect(route('org.dashboard'));

    expect(session(OrganizationContextService::SESSION_KEY))->toBe($membership->organization_id)
        ->and(session('active_context_assignment_id'))->toBeNull();
});

it('lets someone move back to the estate after working in an organization', function () {
    $user = ($this->resident)();
    $membership = ($this->join)($user);

    $this->actingAs($user)->post(route('context.switch'), ['organization_id' => $membership->organization_id])->assertRedirect(route('org.dashboard'));
    $this->post(route('context.switch'), ['assignment_id' => $this->assignment->id])->assertRedirect(route('resident.dashboard'));

    expect(session('active_context_assignment_id'))->toBe($this->assignment->id);
});

it('refuses an organization the person does not belong to', function () {
    $user = ($this->resident)();
    $someoneElses = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'is_active' => true]);

    $this->actingAs($user)->post(route('context.switch'), ['organization_id' => $someoneElses->id])->assertForbidden();

    expect(session(OrganizationContextService::SESSION_KEY))->toBeNull();
});

it('refuses an organization that is switched off or whose membership has ended', function () {
    $user = ($this->resident)();
    $off = ($this->join)($user, 'Closed Org', ['organization' => ['is_active' => false]]);
    $ended = ($this->join)($user, 'Former Org', ['is_active' => false]);

    $this->actingAs($user)->post(route('context.switch'), ['organization_id' => $off->organization_id])->assertForbidden();
    $this->post(route('context.switch'), ['organization_id' => $ended->organization_id])->assertForbidden();
});

it('needs either an estate role or an organization to be chosen', function () {
    $user = ($this->resident)();

    $this->actingAs($user)->post(route('context.switch'), [])->assertSessionHasErrors(['assignment_id', 'organization_id']);
});

it('still refuses an estate role that belongs to someone else', function () {
    $user = ($this->resident)();
    $other = ($this->resident)();
    $theirs = $this->assignment;

    $this->actingAs($user)->post(route('context.switch'), ['assignment_id' => $theirs->id])->assertNotFound();

    expect(app(ContextManager::class)->current())->toBeNull();
});

// ---------- Through the real sign-in ----------

it('asks a resident who also belongs to an organization when they sign in with a magic link', function () {
    $user = ($this->resident)();
    $user->forceFill(['email_verified_at' => now()])->save();
    ($this->join)($user);
    MagicLoginToken::create(['user_id' => $user->id, 'token' => 'dual-user-token', 'expires_at' => now()->addMinutes(15), 'destination_url' => null]);

    $this->get(URL::signedRoute('auth.magic-login', ['token' => 'dual-user-token']))->assertRedirect(route('context.select'));
});

it('takes someone straight into the organization when the link they followed points there', function () {
    $user = ($this->resident)();
    $user->forceFill(['email_verified_at' => now()])->save();
    $membership = ($this->join)($user);
    MagicLoginToken::create(['user_id' => $user->id, 'token' => 'org-invite-token', 'expires_at' => now()->addMinutes(15), 'destination_url' => route('org.dashboard', [], false)]);

    $this->get(URL::signedRoute('auth.magic-login', ['token' => 'org-invite-token']))->assertRedirect(route('org.dashboard', [], false));

    expect(session(OrganizationContextService::SESSION_KEY))->toBe($membership->organization_id);
});

it('never puts someone into an organization they do not belong to, whatever link they followed', function () {
    $user = ($this->resident)();
    $user->forceFill(['email_verified_at' => now()])->save();
    $other = ($this->resident)();
    ($this->join)($other);   // a membership, but not this person's
    MagicLoginToken::create(['user_id' => $user->id, 'token' => 'stray-token', 'expires_at' => now()->addMinutes(15), 'destination_url' => route('org.dashboard', [], false)]);

    $this->get(URL::signedRoute('auth.magic-login', ['token' => 'stray-token']));

    expect(session(OrganizationContextService::SESSION_KEY))->toBeNull();
});

// ---------- Offered everywhere a person can switch ----------

it('tells every page which organizations the person can switch to, and how many workspaces they have', function () {
    $user = ($this->resident)();
    $membership = ($this->join)($user, 'Acme School', ['role' => 'staff']);

    $this->actingAs($user)->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('account.support.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.workspace_count', 2)
            ->where('auth.user.organization_contexts', [['organization_id' => $membership->organization_id, 'name' => 'Acme School', 'role' => 'staff']])
        );
});

it('reports one workspace for someone who has only an estate role', function () {
    $user = ($this->resident)();

    $this->actingAs($user)->withSession(['active_context_assignment_id' => $this->assignment->id])
        ->get(route('account.support.index'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.user.workspace_count', 1)->where('auth.user.organization_contexts', []));
});
