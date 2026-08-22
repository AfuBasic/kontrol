import { BanknotesIcon, BuildingOffice2Icon, PlusCircleIcon, Squares2X2Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Link, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ComponentType, SVGProps } from 'react';

interface Props {
    url: string;
}

type PartnerMobileNavPageProps = {
    [key: string]: unknown;
    auth?: {
        user?: {
            name?: string;
            email?: string;
        } | null;
    };
    partnerContext?: {
        name?: string | null;
    } | null;
};

type NavItem = {
    name: string;
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    emphasize?: boolean;
    kind?: 'account';
};

const navItems: NavItem[] = [
    { name: 'Home', href: '/partner/dashboard', icon: Squares2X2Icon },
    { name: 'My Estates', href: '/partner/partner-requests', icon: BuildingOffice2Icon },
    { name: 'Submit', href: '/partner/partner-requests/create', icon: PlusCircleIcon, emphasize: true },
    { name: 'Earnings', href: '/partner/earnings', icon: BanknotesIcon },
    { name: 'Account', href: '/partner/profile', icon: UserCircleIcon, kind: 'account' },
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return 'KP';
    }

    return parts
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function triggerHaptic(): void {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        // Haptics are only available in native shells.
    });
}

export default function MobileBottomNav({ url }: Props) {
    const { props } = usePage<PartnerMobileNavPageProps>();
    const shouldReduceMotion = useReducedMotion();
    const user = props.auth?.user;
    const partnerName = props.partnerContext?.name || user?.name || user?.email || 'Kontrol Partner';
    const initials = getInitials(partnerName);
    const activeTransition = shouldReduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 500, damping: 38, mass: 0.75 };

    function isActive(item: NavItem): boolean {
        const path = item.href.split('?')[0];

        if (item.href === '/partner/dashboard' || item.href === '/partner/partner-requests/create') {
            return url === path;
        }

        if (item.href === '/partner/partner-requests') {
            return url === path || (url.startsWith(`${path}/`) && !url.startsWith('/partner/partner-requests/create'));
        }

        return url === path || url.startsWith(`${path}/`);
    }

    return (
        <nav
            data-mobile-bottom-nav
            className="partner-mobile-nav-shell fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(var(--safe-area-inset-bottom)+0.75rem)] transition-[opacity,transform] duration-200 sm:px-4 lg:hidden"
            aria-label="Partner mobile navigation"
        >
            <div className="partner-mobile-nav-dock mx-auto w-full max-w-[30rem] px-1.5 py-1.5 transition-colors duration-300">
                {navItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch
                            aria-label={item.name}
                            aria-current={active ? 'page' : undefined}
                            onClick={triggerHaptic}
                            className={`group relative flex min-w-0 flex-1 flex-col items-center rounded-[1.25rem] px-1 transition duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[var(--partner-nav-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97] ${
                                item.emphasize ? 'h-[4.35rem] justify-end gap-1 pb-1.5' : 'h-[4.35rem] justify-center gap-1'
                            } ${active ? 'text-[var(--partner-nav-active-label)]' : 'text-[var(--partner-nav-label-muted)] hover:text-[var(--partner-nav-active-label)]'}`}
                        >
                            {!item.emphasize && active && (
                                <motion.span
                                    layoutId="partnerMobileActiveCapsule"
                                    className="absolute inset-x-0.5 inset-y-1.5 rounded-[1.05rem] bg-[var(--partner-nav-active-surface)] shadow-[var(--partner-nav-active-glow)] ring-1 ring-[var(--partner-nav-active-border)]"
                                    transition={activeTransition}
                                    aria-hidden
                                />
                            )}

                            {!item.emphasize && active && (
                                <motion.span
                                    layoutId="partnerMobileActiveIndicator"
                                    className="absolute top-1.5 left-1/2 z-10 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--partner-nav-active-indicator)]"
                                    transition={activeTransition}
                                    aria-hidden
                                />
                            )}

                            {item.emphasize ? (
                                <>
                                    <span
                                        className={`absolute top-1 left-1/2 h-[3.25rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-[var(--partner-nav-submit-well)] blur-[2px] transition-opacity duration-200 ${
                                            active ? 'opacity-100' : 'opacity-70'
                                        }`}
                                        aria-hidden
                                    />
                                    <motion.span
                                        initial={false}
                                        animate={{ y: active ? -2 : 0, scale: active ? 1.03 : 1 }}
                                        transition={activeTransition}
                                        className="relative z-10 -mt-7 flex h-14 w-14 items-center justify-center rounded-full text-[var(--partner-nav-submit-foreground)] shadow-[var(--partner-nav-submit-shadow)] ring-[3px] ring-[var(--partner-nav-submit-ring)] transition duration-200 group-active:scale-95"
                                        style={{ background: 'var(--partner-nav-submit-surface)' }}
                                    >
                                        <Icon className="h-7 w-7" aria-hidden />
                                    </motion.span>
                                </>
                            ) : item.kind === 'account' ? (
                                <motion.span
                                    initial={false}
                                    animate={{ y: active ? -1 : 0 }}
                                    transition={activeTransition}
                                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black tracking-tight transition duration-200 ${
                                        active
                                            ? 'bg-[var(--partner-nav-active-surface)] text-[var(--partner-nav-active-label)] ring-2 ring-[var(--partner-nav-active-icon)]'
                                            : 'bg-white/55 text-[var(--partner-nav-icon-muted)] ring-1 ring-[var(--partner-nav-glass-border)] group-hover:text-[var(--partner-nav-active-icon)] dark:bg-white/[0.06]'
                                    }`}
                                >
                                    {initials}
                                </motion.span>
                            ) : (
                                <motion.span initial={false} animate={{ y: active ? -1 : 0 }} transition={activeTransition} className="relative z-10">
                                    <Icon
                                        className={`h-[22px] w-[22px] shrink-0 transition duration-200 ${
                                            active
                                                ? 'text-[var(--partner-nav-active-icon)]'
                                                : 'text-[var(--partner-nav-icon-muted)] group-hover:text-[var(--partner-nav-active-icon)]'
                                        }`}
                                        aria-hidden
                                    />
                                </motion.span>
                            )}
                            <span
                                className={`relative z-10 block max-w-full truncate text-center text-[9.5px] leading-none font-bold tracking-tight transition duration-200 ${
                                    active ? 'text-[var(--partner-nav-active-label)]' : 'text-[var(--partner-nav-label-muted)]'
                                }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
