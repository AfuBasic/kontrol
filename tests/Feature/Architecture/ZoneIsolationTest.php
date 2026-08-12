<?php

namespace Tests\Feature\Architecture;

use App\Auth\ActiveContext;
use App\Auth\ContextManager;
use App\Enums\IncidentCategory;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\Resident;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ZoneIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Estate $estateA;

    protected Estate $estateB;

    protected Zone $zoneA1;

    protected Zone $zoneA2;

    protected Zone $zoneB1;

    protected User $securityZoneA1;

    protected User $adminEstateA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->estateA = Estate::factory()->create();
        $this->estateB = Estate::factory()->create();

        $this->zoneA1 = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A1', 'is_active' => true]);
        $this->zoneA2 = Zone::create(['estate_id' => $this->estateA->id, 'name' => 'Zone A2', 'is_active' => true]);
        $this->zoneB1 = Zone::create(['estate_id' => $this->estateB->id, 'name' => 'Zone B1', 'is_active' => true]);

        $this->securityZoneA1 = User::factory()->create();
        $this->securityZoneA1->estates()->attach($this->estateA, [
            'status' => 'accepted',
            'zone_id' => $this->zoneA1->id,
            'relationship_type' => 'security',
        ]);

        $this->adminEstateA = User::factory()->create();
        $this->adminEstateA->estates()->attach($this->estateA, [
            'status' => 'accepted',
            'relationship_type' => 'staff',
        ]);

        Role::firstOrCreate(['name' => 'resident']);

        // Ensure residents
        $resA1 = User::factory()->create();
        $resA1->estates()->attach($this->estateA, [
            'status' => 'accepted',
            'zone_id' => $this->zoneA1->id,
            'relationship_type' => 'resident',
        ]);
        setPermissionsTeamId($this->estateA->id);
        $resA1->assignRole('resident');

        $resA2 = User::factory()->create();
        $resA2->estates()->attach($this->estateA, [
            'status' => 'accepted',
            'zone_id' => $this->zoneA2->id,
            'relationship_type' => 'resident',
        ]);
        $resA2->assignRole('resident');

        $resB1 = User::factory()->create();
        $resB1->estates()->attach($this->estateB, [
            'status' => 'accepted',
            'zone_id' => $this->zoneB1->id,
            'relationship_type' => 'resident',
        ]);
        setPermissionsTeamId($this->estateB->id);
        $resB1->assignRole('resident');

        // Create isolated records
        Incident::withoutZoneIsolation()->create([
            'estate_id' => $this->estateA->id,
            'zone_id' => $this->zoneA1->id,
            'reporter_id' => $resA1->id,
            'reporter_type' => 'App\Models\User',
            'source' => IncidentSource::ResidentReport,
            'title' => 'Incident A1',
            'body' => 'Body',
            'category' => IncidentCategory::Security,
            'priority' => IncidentPriority::High,
            'status' => IncidentStatus::Pending,
        ]);
        Incident::withoutZoneIsolation()->create([
            'estate_id' => $this->estateA->id,
            'zone_id' => $this->zoneA2->id,
            'reporter_id' => $resA2->id,
            'reporter_type' => 'App\Models\User',
            'source' => IncidentSource::ResidentReport,
            'title' => 'Incident A2',
            'body' => 'Body',
            'category' => IncidentCategory::Security,
            'priority' => IncidentPriority::High,
            'status' => IncidentStatus::Pending,
        ]);
        Incident::withoutZoneIsolation()->create([
            'estate_id' => $this->estateB->id,
            'zone_id' => $this->zoneB1->id,
            'reporter_id' => $resB1->id,
            'reporter_type' => 'App\Models\User',
            'source' => IncidentSource::ResidentReport,
            'title' => 'Incident B1',
            'body' => 'Body',
            'category' => IncidentCategory::Security,
            'priority' => IncidentPriority::High,
            'status' => IncidentStatus::Pending,
        ]);
    }

    public function test_zone_a1_user_can_only_see_zone_a1_records()
    {
        $context = new ActiveContext(
            $this->securityZoneA1->id,
            $this->estateA->id,
            1,
            1,
            $this->zoneA1->id
        );
        $this->instance(ContextManager::class, \Mockery::mock(ContextManager::class, function ($mock) use ($context) {
            $mock->shouldReceive('current')->andReturn($context);
        }));

        setPermissionsTeamId($context->estateId);

        $incidents = Incident::all();
        $this->assertCount(1, $incidents);
        $this->assertEquals($this->zoneA1->id, $incidents->first()->zone_id);

        $residents = Resident::all();
        $this->assertCount(1, $residents);

    }

    public function test_estate_admin_sees_all_estate_zones_but_not_other_estates()
    {
        $context = new ActiveContext(
            $this->adminEstateA->id,
            $this->estateA->id,
            1,
            1,
            null
        );
        $this->instance(ContextManager::class, \Mockery::mock(ContextManager::class, function ($mock) use ($context) {
            $mock->shouldReceive('current')->andReturn($context);
        }));

        setPermissionsTeamId($context->estateId);

        $incidents = Incident::all();
        $this->assertCount(2, $incidents);
        $this->assertTrue($incidents->pluck('zone_id')->contains($this->zoneA1->id));
        $this->assertTrue($incidents->pluck('zone_id')->contains($this->zoneA2->id));
        $this->assertFalse($incidents->pluck('zone_id')->contains($this->zoneB1->id));

        $residents = Resident::all();
        $this->assertCount(2, $residents);
    }

    public function test_no_active_context_fails_closed()
    {
        // Clear context
        $this->instance(ContextManager::class, \Mockery::mock(ContextManager::class, function ($mock) {
            $mock->shouldReceive('current')->andReturn(null);
        }));

        setPermissionsTeamId(null);

        $incidents = Incident::all();
        $this->assertCount(0, $incidents);

        $residents = Resident::all();
        $this->assertCount(0, $residents);
    }

    public function test_direct_id_access_fails_closed_for_out_of_zone_records()
    {
        $context = new ActiveContext(
            $this->securityZoneA1->id,
            $this->estateA->id,
            1,
            1,
            $this->zoneA1->id
        );
        $this->instance(ContextManager::class, \Mockery::mock(ContextManager::class, function ($mock) use ($context) {
            $mock->shouldReceive('current')->andReturn($context);
        }));

        setPermissionsTeamId($context->estateId);

        $outOfZoneIncident = Incident::withoutZoneIsolation()->where('zone_id', $this->zoneA2->id)->first();

        $this->assertNull(Incident::find($outOfZoneIncident->id));
    }
}
