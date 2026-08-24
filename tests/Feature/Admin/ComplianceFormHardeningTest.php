<?php

use App\Actions\Admin\CreateAdministrativeAssignmentAction;
use App\Enums\AssignmentScope;
use App\Models\Compliance\CompliancePolicy;
use App\Models\Compliance\Violation;
use App\Models\Estate;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create();
    $this->otherEstate = Estate::factory()->create();
    $this->adminUser = User::factory()->create();
    $this->adminRole = Role::where('name', 'admin')->whereNull('estate_id')->firstOrFail();

    $this->estate->users()->attach($this->adminUser->id, ['status' => 'accepted']);

    $this->adminAssignment = app(CreateAdministrativeAssignmentAction::class)->execute(
        user: $this->adminUser,
        estate: $this->estate,
        role: $this->adminRole,
        scopeType: AssignmentScope::Estate,
        isPrimary: true
    );
});

it('loads the compliance policy page using the active estate context', function () {
    CompliancePolicy::query()->create([
        'estate_id' => $this->estate->id,
        'violation_type' => 'collection_overdue',
        'name' => 'Active estate policy',
        'is_active' => true,
    ]);

    CompliancePolicy::query()->create([
        'estate_id' => $this->otherEstate->id,
        'violation_type' => 'collection_overdue',
        'name' => 'Other estate policy',
        'is_active' => true,
    ]);

    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->get(route('admin.compliance.policies'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Compliance/PolicyConfig')
            ->has('policies', 1)
            ->where('policies.0.name', 'Active estate policy')
        );
});

it('updates policy stages and actions with explicit validation payloads', function () {
    $policy = CompliancePolicy::query()->create([
        'estate_id' => $this->estate->id,
        'violation_type' => 'collection_overdue',
        'name' => 'Old policy',
        'is_active' => true,
    ]);

    $payload = [
        'name' => 'Updated policy',
        'is_active' => true,
        'payment_plan_policy' => [
            'pause_penalties' => true,
        ],
        'stages' => [
            [
                'stage_name' => 'Reminder',
                'trigger_days' => 0,
                'order' => 1,
                'actions' => [
                    [
                        'action_type' => 'notification',
                        'configuration' => [
                            'channel' => 'email',
                        ],
                        'is_enabled' => true,
                    ],
                ],
            ],
        ],
    ];

    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->postJson(route('admin.compliance.policies.update', $policy), $payload)
        ->assertOk()
        ->assertJsonPath('message', 'Policy updated successfully');

    $this->assertDatabaseHas('compliance_policies', [
        'id' => $policy->id,
        'estate_id' => $this->estate->id,
        'name' => 'Updated policy',
    ]);

    $this->assertDatabaseHas('policy_stages', [
        'compliance_policy_id' => $policy->id,
        'stage_name' => 'Reminder',
        'trigger_days' => 0,
        'order' => 1,
    ]);

    $stage = $policy->stages()->firstOrFail();

    $this->assertDatabaseHas('policy_actions', [
        'policy_stage_id' => $stage->id,
        'action_type' => 'notification',
        'is_enabled' => true,
    ]);
});

it('rejects policy updates for another estate', function () {
    $policy = CompliancePolicy::query()->create([
        'estate_id' => $this->otherEstate->id,
        'violation_type' => 'collection_overdue',
        'name' => 'Other estate policy',
        'is_active' => true,
    ]);

    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->postJson(route('admin.compliance.policies.update', $policy), [
            'name' => 'Hijacked policy',
            'is_active' => true,
            'stages' => [
                [
                    'stage_name' => 'Reminder',
                    'trigger_days' => 0,
                    'order' => 1,
                ],
            ],
        ])
        ->assertNotFound();

    $this->assertDatabaseHas('compliance_policies', [
        'id' => $policy->id,
        'name' => 'Other estate policy',
    ]);
});

it('rejects payment-plan and resolution submissions for another estate violation', function () {
    $resident = User::factory()->create();
    $this->otherEstate->users()->attach($resident->id, ['status' => 'accepted']);

    $violation = Violation::query()->create([
        'estate_id' => $this->otherEstate->id,
        'user_id' => $resident->id,
        'violation_type' => 'collection_overdue',
        'status' => 'open',
        'original_amount' => 5000,
        'outstanding_amount' => 5000,
    ]);

    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->postJson(route('admin.compliance.violations.payment-plan', $violation), [
            'installment_amount' => 1000,
            'frequency' => 'monthly',
            'start_date' => now()->addDay()->toDateString(),
        ])
        ->assertNotFound();

    $this->actingAs($this->adminUser)
        ->withSession(['active_context_assignment_id' => $this->adminAssignment->id])
        ->postJson(route('admin.compliance.violations.resolve', $violation), [
            'reason' => 'Manual override',
        ])
        ->assertNotFound();

    $this->assertDatabaseHas('compliance_violations', [
        'id' => $violation->id,
        'status' => 'open',
        'resolved_at' => null,
    ]);
});
