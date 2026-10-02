<?php

namespace Database\Seeders;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Enums\SecurityEventSeverity;
use App\Enums\SecurityEventStatus;
use App\Enums\SecurityEventType;
use App\Enums\TransactionDirection;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Collection;
use App\Models\CollectionAssignment;
use App\Models\Estate;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\EstateOrganization;
use App\Models\EstateTransaction;
use App\Models\HouseholdMember;
use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use App\Models\OrganizationMembership;
use App\Models\Property;
use App\Models\SecurityEvent;
use App\Models\SosEvent;
use App\Models\User;
use App\Models\VisitorProfile;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DemoSeeder extends Seeder
{
    /**
     * The email domain used to tag all bulk-seeded users.
     * These are non-routable and safe — they will never receive real email.
     */
    public const DEMO_DOMAIN = 'demo.kontrol.test';

    /**
     * Fixed loginable accounts, one per role.
     *
     * @var array<string, array<string, string>>
     */
    public const FIXED_ACCOUNTS = [
        'admin' => [
            'name' => 'Ada Tunde',
            'email' => 'afutunde@gmail.com',
            'role' => 'admin',
        ],
        'security' => [
            'name' => 'Demo Security',
            'email' => 'security@demo.kontrol.test',
            'role' => 'security',
        ],
        'resident' => [
            'name' => 'Demo Resident',
            'email' => 'resident@demo.kontrol.test',
            'role' => 'resident',
        ],
        'property_owner' => [
            'name' => 'Demo Landlord',
            'email' => 'landlord@demo.kontrol.test',
            'role' => 'property_owner',
        ],
        'household_member' => [
            'name' => 'Demo Household',
            'email' => 'household@demo.kontrol.test',
            'role' => 'household_member',
        ],
    ];

    /**
     * @var array<string, int>
     */
    private array $counts = [];

    public function run(): void
    {
        $estate = Estate::findOrFail(1);

        $this->command->info("Seeding demo data into estate: [{$estate->name}]");

        setPermissionsTeamId($estate->id);

        $roles = $this->ensureRolesExist();

        [$fixedUsers, $securityUsers] = $this->seedFixedAccounts($estate, $roles);

        $propertyOwners = $this->seedPropertyOwners($estate, $roles);

        $residents = $this->seedResidents($estate, $roles, $propertyOwners);

        $allUsers = $residents->merge($propertyOwners)->merge($securityUsers)->merge(collect([$fixedUsers['resident'], $fixedUsers['property_owner']]));

        $zones = $this->seedZones($estate);

        $organizations = $this->seedOrganizations($estate, $fixedUsers['admin'], $residents);

        $this->seedCollections($estate, $fixedUsers['admin'], $residents, $propertyOwners);

        $this->seedTransactions($estate, $residents);

        $accessCodes = $this->seedAccessCodes($estate, $allUsers, $securityUsers, $zones, $organizations);

        $this->seedAccessLogs($estate, $accessCodes, $securityUsers, $zones, $organizations);

        $this->seedVisitorProfiles($estate);

        $this->seedBoardPosts($estate, $fixedUsers['admin'], $residents);

        $this->seedIncidents($estate, $residents, $securityUsers, $fixedUsers['admin'], $zones);

        $this->seedSecurityEvents($allUsers);

        $this->seedSosEvents($estate, $residents, $securityUsers);

        $this->printSummary();
    }

    /**
     * @return array<string, Role>
     */
    private function ensureRolesExist(): array
    {
        $roleNames = ['admin', 'security', 'resident', 'property_owner', 'household_member'];
        $roles = [];

        foreach ($roleNames as $name) {
            $roles[$name] = Role::firstOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
            );
        }

        return $roles;
    }

    /**
     * @param  array<string, Role>  $roles
     * @return array<string, User>
     */
    private function seedFixedAccounts(Estate $estate, array $roles): array
    {
        $fixed = [];
        $securityUsers = collect();

        foreach (self::FIXED_ACCOUNTS as $key => $account) {
            $user = User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            setPermissionsTeamId($estate->id);
            $role = $roles[$account['role']];
            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }

            $estate->users()->syncWithoutDetaching([$user->id => ['status' => 'accepted']]);

            $fixed[$key] = $user;

            if ($account['role'] === 'security') {
                $securityUsers->push($user);
            }
        }

        $this->counts['fixed_accounts'] = count($fixed);

        return [$fixed, $securityUsers];
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function seedPropertyOwners(Estate $estate, array $roles): \Illuminate\Support\Collection
    {
        $this->command->info('Seeding 100 property owners...');

        $owners = collect();

        foreach (range(1, 100) as $i) {
            $joinedAt = now()->subDays(rand(30, 365));
            $owner = User::create([
                'name' => fake()->name(),
                'email' => 'owner'.str_pad($i, 4, '0', STR_PAD_LEFT).'@'.self::DEMO_DOMAIN,
                'password' => Hash::make('password'),
                'email_verified_at' => $joinedAt,
                'created_at' => $joinedAt,
                'updated_at' => $joinedAt,
            ]);

            setPermissionsTeamId($estate->id);
            $owner->assignRole($roles['property_owner']);
            $owner->assignRole($roles['resident']);
            $estate->users()->syncWithoutDetaching([$owner->id => ['status' => 'accepted']]);

            $owners->push($owner);
        }

        $this->counts['property_owners'] = $owners->count();

        return $owners;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $owners
     * @return \Illuminate\Support\Collection<int, User>
     */
    private function seedResidents(Estate $estate, array $roles, \Illuminate\Support\Collection $owners): \Illuminate\Support\Collection
    {
        $this->command->info('Seeding 3,000 residents (30 per property owner)...');

        $residents = collect();
        $counter = 0;

        foreach ($owners as $owner) {
            /** @var Property $property */
            $property = Property::firstOrCreate(
                ['estate_id' => $estate->id, 'property_owner_id' => $owner->id],
                ['name' => 'Block '.fake()->randomLetter().'-'.rand(1, 50)],
            );

            foreach (range(1, 30) as $j) {
                $counter++;
                $joinedAt = now()->subDays(rand(1, 365));

                $resident = User::create([
                    'name' => fake()->name(),
                    'email' => 'resident'.str_pad($counter, 5, '0', STR_PAD_LEFT).'@'.self::DEMO_DOMAIN,
                    'password' => Hash::make('password'),
                    'email_verified_at' => $joinedAt,
                    'created_at' => $joinedAt,
                    'updated_at' => $joinedAt,
                ]);

                setPermissionsTeamId($estate->id);
                $resident->assignRole($roles['resident']);
                $estate->users()->syncWithoutDetaching([
                    $resident->id => [
                        'status' => 'accepted',
                        'property_owner_id' => $owner->id,
                    ],
                ]);

                $resident->profile()->updateOrCreate([], ['property_id' => $property->id]);

                // Occasionally add a household member (fake user, no login needed)
                if (rand(1, 5) === 1) {
                    $memberUser = User::create([
                        'name' => fake()->name(),
                        'email' => 'hh'.str_pad($counter, 5, '0', STR_PAD_LEFT).'@'.self::DEMO_DOMAIN,
                        'password' => Hash::make('password'),
                        'email_verified_at' => $joinedAt,
                        'created_at' => $joinedAt,
                        'updated_at' => $joinedAt,
                    ]);

                    setPermissionsTeamId($estate->id);
                    $memberUser->assignRole($roles['household_member']);
                    $estate->users()->syncWithoutDetaching([$memberUser->id => ['status' => 'accepted']]);

                    HouseholdMember::create([
                        'estate_id' => $estate->id,
                        'primary_resident_id' => $resident->id,
                        'household_member_id' => $memberUser->id,
                    ]);
                }

                $residents->push($resident);
            }
        }

        $this->counts['residents'] = $residents->count();

        return $residents;
    }

    /**
     * @return \Illuminate\Support\Collection<int, Zone>
     */
    private function seedZones(Estate $estate): \Illuminate\Support\Collection
    {
        $zoneNames = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E', 'Block F'];
        $zones = collect();

        foreach ($zoneNames as $name) {
            $zones->push(Zone::firstOrCreate(
                ['estate_id' => $estate->id, 'name' => $name],
            ));
        }

        $this->counts['zones'] = $zones->count();

        return $zones;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     * @return \Illuminate\Support\Collection<int, EstateOrganization>
     */
    private function seedOrganizations(Estate $estate, User $admin, \Illuminate\Support\Collection $residents): \Illuminate\Support\Collection
    {
        $this->command->info('Seeding 20 organizations with access members and bulk invites...');

        $orgDefs = [
            ['name' => 'Greenfield Academy', 'type' => 'school', 'access_policy' => 'managed'],
            ['name' => 'St. Paul\'s Church', 'type' => 'church', 'access_policy' => 'public_window'],
            ['name' => 'Heritage Hospital', 'type' => 'hospital', 'access_policy' => 'unrestricted'],
            ['name' => 'Apex Tech Solutions', 'type' => 'business', 'access_policy' => 'managed'],
            ['name' => 'Sunrise Islamic Centre', 'type' => 'church', 'access_policy' => 'public_window'],
            ['name' => 'Golden Heights Clinic', 'type' => 'hospital', 'access_policy' => 'unrestricted'],
            ['name' => 'Brilla FC Academy', 'type' => 'other', 'access_policy' => 'managed'],
            ['name' => 'Meridian Supermarket', 'type' => 'business', 'access_policy' => 'unrestricted'],
            ['name' => 'Valley Primary School', 'type' => 'school', 'access_policy' => 'managed'],
            ['name' => 'Omega Pharmacy', 'type' => 'business', 'access_policy' => 'unrestricted'],
            ['name' => 'Christ Embassy Branch', 'type' => 'church', 'access_policy' => 'public_window'],
            ['name' => 'EduBridge Tutors', 'type' => 'school', 'access_policy' => 'managed'],
            ['name' => 'Radiant Beauty Salon', 'type' => 'business', 'access_policy' => 'unrestricted'],
            ['name' => 'Wellbeing Physiotherapy', 'type' => 'hospital', 'access_policy' => 'managed'],
            ['name' => 'Trinity Chapel', 'type' => 'church', 'access_policy' => 'public_window'],
            ['name' => 'Pinnacle Construction Ltd', 'type' => 'business', 'access_policy' => 'managed'],
            ['name' => 'Kids Corner Daycare', 'type' => 'school', 'access_policy' => 'managed'],
            ['name' => 'Fresh Fields Catering', 'type' => 'business', 'access_policy' => 'unrestricted'],
            ['name' => 'Impact Labs', 'type' => 'business', 'access_policy' => 'managed'],
            ['name' => 'Community Mosque', 'type' => 'church', 'access_policy' => 'public_window'],
        ];

        $organizations = collect();
        $recipientCounter = 0;

        foreach ($orgDefs as $def) {
            $org = EstateOrganization::firstOrCreate(
                ['estate_id' => $estate->id, 'name' => $def['name']],
                [
                    'type' => $def['type'],
                    'access_policy' => $def['access_policy'],
                    'is_active' => true,
                    'notes' => '[DEMO] Seeded organization.',
                ],
            );

            // Add public windows for public_window orgs
            if ($def['access_policy'] === 'public_window') {
                $windowDays = $def['type'] === 'church'
                    ? [0, 3] // Sunday & Wednesday
                    : [1, 2, 3, 4, 5]; // weekdays

                foreach ($windowDays as $day) {
                    $org->publicWindows()->firstOrCreate(
                        ['day_of_week' => $day],
                        [
                            'name' => $day === 0 ? 'Sunday Service' : 'Open Hours',
                            'start_time' => '08:00:00',
                            'end_time' => $day === 0 ? '14:00:00' : '18:00:00',
                            'is_active' => true,
                        ],
                    );
                }
            }

            // Add org memberships from residents
            $memberSample = $residents->random(min(20, $residents->count()));
            foreach ($memberSample as $resident) {
                OrganizationMembership::firstOrCreate(
                    ['user_id' => $resident->id, 'organization_id' => $org->id],
                    ['role' => 'member', 'is_active' => true, 'invited_by' => $admin->id],
                );
            }

            // Bulk insert org access members (students / staff / contractors)
            $categories = ['student', 'staff', 'member', 'contractor'];
            $accessMemberRows = [];
            $memberCount = rand(50, 150);
            $now = now();

            for ($i = 0; $i < $memberCount; $i++) {
                $cat = fake()->randomElement($categories);
                $accessMemberRows[] = [
                    'organization_id' => $org->id,
                    'name' => fake()->name(),
                    'identifier' => strtoupper($cat[0]).'-'.str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'category' => $cat,
                    'status' => fake()->randomElement(['active', 'active', 'active', 'suspended', 'expired']),
                    'valid_from' => now()->subYear()->toDateString(),
                    'valid_until' => now()->addYear()->toDateString(),
                    'metadata' => json_encode(['department' => fake()->word(), 'phone' => fake()->phoneNumber()]),
                    'created_by' => $admin->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (collect($accessMemberRows)->chunk(200) as $chunk) {
                DB::table('organization_access_members')->insert($chunk->toArray());
            }

            // Bulk invites (3–6 per org)
            $inviteCount = rand(3, 6);
            for ($b = 0; $b < $inviteCount; $b++) {
                $validFrom = now()->subMonths(rand(1, 10));
                $validUntil = $validFrom->copy()->addMonths(rand(3, 12));

                $invite = OrganizationBulkInvite::create([
                    'organization_id' => $org->id,
                    'estate_id' => $estate->id,
                    'created_by' => $admin->id,
                    'name' => fake()->randomElement(['Staff Access Pass', 'Student Entry', 'Contractor Permit', 'Member Pass']).' '.$validFrom->format('M Y'),
                    'purpose' => '[DEMO] '.fake()->sentence(5),
                    'role' => fake()->randomElement(['member', 'staff', 'student']),
                    'valid_from' => $validFrom->toDateString(),
                    'valid_until' => $validUntil->toDateString(),
                    'auto_renew' => fake()->boolean(40),
                    'send_immediately' => true,
                    'status' => 'active',
                    'last_renewed_at' => fake()->optional(0.5)->dateTimeBetween($validFrom, 'now'),
                    'next_renewal_at' => $validUntil->toDateString(),
                ]);

                // Bulk insert recipients (80–200 per invite)
                $recipientCount = rand(80, 200);
                $recipientRows = [];
                $deliveryStatuses = ['sent', 'sent', 'sent', 'sent', 'pending', 'failed'];

                for ($r = 0; $r < $recipientCount; $r++) {
                    $recipientCounter++;
                    $deliveryStatus = fake()->randomElement($deliveryStatuses);
                    $recipientRows[] = [
                        'bulk_invite_id' => $invite->id,
                        'email' => 'inv'.str_pad($recipientCounter, 6, '0', STR_PAD_LEFT).'@'.self::DEMO_DOMAIN,
                        'status' => 'active',
                        'last_access_code_id' => null,
                        'last_delivered_at' => $deliveryStatus === 'sent' ? $validFrom->copy()->addDays(rand(1, 30)) : null,
                        'delivery_status' => $deliveryStatus,
                        'delivery_error' => $deliveryStatus === 'failed' ? 'Mailbox unavailable.' : null,
                        'created_at' => $validFrom,
                        'updated_at' => $validFrom,
                    ];
                }

                foreach (collect($recipientRows)->chunk(200) as $chunk) {
                    DB::table('organization_bulk_invite_recipients')->insert($chunk->toArray());
                }
            }

            $organizations->push($org);
        }

        $this->counts['organizations'] = $organizations->count();
        $this->counts['bulk_invite_recipients'] = $recipientCounter;

        return $organizations;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     * @param  \Illuminate\Support\Collection<int, User>  $owners
     */
    private function seedCollections(Estate $estate, User $admin, \Illuminate\Support\Collection $residents, \Illuminate\Support\Collection $owners): void
    {
        $this->command->info('Seeding collections, assignments & payments...');

        $collectionsData = [
            ['name' => 'Annual Development Levy', 'amount' => 50000, 'billing_type' => 'one_time', 'applies_to' => 'all'],
            ['name' => 'Security Maintenance Fee', 'amount' => 5000, 'billing_type' => 'recurring', 'recurring_interval' => 'monthly', 'applies_to' => 'all'],
            ['name' => 'Waste Management Fee', 'amount' => 2000, 'billing_type' => 'recurring', 'recurring_interval' => 'monthly', 'applies_to' => 'all'],
            ['name' => 'Estate Road Rehabilitation', 'amount' => 75000, 'billing_type' => 'one_time', 'applies_to' => 'all'],
            ['name' => 'Swimming Pool Maintenance', 'amount' => 10000, 'billing_type' => 'recurring', 'recurring_interval' => 'quarterly', 'applies_to' => 'all'],
            ['name' => 'Street Light Levy', 'amount' => 3000, 'billing_type' => 'recurring', 'recurring_interval' => 'monthly', 'applies_to' => 'all'],
            ['name' => 'Ground Rent', 'amount' => 100000, 'billing_type' => 'recurring', 'recurring_interval' => 'yearly', 'applies_to' => 'property_owner'],
            ['name' => 'Service Charge', 'amount' => 15000, 'billing_type' => 'recurring', 'recurring_interval' => 'monthly', 'applies_to' => 'property_owner'],
            ['name' => 'Emergency Fund Contribution', 'amount' => 20000, 'billing_type' => 'one_time', 'applies_to' => 'all'],
            ['name' => 'Generator Maintenance Levy', 'amount' => 8000, 'billing_type' => 'recurring', 'recurring_interval' => 'monthly', 'applies_to' => 'all'],
        ];

        $collectionCount = 0;
        $assignmentCount = 0;
        $paymentCount = 0;

        foreach ($collectionsData as $def) {
            $startDate = now()->subMonths(rand(3, 12));
            $dueDate = $startDate->copy()->addDays(rand(30, 90));

            $collection = Collection::firstOrCreate(
                ['estate_id' => $estate->id, 'name' => $def['name']],
                [
                    'description' => '[DEMO] '.fake()->sentence(),
                    'amount' => $def['amount'],
                    'billing_type' => $def['billing_type'],
                    'recurring_interval' => $def['recurring_interval'] ?? null,
                    'start_date' => $startDate->toDateString(),
                    'due_day' => 1,
                    'grace_days' => 5,
                    'late_fee' => null,
                    'applies_to' => $def['applies_to'],
                    'status' => 'active',
                    'created_by' => $admin->id,
                ],
            );

            $collectionCount++;

            $targetUsers = $def['applies_to'] === 'property_owner' ? $owners : $residents;
            $paymentStatuses = ['paid', 'paid', 'paid', 'pending', 'overdue'];

            // Assign to a subset for performance (max 500 users per collection)
            $assignTo = $targetUsers->take(500);
            $assignmentRows = [];
            $paymentRows = [];
            $now = now();

            foreach ($assignTo as $user) {
                $status = fake()->randomElement($paymentStatuses);
                $assignmentRows[] = [
                    'collection_id' => $collection->id,
                    'estate_id' => $estate->id,
                    'user_id' => $user->id,
                    'amount_due' => $def['amount'],
                    'amount_paid' => $status === 'paid' ? $def['amount'] : 0,
                    'status' => $status,
                    'due_date' => $dueDate->toDateString(),
                    'paid_at' => $status === 'paid' ? $startDate->copy()->addDays(rand(1, 25)) : null,
                    'created_at' => $startDate,
                    'updated_at' => $now,
                ];
            }

            foreach (collect($assignmentRows)->chunk(300) as $chunk) {
                DB::table('collection_assignments')->insert($chunk->toArray());
                $assignmentCount += count($chunk);
            }
        }

        $this->counts['collections'] = $collectionCount;
        $this->counts['collection_assignments'] = $assignmentCount;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     */
    private function seedTransactions(Estate $estate, \Illuminate\Support\Collection $residents): void
    {
        $this->command->info('Seeding 2,000 estate transactions (12 months)...');

        $types = [TransactionType::CollectionPayment, TransactionType::Refund];
        $rows = [];
        $sampleResidents = $residents->random(min(200, $residents->count()));

        for ($i = 1; $i <= 2000; $i++) {
            $type = fake()->randomElement($types);
            $paidAt = now()->subDays(rand(0, 365));

            $rows[] = [
                'estate_id' => $estate->id,
                'user_id' => $sampleResidents->random()->id,
                'type' => $type->value,
                'direction' => $type === TransactionType::Refund ? TransactionDirection::Debit->value : TransactionDirection::Credit->value,
                'amount' => fake()->numberBetween(100000, 5000000),
                'currency' => 'NGN',
                'status' => TransactionStatus::Success->value,
                'payment_method' => 'paystack',
                'provider' => 'paystack',
                'reference_number' => 'KTR-'.str_pad($i, 6, '0', STR_PAD_LEFT),
                'gateway_reference' => 'DEMO-'.Str::ulid(),
                'description' => '[DEMO] '.fake()->sentence(3),
                'idempotency_key' => 'demo_'.Str::ulid(),
                'paid_at' => $paidAt,
                'created_at' => $paidAt,
                'updated_at' => $paidAt,
            ];
        }

        foreach (collect($rows)->chunk(300) as $chunk) {
            DB::table('estate_transactions')->insert($chunk->toArray());
        }

        $this->counts['transactions'] = 2000;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $allUsers
     * @param  \Illuminate\Support\Collection<int, User>  $securityUsers
     * @param  \Illuminate\Support\Collection<int, Zone>  $zones
     * @param  \Illuminate\Support\Collection<int, EstateOrganization>  $organizations
     * @return \Illuminate\Support\Collection<int, AccessCode>
     */
    private function seedAccessCodes(Estate $estate, \Illuminate\Support\Collection $allUsers, \Illuminate\Support\Collection $securityUsers, \Illuminate\Support\Collection $zones, \Illuminate\Support\Collection $organizations): \Illuminate\Support\Collection
    {
        $this->command->info('Seeding 3,000 access codes...');

        $statuses = ['active', 'used', 'used', 'used', 'expired', 'revoked'];
        $types = ['single_use', 'single_use', 'long_lived'];
        $purposes = ['Visit', 'Delivery', 'Service', 'Family', 'Business', 'Medical', 'Maintenance'];
        $entryPoints = ['Main Gate', 'Side Gate', 'Back Entrance', 'Pedestrian Gate'];

        $rows = [];
        $sampleUsers = $allUsers->random(min(500, $allUsers->count()));

        for ($i = 1; $i <= 3000; $i++) {
            $status = fake()->randomElement($statuses);
            $createdAt = now()->subDays(rand(0, 365));
            $expiresAt = (clone $createdAt)->addHours(rand(2, 72));

            $rows[] = [
                'estate_id' => $estate->id,
                'organization_id' => rand(1, 3) === 1 ? $organizations->random()->id : null,
                'organization_member_id' => null,
                'bulk_invite_recipient_id' => null,
                'user_id' => $sampleUsers->random()->id,
                'code' => strtoupper(Str::random(6)),
                'pass_uuid' => (string) Str::uuid(),
                'qr_token' => Str::random(40),
                'qr_image_path' => null,
                'type' => fake()->randomElement($types),
                'source' => AccessCodeSource::Web->value,
                'visitor_name' => fake()->name(),
                'visitor_phone' => fake()->phoneNumber(),
                'purpose' => fake()->randomElement($purposes),
                'status' => $status,
                'expires_at' => $expiresAt,
                'used_at' => $status === 'used' ? (clone $createdAt)->addHours(rand(1, 24)) : null,
                'scanned_at' => $status === 'used' ? (clone $createdAt)->addHours(rand(1, 24)) : null,
                'revoked_at' => $status === 'revoked' ? (clone $createdAt)->addDays(rand(1, 5)) : null,
                'verified_by' => $securityUsers->isNotEmpty() ? $securityUsers->random()->id : null,
                'has_vehicle' => (bool) rand(0, 1),
                'notes' => null,
                'share_count' => 0,
                'last_shared_at' => null,
                'starts_at' => null,
                'schedule_type' => null,
                'schedule_data' => null,
                'guest_limit' => null,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];
        }

        foreach (collect($rows)->chunk(300) as $chunk) {
            DB::table('access_codes')->insert($chunk->toArray());
        }

        $this->counts['access_codes'] = 3000;

        return AccessCode::where('estate_id', $estate->id)->latest()->limit(3000)->get();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, AccessCode>  $accessCodes
     * @param  \Illuminate\Support\Collection<int, User>  $securityUsers
     * @param  \Illuminate\Support\Collection<int, Zone>  $zones
     * @param  \Illuminate\Support\Collection<int, EstateOrganization>  $organizations
     */
    private function seedAccessLogs(Estate $estate, \Illuminate\Support\Collection $accessCodes, \Illuminate\Support\Collection $securityUsers, \Illuminate\Support\Collection $zones, \Illuminate\Support\Collection $organizations): void
    {
        $this->command->info('Seeding 5,000 access logs...');

        $entryPoints = ['Main Gate', 'Side Gate', 'Back Entrance', 'Pedestrian Gate'];
        $rows = [];

        for ($i = 0; $i < 5000; $i++) {
            $verifiedAt = now()->subDays(rand(0, 365));
            $checkedOutAt = rand(1, 3) !== 1 ? (clone $verifiedAt)->addMinutes(rand(15, 480)) : null;

            $rows[] = [
                'estate_id' => $estate->id,
                'organization_id' => rand(1, 4) === 1 ? $organizations->random()->id : null,
                'zone_id' => $zones->isNotEmpty() ? $zones->random()->id : null,
                'visitor_profile_id' => null,
                'access_code_id' => $accessCodes->isNotEmpty() ? $accessCodes->random()->id : null,
                'entry_point' => fake()->randomElement($entryPoints),
                'verified_by' => $securityUsers->isNotEmpty() ? $securityUsers->random()->id : null,
                'verified_at' => $verifiedAt,
                'checked_out_at' => $checkedOutAt,
                'checked_out_by' => $checkedOutAt && $securityUsers->isNotEmpty() ? $securityUsers->random()->id : null,
                'vehicle_plate_number' => rand(1, 4) === 1 ? strtoupper(fake()->bothify('??-###-??')) : null,
                'vehicle_make' => null,
                'vehicle_model' => null,
                'meta' => json_encode([]),
                'created_at' => $verifiedAt,
                'updated_at' => $verifiedAt,
            ];
        }

        foreach (collect($rows)->chunk(300) as $chunk) {
            DB::table('access_logs')->insert($chunk->toArray());
        }

        $this->counts['access_logs'] = 5000;
    }

    private function seedVisitorProfiles(Estate $estate): void
    {
        $this->command->info('Seeding 800 visitor profiles...');

        $rows = [];

        for ($i = 0; $i < 800; $i++) {
            $firstSeen = now()->subDays(rand(1, 365));
            $visitCount = rand(1, 25);

            $rows[] = [
                'estate_id' => $estate->id,
                'name' => fake()->name(),
                'id_photo_hash' => fake()->sha256(),
                'id_photo_path' => null,
                'first_seen_at' => $firstSeen,
                'last_seen_at' => $visitCount > 1 ? (clone $firstSeen)->addDays(rand(1, 100)) : null,
                'visit_count' => $visitCount,
                'notes' => null,
                'created_at' => $firstSeen,
                'updated_at' => $firstSeen,
            ];
        }

        foreach (collect($rows)->chunk(300) as $chunk) {
            DB::table('visitor_profiles')->insert($chunk->toArray());
        }

        $this->counts['visitor_profiles'] = 800;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     */
    private function seedBoardPosts(Estate $estate, User $admin, \Illuminate\Support\Collection $residents): void
    {
        $this->command->info('Seeding 200 board posts with comments...');

        $postTitles = [
            'Important: Estate AGM scheduled for next month',
            'Water supply disruption notice - Block B',
            'New security procedures effective immediately',
            'Reminder: Parking regulations enforcement starts soon',
            'Welcome to our newest residents!',
            'Maintenance work on the estate road this weekend',
            'Estate gate hours change starting October',
            'Pool renovation update — reopening date confirmed',
            'Power outage schedule from EEDC',
            'Community clean-up event this Saturday',
            'Notice: Stray animals on the estate',
            'Emergency contact numbers for all residents',
            'Speed bump installation complete',
            'CCTV upgrade across all entry points',
            'New waste collection schedule',
            null, // anonymous post (no title)
        ];

        $postCount = 0;
        $commentCount = 0;
        $sampleAuthors = $residents->random(min(50, $residents->count()));

        for ($i = 0; $i < 200; $i++) {
            $isPublished = rand(1, 10) > 2;
            $publishedAt = $isPublished ? now()->subDays(rand(0, 365)) : null;
            $author = rand(1, 3) === 1 ? $admin : $sampleAuthors->random();

            $post = EstateBoardPost::create([
                'estate_id' => $estate->id,
                'user_id' => $author->id,
                'title' => fake()->randomElement($postTitles) ?? fake()->sentence(),
                'body' => '[DEMO] '.fake()->paragraphs(rand(1, 3), true),
                'status' => $isPublished ? 'published' : 'draft',
                'published_at' => $publishedAt,
                'created_at' => $publishedAt ?? now()->subDays(rand(0, 30)),
                'updated_at' => $publishedAt ?? now()->subDays(rand(0, 30)),
            ]);

            $postCount++;

            // Comments (2–6 per post)
            if ($isPublished) {
                $commenters = $sampleAuthors->random(rand(2, 6));
                foreach ($commenters as $commenter) {
                    EstateBoardComment::create([
                        'board_post_id' => $post->id,
                        'user_id' => $commenter->id,
                        'body' => fake()->sentences(rand(1, 3), true),
                        'created_at' => (clone $publishedAt)->addDays(rand(0, 7)),
                        'updated_at' => (clone $publishedAt)->addDays(rand(0, 7)),
                    ]);
                    $commentCount++;
                }
            }
        }

        $this->counts['board_posts'] = $postCount;
        $this->counts['board_comments'] = $commentCount;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     * @param  \Illuminate\Support\Collection<int, User>  $securityUsers
     * @param  \Illuminate\Support\Collection<int, Zone>  $zones
     */
    private function seedIncidents(Estate $estate, \Illuminate\Support\Collection $residents, \Illuminate\Support\Collection $securityUsers, User $admin, \Illuminate\Support\Collection $zones): void
    {
        $this->command->info('Seeding 300 incidents with comments...');

        $titles = [
            'Suspicious person spotted near Block C',
            'Loud music from apartment 4B after midnight',
            'Car window smashed in parking lot',
            'Unknown vehicle abandoned at back gate',
            'Broken fence near rear boundary wall',
            'Power outage reported in Block A',
            'Water pipe burst near Zone 2',
            'Unauthorized vehicle in residents bay',
            'Theft of generator reported',
            'Graffiti found on boundary wall',
            'Fighting incident near the estate pool',
            'Security light out on the main road',
            'Fire scare near the kitchen area',
            'Unknown individuals loitering at main gate',
            'Flooding due to blocked drainage channel',
            'Dog biting incident near Block D',
            'Resident locked out of apartment',
            'Exposed electrical cable at children\'s park',
            'Vandalism at the estate playground',
            'Attempted break-in at Block E',
        ];

        $categories = ['Theft', 'Noise Complaint', 'Vandalism', 'Unauthorized Entry', 'Property Damage', 'Medical Emergency'];
        $priorities = IncidentPriority::cases();
        $statuses = IncidentStatus::cases();
        $sources = IncidentSource::cases();
        $sampleReporters = $residents->random(min(100, $residents->count()));

        $incidentCount = 0;
        $commentCount = 0;

        for ($i = 0; $i < 300; $i++) {
            $status = fake()->randomElement($statuses);
            $createdAt = now()->subDays(rand(0, 365));

            $incident = Incident::create([
                'estate_id' => $estate->id,
                'zone_id' => $zones->isNotEmpty() ? $zones->random()->id : null,
                'reporter_id' => $sampleReporters->random()->id,
                'reporter_type' => User::class,
                'source' => fake()->randomElement($sources),
                'title' => fake()->randomElement($titles),
                'body' => '[DEMO] '.fake()->paragraphs(2, true),
                'category' => fake()->randomElement($categories),
                'priority' => fake()->randomElement($priorities),
                'status' => $status,
                'assigned_to' => rand(1, 3) === 1 && $securityUsers->isNotEmpty() ? $securityUsers->random()->id : null,
                'upvotes_count' => rand(0, 15),
                'comments_count' => 0,
                'acknowledged_at' => in_array($status, [IncidentStatus::Acknowledged, IncidentStatus::Resolving, IncidentStatus::Solved, IncidentStatus::Closed])
                    ? (clone $createdAt)->addHours(rand(1, 12)) : null,
                'solved_at' => in_array($status, [IncidentStatus::Solved, IncidentStatus::Closed])
                    ? (clone $createdAt)->addDays(rand(1, 7)) : null,
                'closed_at' => $status === IncidentStatus::Closed
                    ? (clone $createdAt)->addDays(rand(7, 14)) : null,
                'resolving_at' => $status === IncidentStatus::Resolving
                    ? (clone $createdAt)->addHours(rand(12, 48)) : null,
                'location' => fake()->optional(0.5)->streetAddress(),
                'is_private' => (bool) rand(0, 5) === 0,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $incidentCount++;

            // Comments (1–4 per incident)
            $commenters = $sampleReporters->random(rand(1, 4));
            foreach ($commenters as $commenter) {
                IncidentComment::create([
                    'incident_id' => $incident->id,
                    'user_id' => $commenter->id,
                    'body' => fake()->paragraph(),
                    'is_official' => rand(1, 5) === 1,
                    'parent_id' => null,
                    'created_at' => (clone $createdAt)->addHours(rand(1, 48)),
                    'updated_at' => (clone $createdAt)->addHours(rand(1, 48)),
                ]);
                $commentCount++;
            }
        }

        $this->counts['incidents'] = $incidentCount;
        $this->counts['incident_comments'] = $commentCount;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $allUsers
     */
    private function seedSecurityEvents(\Illuminate\Support\Collection $allUsers): void
    {
        $this->command->info('Seeding 150 security events...');

        $sampleUsers = $allUsers->random(min(50, $allUsers->count()));

        for ($i = 0; $i < 150; $i++) {
            $detectedAt = now()->subDays(rand(0, 180));
            $status = fake()->randomElement([SecurityEventStatus::Pending, SecurityEventStatus::Resolved, SecurityEventStatus::Denied]);

            SecurityEvent::create([
                'user_id' => $sampleUsers->random()->id,
                'type' => fake()->randomElement(SecurityEventType::cases()),
                'severity' => fake()->randomElement(SecurityEventSeverity::cases()),
                'status' => $status,
                'display_name' => fake()->randomElement(['Chrome on macOS', 'Safari on iPhone', 'Firefox on Windows', 'Chrome on Android']),
                'approximate_location' => fake()->city().', '.fake()->country(),
                'request_ip' => fake()->ipv4(),
                'detected_at' => $detectedAt,
                'resolved_at' => $status !== SecurityEventStatus::Pending ? (clone $detectedAt)->addHours(rand(1, 24)) : null,
                'resolution' => $status === SecurityEventStatus::Resolved ? 'Authorized by account owner.' : ($status === SecurityEventStatus::Denied ? 'Denied by account owner.' : null),
                'timeline' => [
                    ['at' => $detectedAt->toIso8601String(), 'type' => 'detected', 'label' => 'Event detected.', 'metadata' => []],
                ],
                'metadata' => [],
                'created_at' => $detectedAt,
                'updated_at' => $detectedAt,
            ]);
        }

        $this->counts['security_events'] = 150;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $residents
     * @param  \Illuminate\Support\Collection<int, User>  $securityUsers
     */
    private function seedSosEvents(Estate $estate, \Illuminate\Support\Collection $residents, \Illuminate\Support\Collection $securityUsers): void
    {
        $this->command->info('Seeding 40 SOS events...');

        $sampleResidents = $residents->random(min(40, $residents->count()));

        for ($i = 0; $i < 40; $i++) {
            $triggeredAt = now()->subDays(rand(0, 180));
            $isAcknowledged = rand(0, 1) === 1;

            SosEvent::create([
                'user_id' => $sampleResidents->random()->id,
                'estate_id' => $estate->id,
                'triggered_at' => $triggeredAt,
                'status' => $isAcknowledged ? 'acknowledged' : 'pending',
                'acknowledged_at' => $isAcknowledged ? (clone $triggeredAt)->addMinutes(rand(5, 60)) : null,
                'acknowledged_by' => $isAcknowledged && $securityUsers->isNotEmpty() ? $securityUsers->random()->id : null,
                'created_at' => $triggeredAt,
                'updated_at' => $triggeredAt,
            ]);
        }

        $this->counts['sos_events'] = 40;
    }

    private function printSummary(): void
    {
        $this->command->newLine();
        $this->command->info('✅ Demo seeding complete!');
        $this->command->table(
            ['Entity', 'Count'],
            collect($this->counts)->map(fn ($count, $key) => [
                str_replace('_', ' ', ucfirst($key)),
                number_format($count),
            ])->values()->toArray(),
        );
        $this->command->newLine();
        $this->command->line('  <fg=green>Loginable accounts (password: password)</>');
        $this->command->line('  Admin           → afutunde@gmail.com');
        $this->command->line('  Security        → security@demo.kontrol.test');
        $this->command->line('  Resident        → resident@demo.kontrol.test');
        $this->command->line('  Property Owner  → landlord@demo.kontrol.test');
        $this->command->line('  Household       → household@demo.kontrol.test');
        $this->command->newLine();
    }
}
