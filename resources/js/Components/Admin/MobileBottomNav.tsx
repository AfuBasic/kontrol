import { useMemo } from 'react';
import {
    Squares2X2Icon,
    UsersIcon,
    BellIcon,
    Cog6ToothIcon,
    BuildingOffice2Icon,
    BanknotesIcon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import * as EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import * as IncidentController from '@/actions/App/Http/Controllers/Admin/IncidentController';
import * as NotificationController from '@/actions/App/Http/Controllers/Admin/NotificationController';
import * as ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import * as SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import * as CollectionController from '@/actions/App/Http/Controllers/Admin/CollectionController';
import * as VisitorLogController from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import type { NavItem } from '@/Config/navigation';

interface Props {
    url: string;
    unreadNotifications?: number;
    canAccess?: (item: NavItem) => boolean;
    isAdmin?: boolean;
    onOpenMenu?: () => void;
}

type BottomBarItem = {
    name: string;
    href?: string;
    icon: any;
    badge?: number | null;
    onClick?: () => void;
};

export default function MobileBottomNav({
    url,
    unreadNotifications = 0,
    canAccess,
    isAdmin = false,
    onOpenMenu,
}: Props) {
    const navItems = useMemo<BottomBarItem[]>(() => {
        // Slot 1: Universal Home (Anchor)
        const homeItem: BottomBarItem = {
            name: 'Home',
            href: DashboardController.url(),
            icon: Squares2X2Icon,
        };

        // Candidate middle slots in priority order
        const candidateSlots: NavItem[] = [
            {
                name: 'Residents',
                href: ResidentController.index.url(),
                icon: UsersIcon,
                permission: 'residents.view',
                feature: 'resident-directory',
            },
            {
                name: 'Collections',
                href: CollectionController.index.url(),
                icon: BanknotesIcon,
                permission: 'collections.view',
                feature: 'payment-collection',
            },
            {
                name: 'Visitors',
                href: VisitorLogController.index.url(),
                icon: ShieldCheckIcon,
                permission: 'visitors.view',
            },
            {
                name: 'Incidents',
                href: IncidentController.index.url(),
                icon: ClipboardDocumentListIcon,
                permission: 'incidents.view',
            },
            {
                name: 'Board',
                href: EstateBoardController.index.url(),
                icon: BuildingOffice2Icon,
                feature: 'estate-board',
            },
        ];

        // Filter middle slots based on canAccess
        const allowedMiddleSlots: BottomBarItem[] = candidateSlots
            .filter((candidate) => (canAccess ? canAccess(candidate) : true))
            .slice(0, 2)
            .map((item) => ({
                name: item.name,
                href: item.href,
                icon: item.icon,
            }));

        // Slot 4: Universal Alerts (Anchor)
        const alertsItem: BottomBarItem = {
            name: 'Alerts',
            href: NotificationController.index.url(),
            icon: BellIcon,
            badge: unreadNotifications > 0 ? unreadNotifications : null,
        };

        // Slot 5: Settings for Admins or Menu/More for Staff
        const lastSlot: BottomBarItem = isAdmin
            ? {
                  name: 'Settings',
                  href: SettingsController.index.url(),
                  icon: Cog6ToothIcon,
              }
            : {
                  name: 'More',
                  icon: Bars3Icon,
                  onClick: onOpenMenu,
              };

        return [homeItem, ...allowedMiddleSlots, alertsItem, lastSlot];
    }, [canAccess, isAdmin, unreadNotifications, onOpenMenu]);

    return (
        <nav
            data-mobile-bottom-nav
            className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200/50 bg-white/95 ring-1 ring-black/5 backdrop-blur-2xl md:hidden"
        >
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isLink = Boolean(item.href);
                    const active = isLink && item.href ? url.startsWith(item.href.split('?')[0]) && item.href !== '#' : false;

                    const content = (
                        <>
                            <div className="relative">
                                <item.icon className={`h-6 w-6 transition-transform ${active ? 'scale-110' : ''}`} />
                                {item.badge && item.badge > 0 ? (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                ) : null}
                            </div>
                            <span className={`text-[10px] font-bold tracking-tighter uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>
                                {item.name}
                            </span>

                            {active && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute -top-2 h-1 w-6 rounded-b-full bg-[#1F6FDB]"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </>
                    );

                    if (item.onClick) {
                        return (
                            <button
                                key={item.name}
                                type="button"
                                onClick={item.onClick}
                                className="relative flex flex-col items-center justify-center gap-1 text-slate-400 transition-all active:scale-90"
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href || '#'}
                            prefetch="click"
                            className={`relative flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
                                active ? 'text-[#1F6FDB]' : 'text-slate-400'
                            }`}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
