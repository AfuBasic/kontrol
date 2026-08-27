import type React from 'react';
import {
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    BanknotesIcon,
    Squares2X2Icon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    UsersIcon,
    UserGroupIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

import * as SupportController from '@/actions/App/Http/Controllers/Account/SupportController';
import * as AdministrativeAssignmentController from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import * as CollectionController from '@/actions/App/Http/Controllers/Admin/CollectionController';
import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import * as EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import * as IncidentController from '@/actions/App/Http/Controllers/Admin/IncidentController';
import * as PropertyOwnerController from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import * as ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import * as RoleController from '@/actions/App/Http/Controllers/Admin/RoleController';
import * as SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import * as SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import * as SuspiciousActivityController from '@/actions/App/Http/Controllers/Admin/SuspiciousActivityController';
import * as UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import * as VisitorLogController from '@/actions/App/Http/Controllers/Admin/VisitorLogController';

export type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    role?: string;
    feature?: string;
    group?: string;
    comingSoon?: boolean;
    description?: string;
    keywords?: string[];
};

export const baseNav: NavItem[] = [
    {
        name: 'Dashboard',
        href: DashboardController.url(),
        icon: Squares2X2Icon,
        description: 'Overview of estate operations',
        keywords: ['home', 'start', 'overview', 'stats', 'metrics'],
    },

    // People Group
    {
        name: 'Residents',
        href: ResidentController.index.url(),
        icon: UsersIcon,
        permission: 'residents.view',
        feature: 'resident-directory',
        group: 'People',
        description: 'Manage people living in the estate',
        keywords: ['people', 'users', 'tenants', 'add resident', 'create resident', 'new resident', 'invite resident', 'dependents'],
    },
    {
        name: 'Property Owners',
        href: PropertyOwnerController.index.url(),
        icon: UsersIcon,
        permission: 'property_owners.view',
        group: 'People',
        description: 'Manage property owners',
        keywords: ['landlords', 'owners', 'add owner', 'create owner', 'new owner', 'invite owner'],
    },
    {
        name: 'Security',
        href: SecurityPersonnelController.index.url(),
        icon: ShieldCheckIcon,
        permission: 'security.view',
        feature: 'security-personnel-management',
        group: 'People',
        description: 'Manage security personnel',
        keywords: ['guards', 'personnel', 'team', 'add guard', 'create security', 'new guard'],
    },

    // Operations & Estate Group
    {
        name: 'Zones',
        href: '/admin/zones',
        icon: BuildingOfficeIcon,
        permission: 'zones.view',
        group: 'Estate',
        description: 'Manage estate zones and areas',
        keywords: ['areas', 'blocks', 'phases', 'add zone', 'create zone', 'new zone'],
    },
    {
        name: 'Announcements',
        href: EstateBoardController.index.url(),
        icon: MegaphoneIcon,
        feature: 'estate-board',
        group: 'Estate',
        description: 'Manage estate announcements',
        keywords: ['notices', 'board', 'news', 'create announcement', 'add announcement', 'new notice', 'broadcast'],
    },
    {
        name: 'Incidents',
        href: IncidentController.index.url(),
        icon: ClipboardDocumentListIcon,
        permission: 'incidents.view',
        group: 'Operations',
        description: 'View and manage incidents',
        keywords: ['reports', 'issues', 'create incident', 'report incident', 'new issue'],
    },
    {
        name: 'Visitors',
        href: VisitorLogController.index.url(),
        icon: ShieldCheckIcon,
        permission: 'visitors.view',
        group: 'Operations',
        description: 'View visitor logs and passes',
        keywords: ['guests', 'logs', 'create visitor', 'add visitor', 'new pass', 'invite guest'],
    },
    {
        name: 'Suspicious Activity',
        href: SuspiciousActivityController.index.url(),
        icon: ShieldExclamationIcon,
        group: 'Operations',
        description: 'Review security-relevant sign-in events',
        keywords: ['security', 'devices', 'login', 'alerts', 'suspicious'],
    },

    // Finance Group
    {
        name: 'Collections',
        href: CollectionController.index.url(),
        icon: BanknotesIcon,
        permission: 'collections.view',
        feature: 'payment-collection',
        group: 'Finance',
        description: 'Manage payment collections',
        keywords: ['payments', 'dues', 'fees', 'create collection', 'add collection', 'new bill', 'invoice'],
    },
    {
        name: 'Transactions',
        href: TransactionController.index.url(),
        icon: CurrencyDollarIcon,
        feature: 'payment-collection',
        group: 'Finance',
        description: 'View financial transactions',
        keywords: ['payments', 'history', 'receipts', 'view transactions', 'ledger'],
    },

    // Governance & Access Group
    {
        name: 'Staff & Authority',
        href: AdministrativeAssignmentController.index.url(),
        icon: UserGroupIcon,
        permission: 'assignments.view',
        feature: 'user-access-control',
        group: 'Access',
        description: 'Manage administrative responsibilities',
        keywords: ['team', 'staff', 'assignments', 'managers', 'assign authority', 'add staff', 'new assignment', 'give access'],
    },
    {
        name: 'Roles',
        href: RoleController.index.url(),
        icon: UserGroupIcon,
        permission: 'roles.view',
        feature: 'user-access-control',
        group: 'Access',
        description: 'Manage roles and permissions',
        keywords: ['permissions', 'access', 'create role', 'add role', 'new role'],
    },
    {
        name: 'Users',
        href: UserController.index.url(),
        icon: UserGroupIcon,
        permission: 'users.view',
        group: 'Access',
        description: 'Manage admin users',
        keywords: ['admins', 'accounts', 'add user', 'create admin', 'invite admin', 'new user'],
    },
];

