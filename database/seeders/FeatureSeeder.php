<?php

namespace Database\Seeders;

use App\Models\Feature;
use Illuminate\Database\Seeder;

class FeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $features = [
            // Admin Module - Basic
            ['name' => 'Approval Portal', 'slug' => 'approval-portal', 'description' => 'Manage resident approvals and invitations', 'group' => 'admin', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],
            ['name' => 'Secure Invitations', 'slug' => 'secure-invitations', 'description' => 'Send secure invitation links to residents', 'group' => 'admin', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],
            ['name' => 'Resident Directory', 'slug' => 'resident-directory', 'description' => 'View and manage all residents in the estate', 'group' => 'admin', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],
            ['name' => 'Estate Board', 'slug' => 'estate-board', 'description' => 'Post announcements and notices to residents', 'group' => 'admin', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],

            // Admin Module - Growth
            ['name' => 'Estate Analytics Dashboard', 'slug' => 'estate-analytics-dashboard', 'description' => 'Dashboard with estate metrics and analytics', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Activity Logs', 'slug' => 'activity-logs', 'description' => 'Comprehensive audit trail of admin actions', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Comment Moderation', 'slug' => 'comment-moderation', 'description' => 'Moderate comments on estate board posts', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Automated Invoicing', 'slug' => 'automated-invoicing', 'description' => 'Automatically generate invoices for residents', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Payment Collection', 'slug' => 'payment-collection', 'description' => 'Collect payments via Paystack integration', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Smart Billing Config', 'slug' => 'smart-billing-config', 'description' => 'Configure billing rules and charge models', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Security Personnel Management', 'slug' => 'security-personnel-management', 'description' => 'Manage security staff and their permissions', 'group' => 'admin', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],

            // Admin Module - Pro
            ['name' => 'Financial Audit', 'slug' => 'financial-audit', 'description' => 'View detailed financial transaction logs', 'group' => 'admin', 'suggested_plan' => 'pro', 'is_global' => true, 'is_active' => true],
            ['name' => 'User Access Control', 'slug' => 'user-access-control', 'description' => 'Role-based access control for admins and staff', 'group' => 'admin', 'suggested_plan' => 'pro', 'is_global' => true, 'is_active' => true],

            // Resident Module - Basic
            ['name' => 'Access Code Generation', 'slug' => 'access-code-generation', 'description' => 'Generate temporary access codes for visitors', 'group' => 'resident', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],

            // Resident Module - Growth
            ['name' => 'Flexible Code Types', 'slug' => 'flexible-code-types', 'description' => 'Create recurring and flexible access codes', 'group' => 'resident', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Real-time Visit Feed', 'slug' => 'real-time-visit-feed', 'description' => 'View live updates of visitor entries', 'group' => 'resident', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
            ['name' => 'Interactive Notice Board', 'slug' => 'interactive-notice-board', 'description' => 'Interact with estate announcements and notices', 'group' => 'resident', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],

            // Resident Module - Pro
            ['name' => 'Telegram Bot Integration', 'slug' => 'telegram-bot-integration', 'description' => 'Generate access codes via Telegram bot', 'group' => 'resident', 'suggested_plan' => 'pro', 'is_global' => true, 'is_active' => true],
            ['name' => 'Household Management', 'slug' => 'household-management', 'description' => 'Add and manage household members', 'group' => 'resident', 'suggested_plan' => 'pro', 'is_global' => true, 'is_active' => true],
            ['name' => 'Estate Contacts', 'slug' => 'estate-contacts', 'description' => 'View and contact estate staff', 'group' => 'resident', 'suggested_plan' => 'pro', 'is_global' => true, 'is_active' => true],

            // Security Module - Basic
            ['name' => 'Quick Code Scanner', 'slug' => 'quick-code-scanner', 'description' => 'Scan QR codes for visitor entry validation', 'group' => 'security', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],
            ['name' => 'Digital Visitor Logs', 'slug' => 'digital-visitor-logs', 'description' => 'Record and view visitor entry logs', 'group' => 'security', 'suggested_plan' => 'basic', 'is_global' => true, 'is_active' => true],

            // Security Module - Growth
            ['name' => 'Gate Activity Feed', 'slug' => 'gate-activity-feed', 'description' => 'Real-time feed of gate access activities', 'group' => 'security', 'suggested_plan' => 'growth', 'is_global' => true, 'is_active' => true],
        ];

        foreach ($features as $feature) {
            Feature::create($feature);
        }
    }
}
