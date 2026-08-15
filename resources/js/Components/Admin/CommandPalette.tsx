import { Fragment, useState, useEffect, useMemo } from 'react';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { baseNav, secondaryNav, commonActions, billingNav, type NavItem } from '@/Config/navigation';

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    canAccess: (item: NavItem) => boolean;
    billingEnabled: boolean;
}

const RECENT_STORAGE_KEY = 'kontrol_recent_navigation';

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}

export default function CommandPalette({ isOpen, setIsOpen, canAccess, billingEnabled }: Props) {
    const [query, setQuery] = useState('');
    const [recentDestinations, setRecentDestinations] = useState<NavItem[]>([]);

    // Determine all accessible items
    const accessibleNav = useMemo(() => {
        const items = [...baseNav, ...secondaryNav];
        if (billingEnabled) items.push(billingNav);
        return items.filter(canAccess);
    }, [canAccess, billingEnabled]);

    const accessibleActions = useMemo(() => {
        return commonActions.filter(canAccess);
    }, [canAccess]);

    // Load recent from session storage
    useEffect(() => {
        if (isOpen) {
            try {
                const stored = sessionStorage.getItem(RECENT_STORAGE_KEY);
                if (stored) {
                    const parsedUrls: string[] = JSON.parse(stored);
                    // Hydrate URLs back into NavItems
                    const hydrated = parsedUrls.map(url => {
                        return accessibleNav.find(n => n.href === url) || accessibleActions.find(a => a.href === url);
                    }).filter(Boolean) as NavItem[];
                    setRecentDestinations(hydrated);
                }
            } catch (e) {
                console.error("Could not load recent destinations", e);
            }
        }
    }, [isOpen, accessibleNav, accessibleActions]);

    const saveRecent = (item: NavItem) => {
        try {
            const stored = sessionStorage.getItem(RECENT_STORAGE_KEY);
            let urls: string[] = stored ? JSON.parse(stored) : [];
            urls = [item.href, ...urls.filter(url => url !== item.href)].slice(0, 5);
            sessionStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(urls));
        } catch (e) {
            // ignore
        }
    };

    const matchQuery = (item: NavItem, searchQuery: string) => {
        const terms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length === 0) return true;
        
        return terms.every(term => {
            return item.name.toLowerCase().includes(term) ||
                   (item.description && item.description.toLowerCase().includes(term)) ||
                   (item.keywords && item.keywords.some(k => k.toLowerCase().includes(term)));
        });
    };

    const filteredNav = query === '' 
        ? accessibleNav 
        : accessibleNav.filter((item) => matchQuery(item, query));

    const filteredActions = query === '' 
        ? [] // Don't show all actions when query is empty to avoid clutter
        : accessibleActions.filter((item) => matchQuery(item, query));

    const handleSelect = (item: NavItem | null) => {
        if (!item) return;
        saveRecent(item);
        setIsOpen(false);
        router.visit(item.href);
    };

    return (
        <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')} appear>
            <Dialog as="div" className="relative z-[200]" onClose={setIsOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
                            <Combobox onChange={(item: NavItem) => handleSelect(item)}>
                                {({ activeOption }) => (
                                    <>
                                        <div className="relative">
                                            <MagnifyingGlassIcon
                                                className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-slate-400"
                                                aria-hidden="true"
                                            />
                                            <Combobox.Input
                                                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm"
                                                placeholder="Search Kontrol... (⌘K)"
                                                onChange={(event) => setQuery(event.target.value)}
                                            />
                                        </div>

                                        {(filteredNav.length > 0 || filteredActions.length > 0 || (query === '' && recentDestinations.length > 0)) && (
                                            <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto text-sm text-slate-800">
                                                {query === '' && recentDestinations.length > 0 && (
                                                    <div className="px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                        Recent
                                                    </div>
                                                )}
                                                {query === '' && recentDestinations.map((item) => (
                                                    <Combobox.Option
                                                        key={`recent-${item.href}`}
                                                        value={item}
                                                        className={({ active }) =>
                                                            classNames(
                                                                'flex cursor-default select-none items-center gap-3 px-4 py-3',
                                                                active && 'bg-[#F0F5FF] text-[#0A3D91]'
                                                            )
                                                        }
                                                    >
                                                        {({ active }) => (
                                                            <>
                                                                <item.icon className={classNames('h-5 w-5 flex-none', active ? 'text-[#0A3D91]' : 'text-slate-400')} />
                                                                <div className="flex-auto truncate">
                                                                    <div className="font-medium">{item.name}</div>
                                                                    {item.description && (
                                                                        <div className={classNames("text-xs truncate mt-0.5", active ? "text-[#0A3D91]/70" : "text-slate-500")}>
                                                                            {item.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </Combobox.Option>
                                                ))}

                                                {filteredNav.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase border-t border-slate-100">
                                                            Navigation
                                                        </div>
                                                        {filteredNav.map((item) => (
                                                            <Combobox.Option
                                                                key={`nav-${item.href}`}
                                                                value={item}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        'flex cursor-default select-none items-center gap-3 px-4 py-3',
                                                                        active && 'bg-[#F0F5FF] text-[#0A3D91]'
                                                                    )
                                                                }
                                                            >
                                                                {({ active }) => (
                                                                    <>
                                                                        <item.icon className={classNames('h-5 w-5 flex-none', active ? 'text-[#0A3D91]' : 'text-slate-400')} />
                                                                        <div className="flex-auto truncate">
                                                                            <div className="font-medium">{item.name}</div>
                                                                            {item.description && (
                                                                                <div className={classNames("text-xs truncate mt-0.5", active ? "text-[#0A3D91]/70" : "text-slate-500")}>
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </Combobox.Option>
                                                        ))}
                                                    </>
                                                )}

                                                {filteredActions.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase border-t border-slate-100">
                                                            Actions
                                                        </div>
                                                        {filteredActions.map((item) => (
                                                            <Combobox.Option
                                                                key={`action-${item.href}`}
                                                                value={item}
                                                                className={({ active }) =>
                                                                    classNames(
                                                                        'flex cursor-default select-none items-center gap-3 px-4 py-3',
                                                                        active && 'bg-[#F0F5FF] text-[#0A3D91]'
                                                                    )
                                                                }
                                                            >
                                                                {({ active }) => (
                                                                    <>
                                                                        <item.icon className={classNames('h-5 w-5 flex-none', active ? 'text-[#0A3D91]' : 'text-slate-400')} />
                                                                        <div className="flex-auto truncate">
                                                                            <div className="font-medium">{item.name}</div>
                                                                            {item.description && (
                                                                                <div className={classNames("text-xs truncate mt-0.5", active ? "text-[#0A3D91]/70" : "text-slate-500")}>
                                                                                    {item.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </Combobox.Option>
                                                        ))}
                                                    </>
                                                )}
                                            </Combobox.Options>
                                        )}

                                        {query !== '' && filteredNav.length === 0 && filteredActions.length === 0 && (
                                            <div className="px-6 py-14 text-center text-sm sm:px-14">
                                                <MagnifyingGlassIcon className="mx-auto h-6 w-6 text-slate-400" aria-hidden="true" />
                                                <p className="mt-4 font-semibold text-slate-900">No results found</p>
                                                <p className="mt-2 text-slate-500">We couldn't find anything matching "{query}". Please try again.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Combobox>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
