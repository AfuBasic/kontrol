<?php

namespace App\Console\Commands\Demo;

use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Collection;
use App\Models\CollectionAssignment;
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
use App\Models\OrganizationPublicWindow;
use App\Models\Property;
use App\Models\SecurityEvent;
use App\Models\SosEvent;
use App\Models\User;
use App\Models\VisitorProfile;
use App\Models\Zone;
use Database\Seeders\DemoSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class WipeDemoData extends Command
{
    protected $signature = 'demo:wipe {--force : Required to confirm deletion}';

    protected $description = 'Wipe all demo-seeded data tagged with @demo.kontrol.test';

    public function handle(): int
    {
        if (! $this->option('force')) {
            $this->error('You must pass --force to confirm wipe. This is destructive!');

            return self::FAILURE;
        }

        if (! $this->confirm('This will delete all demo-tagged records. Continue?', true)) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        $this->info('Wiping demo data...');

        DB::transaction(function () {
            $demoUserIds = User::where('email', 'like', '%@'.DemoSeeder::DEMO_DOMAIN)->pluck('id');

            // Incident sub-records (soft-delete aware)
            $demoIncidentIds = Incident::where('estate_id', 1)->pluck('id');
            IncidentComment::whereIn('incident_id', $demoIncidentIds)->forceDelete();
            Incident::whereIn('id', $demoIncidentIds)->forceDelete();
            $this->line('  ✓ Incidents wiped');

            // Board posts & comments
            $demoPostIds = EstateBoardPost::whereIn('user_id', $demoUserIds)
                ->orWhere('estate_id', 1)
                ->pluck('id');
            EstateBoardComment::whereIn('board_post_id', $demoPostIds)->delete();
            EstateBoardPost::whereIn('id', $demoPostIds)->delete();
            $this->line('  ✓ Board posts & comments wiped');

            // Security & SOS events
            SecurityEvent::whereIn('user_id', $demoUserIds)->delete();
            SosEvent::where('estate_id', 1)->whereIn('user_id', $demoUserIds)->delete();
            $this->line('  ✓ Security & SOS events wiped');

            // Access logs & codes
            AccessLog::where('estate_id', 1)->delete();
            AccessCode::where('estate_id', 1)->whereIn('user_id', $demoUserIds)->delete();
            $this->line('  ✓ Access logs & codes wiped');

            // Visitor profiles
            VisitorProfile::where('estate_id', 1)->whereNotNull('id')->delete();
            $this->line('  ✓ Visitor profiles wiped');

            // Collections & assignments
            $demoCollectionIds = Collection::where('estate_id', 1)
                ->where('description', 'like', '[DEMO]%')
                ->pluck('id');
            CollectionAssignment::whereIn('collection_id', $demoCollectionIds)->delete();
            Collection::whereIn('id', $demoCollectionIds)->delete();
            $this->line('  ✓ Collections & assignments wiped');

            // Transactions
            EstateTransaction::where('estate_id', 1)
                ->where('description', 'like', '[DEMO]%')
                ->delete();
            $this->line('  ✓ Transactions wiped');

            // Orgs
            $demoOrgIds = EstateOrganization::where('estate_id', 1)
                ->where('notes', 'like', '[DEMO]%')
                ->pluck('id');
            $demoInviteIds = OrganizationBulkInvite::whereIn('organization_id', $demoOrgIds)->pluck('id');
            OrganizationBulkInviteRecipient::whereIn('bulk_invite_id', $demoInviteIds)->delete();
            OrganizationBulkInvite::whereIn('id', $demoInviteIds)->delete();
            OrganizationMembership::whereIn('organization_id', $demoOrgIds)->delete();
            DB::table('organization_access_members')->whereIn('organization_id', $demoOrgIds)->delete();
            OrganizationPublicWindow::whereIn('organization_id', $demoOrgIds)->delete();
            EstateOrganization::whereIn('id', $demoOrgIds)->delete();
            $this->line('  ✓ Organizations & bulk invites wiped');

            // Household members
            HouseholdMember::whereIn('primary_resident_id', $demoUserIds)
                ->orWhereIn('household_member_id', $demoUserIds)
                ->delete();
            $this->line('  ✓ Household members wiped');

            // Properties owned by demo owners
            Property::whereIn('property_owner_id', $demoUserIds)->delete();
            $this->line('  ✓ Properties wiped');

            // Zones
            Zone::where('estate_id', 1)->delete();
            $this->line('  ✓ Zones wiped');

            // Detach from estate pivot
            DB::table('estate_user')->whereIn('user_id', $demoUserIds)->delete();
            $this->line('  ✓ Estate memberships wiped');

            // Demo users
            $count = User::whereIn('id', $demoUserIds)->count();
            User::whereIn('id', $demoUserIds)->delete();
            $this->line("  ✓ {$count} demo users deleted");
        });

        $this->info('Demo data wiped successfully.');

        return self::SUCCESS;
    }
}
