import {
    BanknotesIcon,
    BuildingOffice2Icon,
    PlusCircleIcon,
    Squares2X2Icon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

interface Props {
    url: string;
}

const navItems = [
    { name: 'Home', href: '/partner/dashboard', icon: Squares2X2Icon },
    { name: 'Pipeline', href: '/partner/partner-requests', icon: BuildingOffice2Icon },
    { name: 'Submit', href: '/partner/partner-requests/create', icon: PlusCircleIcon },
    { name: 'Earnings', href: '/partner/earnings', icon: BanknotesIcon },
    { name: 'Account', href: '/partner/profile', icon: UserCircleIcon },
];

export default function MobileBottomNav({ url }: Props) {
    return (
        <nav
            className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-stone-200/80 bg-[#f7f6f3]/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
            aria-label="Partner mobile navigation"
        >
            <div className="flex h-14 items-center justify-around px-1">
                {navItems.map((item) => {
                    const path = item.href.split('?')[0];
                    const active =
                        item.href === '/partner/dashboard'
                            ? url === path
                            : url === path || url.startsWith(path + '/');

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch
                            aria-label={item.name}
                            aria-current={active ? 'page' : undefined}
                            className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 transition active:scale-95 ${
                                active ? 'text-primary-600' : 'text-stone-400 dark:text-slate-500'
                            }`}
                        >
                            <item.icon className={`h-5 w-5 shrink-0 ${active ? 'scale-105' : ''}`} />
                            <span className={`max-w-full truncate text-[9px] font-bold tracking-tight ${active ? '' : 'opacity-70'}`}>
                                {item.name}
                            </span>
                            {active && (
                                <motion.div
                                    layoutId="partnerActiveTab"
                                    className="absolute -top-0.5 h-0.5 w-5 rounded-b-full bg-primary-600"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
