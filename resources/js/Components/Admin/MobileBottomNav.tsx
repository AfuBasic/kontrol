import { Squares2X2Icon, UsersIcon, BellIcon, Cog6ToothIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import NotificationController from '@/actions/App/Http/Controllers/Admin/NotificationController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';

interface Props {
    url: string;
    unreadNotifications?: number;
}

export default function MobileBottomNav({ url, unreadNotifications = 0 }: Props) {
    const navItems = [
        {
            name: 'Home',
            href: DashboardController.url(),
            icon: Squares2X2Icon,
        },
        {
            name: 'Board',
            href: EstateBoardController.index.url(),
            icon: BuildingOffice2Icon,
        },
        {
            name: 'Residents',
            href: ResidentController.index.url(),
            icon: UsersIcon,
        },
        {
            name: 'Alerts',
            href: NotificationController.index.url(),
            icon: BellIcon,
            badge: unreadNotifications > 0 ? unreadNotifications : null,
        },
        {
            name: 'Settings',
            href: SettingsController.index.url(),
            icon: Cog6ToothIcon,
        },
    ];

    return (
        <nav className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200/50 bg-white/95 ring-1 ring-black/5 backdrop-blur-2xl md:hidden">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const active = url.startsWith(item.href.split('?')[0]) && item.href !== '#';
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch="click"
                            className={`relative flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
                                active ? 'text-[#1F6FDB]' : 'text-slate-400'
                            }`}
                        >
                            <div className="relative">
                                <item.icon className={`h-6 w-6 transition-transform ${active ? 'scale-110' : ''}`} />
                                {item.name === 'Alerts' && unreadNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                    </span>
                                )}
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
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
