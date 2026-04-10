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
            ['id' => 12, 'name' => 'Bulk Resident Import', 'slug' => 'bulk-resident-import', 'description' => 'CSV/file/paste bulk import', 'group' => 'Resident Management', 'is_global' => false, 'is_active' => true],
            ['id' => 13, 'name' => 'Advanced Resident Management', 'slug' => 'advanced-resident-mgmt', 'description' => 'Manage residents at scale', 'group' => 'Resident Management', 'is_global' => false, 'is_active' => true],
            ['id' => 14, 'name' => 'Extended Security Staff', 'slug' => 'extended-security-staff', 'description' => 'Scale beyond basic security limits', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 15, 'name' => 'Advanced Access Code Rules', 'slug' => 'advanced-access-rules', 'description' => 'Configure complex access rules', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 16, 'name' => 'Scheduled Access Codes', 'slug' => 'scheduled-access-codes', 'description' => 'Time-based access code scheduling', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 17, 'name' => 'Recurring Visitor Access', 'slug' => 'recurring-visitor-access', 'description' => 'Recurring visitor access permissions', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 18, 'name' => 'Bulk Access Code Generation', 'slug' => 'bulk-access-generation', 'description' => 'Generate multiple codes at once', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 19, 'name' => 'Extended Access Code Limits', 'slug' => 'extended-access-limits', 'description' => 'High volume access code usage', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 20, 'name' => 'Advanced Entry Logs', 'slug' => 'advanced-entry-logs', 'description' => 'Searchable logs with export', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 21, 'name' => 'Real-time Entry Alerts', 'slug' => 'realtime-entry-alerts', 'description' => 'Instant notifications on entry', 'group' => 'Security & Access', 'is_global' => false, 'is_active' => true],
            ['id' => 22, 'name' => 'Advanced Notifications', 'slug' => 'advanced-notifications', 'description' => 'Push notifications support', 'group' => 'Notifications', 'is_global' => false, 'is_active' => true],
            ['id' => 23, 'name' => 'WhatsApp Notifications', 'slug' => 'whatsapp-notifications', 'description' => 'Send notifications via WhatsApp', 'group' => 'Notifications', 'is_global' => false, 'is_active' => true],
            ['id' => 24, 'name' => 'SMS Notifications', 'slug' => 'sms-notifications', 'description' => 'Send SMS alerts and messages', 'group' => 'Notifications', 'is_global' => false, 'is_active' => true],
            ['id' => 25, 'name' => 'Telegram Integration', 'slug' => 'telegram-integration', 'description' => 'Bot-based Telegram actions', 'group' => 'Notifications', 'is_global' => false, 'is_active' => true],
            ['id' => 26, 'name' => 'Estate Announcements', 'slug' => 'estate-announcements', 'description' => 'Enhanced announcement system', 'group' => 'Communication', 'is_global' => false, 'is_active' => true],
            ['id' => 27, 'name' => 'Media-Rich Posts', 'slug' => 'media-rich-posts', 'description' => 'Posts with expanded storage', 'group' => 'Communication', 'is_global' => false, 'is_active' => true],
            ['id' => 28, 'name' => 'Cloud Media Storage', 'slug' => 'cloud-media-storage', 'description' => 'Expanded cloud storage for media', 'group' => 'Communication', 'is_global' => false, 'is_active' => true],
            ['id' => 29, 'name' => 'Activity Analytics', 'slug' => 'activity-analytics', 'description' => 'Usage and activity reporting', 'group' => 'Analytics & Reporting', 'is_global' => false, 'is_active' => true],
            ['id' => 30, 'name' => 'Advanced Analytics', 'slug' => 'advanced-analytics', 'description' => 'Detailed usage trends', 'group' => 'Analytics & Reporting', 'is_global' => false, 'is_active' => true],
            ['id' => 31, 'name' => 'Data Export', 'slug' => 'data-export', 'description' => 'Export data capabilities', 'group' => 'Analytics & Reporting', 'is_global' => false, 'is_active' => true],
            ['id' => 32, 'name' => 'Payment Tracking', 'slug' => 'payment-tracking', 'description' => 'Track and report payments', 'group' => 'Analytics & Reporting', 'is_global' => false, 'is_active' => true],
            ['id' => 33, 'name' => 'Subscription Plans Management', 'slug' => 'subscription-plans-mgmt', 'description' => 'Admin control of plans', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 34, 'name' => 'Custom Plans Per Estate', 'slug' => 'custom-plans-per-estate', 'description' => 'Create custom plans per estate', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 35, 'name' => 'Subscription Overrides', 'slug' => 'subscription-overrides', 'description' => 'Override subscriptions for estates', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 36, 'name' => 'Feature Flag Management', 'slug' => 'feature-flag-mgmt', 'description' => 'Manage features per plan', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 37, 'name' => 'Recurring Charges', 'slug' => 'recurring-charges', 'description' => 'Define and manage recurring charges', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 38, 'name' => 'Automated Invoicing', 'slug' => 'automated-invoicing', 'description' => 'Auto-generate invoices', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 39, 'name' => 'Bulk Charge Assignment', 'slug' => 'bulk-charge-assignment', 'description' => 'Assign charges at scale', 'group' => 'Billing & Subscriptions', 'is_global' => false, 'is_active' => true],
            ['id' => 40, 'name' => 'Wallet System', 'slug' => 'wallet-system', 'description' => 'Resident wallet functionality', 'group' => 'Payments & Wallet', 'is_global' => false, 'is_active' => true],
            ['id' => 41, 'name' => 'Wallet Funding', 'slug' => 'wallet-funding', 'description' => 'Fund wallet and manage transactions', 'group' => 'Payments & Wallet', 'is_global' => false, 'is_active' => true],
            ['id' => 42, 'name' => 'Automated Wallet Deductions', 'slug' => 'auto-wallet-deductions', 'description' => 'Auto-deduct charges from wallet', 'group' => 'Payments & Wallet', 'is_global' => false, 'is_active' => true],
            ['id' => 43, 'name' => 'Utility Bill Payments', 'slug' => 'utility-bill-payments', 'description' => 'Pay utilities (electricity, airtime, cable)', 'group' => 'Payments & Wallet', 'is_global' => false, 'is_active' => true],
            ['id' => 44, 'name' => 'Third-Party Billing', 'slug' => 'third-party-billing', 'description' => 'Integrate third-party billing', 'group' => 'Payments & Wallet', 'is_global' => false, 'is_active' => true],
            ['id' => 45, 'name' => 'AI Data Extraction', 'slug' => 'ai-data-extraction', 'description' => 'AI-powered email and file parsing', 'group' => 'AI & Automation', 'is_global' => false, 'is_active' => true],
            ['id' => 46, 'name' => 'AI Assistant', 'slug' => 'ai-assistant', 'description' => 'Natural language query assistant', 'group' => 'AI & Automation', 'is_global' => false, 'is_active' => true],
            ['id' => 47, 'name' => 'Intent-to-Action Automation', 'slug' => 'intent-to-action', 'description' => 'Automate actions from intent', 'group' => 'AI & Automation', 'is_global' => false, 'is_active' => true],
            ['id' => 48, 'name' => 'Admin AI Insights', 'slug' => 'admin-ai-insights', 'description' => 'AI-powered admin summaries', 'group' => 'AI & Automation', 'is_global' => false, 'is_active' => true],
            ['id' => 49, 'name' => 'WhatsApp Onboarding', 'slug' => 'whatsapp-onboarding', 'description' => 'WhatsApp-based estate onboarding', 'group' => 'WhatsApp Integration', 'is_global' => false, 'is_active' => true],
            ['id' => 50, 'name' => 'WhatsApp Access Codes', 'slug' => 'whatsapp-access-codes', 'description' => 'Generate access codes via WhatsApp', 'group' => 'WhatsApp Integration', 'is_global' => false, 'is_active' => true],
            ['id' => 51, 'name' => 'WhatsApp Commands', 'slug' => 'whatsapp-commands', 'description' => 'Command-based WhatsApp actions', 'group' => 'WhatsApp Integration', 'is_global' => false, 'is_active' => true],
            ['id' => 52, 'name' => 'Real-time Updates', 'slug' => 'realtime-updates', 'description' => 'WebSockets live updates at scale', 'group' => 'Real-time & APIs', 'is_global' => false, 'is_active' => true],
            ['id' => 53, 'name' => 'API Access', 'slug' => 'api-access', 'description' => 'Full REST API for integrations', 'group' => 'Real-time & APIs', 'is_global' => false, 'is_active' => true],
            ['id' => 54, 'name' => 'Webhook Support', 'slug' => 'webhook-support', 'description' => 'Outgoing webhook integration', 'group' => 'Real-time & APIs', 'is_global' => false, 'is_active' => true],
            ['id' => 55, 'name' => 'Custom Branding', 'slug' => 'custom-branding', 'description' => 'Custom logo and estate identity', 'group' => 'Branding', 'is_global' => false, 'is_active' => true],
            ['id' => 56, 'name' => 'White-Label Solution', 'slug' => 'white-label', 'description' => 'White-label platform offering', 'group' => 'Branding', 'is_global' => false, 'is_active' => true],
        ];

        foreach ($features as $feature) {
            Feature::create($feature);
        }
    }
}