export const secondaryNav: NavItem[] = [
    {
        name: 'Settings',
        href: SettingsController.index.url(),
        icon: Cog6ToothIcon,
        role: 'admin',
        description: 'Manage estate settings',
        keywords: ['configuration', 'preferences', 'edit settings', 'setup', 'update settings'],
    },
    {
        name: 'Help & Support',
        href: SupportController.index.url(),
        icon: QuestionMarkCircleIcon,
        description: 'Contact Kontrol support',
        keywords: ['support', 'help', 'contact', 'call', 'whatsapp', 'email', 'reach out', 'assistance'],
    },
];

export const billingNav: NavItem = {
    name: 'Billing',
    href: BillingController.url(),
    icon: CreditCardIcon,
    description: 'Manage your Kontrol subscription',
    keywords: ['subscription', 'invoices', 'plan', 'upgrade', 'payment method', 'card'],
};

/**
 * Common Actions Registry for Command Palette
 */
export const commonActions: NavItem[] = [
    {
        name: 'Create Role',
        href: RoleController.create.url(),
        icon: UserGroupIcon,
        permission: 'roles.view', // Usually requires roles.create but we align with visibility
        feature: 'user-access-control',
        description: 'Create a new role for your estate',
        keywords: ['new role', 'add role'],
    },
    {
        name: 'Assign Authority',
        href: AdministrativeAssignmentController.create.url(),
        icon: UserGroupIcon,
        role: 'admin',
        feature: 'user-access-control',
        description: 'Assign a role to a staff member',
        keywords: ['add staff', 'new assignment'],
    },
    {
        name: 'Add Resident',
        href: ResidentController.create.url(),
        icon: UsersIcon,
        permission: 'residents.view',
        feature: 'resident-directory',
        description: 'Add a new resident to the estate',
        keywords: ['new resident', 'create resident'],
    },
    {
        name: 'Create Zone',
        href: '/admin/zones/create',
        icon: BuildingOfficeIcon,
        role: 'admin',
        description: 'Create a new zone or phase',
        keywords: ['add zone', 'new area'],
    },
];
