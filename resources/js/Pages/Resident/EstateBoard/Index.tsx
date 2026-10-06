import { Head, InfiniteScroll, router, usePage } from '@inertiajs/react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import React, { useState } from 'react';

import { index } from '@/actions/App/Http/Controllers/Resident/EstateBoardController';
import EstateBoardFeedPost from '@/Components/EstateBoard/EstateBoardFeedPost';
import MobileSheet from '@/Components/MobileSheet';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { CursorPaginatedPosts, SharedData } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
    filter?: string | null;
    category?: string | null;
    unread_only?: boolean;
    unread_count?: number;
    search?: string | null;
    priority?: string | null;
    estateName?: string;
};

type Tab = 'all' | 'unread' | 'important';

const TABS: Array<{ id: Tab; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'important', label: 'Important' },
];

const CATEGORIES: Array<{ id: string; label: string }> = [
    { id: 'general', label: 'Notices' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'security', label: 'Security' },
    { id: 'event', label: 'Events' },
    { id: 'meeting', label: 'Meetings' },
];

export default function EstateBoardIndex({
    posts,
    filter,
    category,
    unread_only = false,
    unread_count = 0,
    search: initialSearch,
    priority,
    estateName: propEstateName,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const estateName = propEstateName || (auth as { estate?: { name?: string } } | undefined)?.estate?.name || 'your estate';

    const [search, setSearch] = useState(initialSearch ?? '');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [sheetCategory, setSheetCategory] = useState<string>(category ?? '');

    const currentTab: Tab = unread_only ? 'unread' : priority === 'important' ? 'important' : 'all';
    const postList = posts?.data ?? [];
    const hasActiveFilters = Boolean(search || category || currentTab !== 'all');

    const visit = (next: { search?: string; category?: string; tab?: Tab }) => {
        const nextSearch = next.search !== undefined ? next.search : search;
        const nextCategory = next.category !== undefined ? next.category : (category ?? '');
        const nextTab = next.tab ?? currentTab;

        router.get(
            index.url(),
            {
                filter: filter || undefined,
                search: nextSearch || undefined,
                category: nextCategory || undefined,
                unread_only: nextTab === 'unread' ? 1 : undefined,
                priority: nextTab === 'important' ? 'important' : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearAll = () => {
        setSearch('');
        setSheetCategory('');
        setIsFilterSheetOpen(false);
        router.get(index.url(), { filter: filter || undefined }, { preserveState: true });
    };

    const isFilteredEmpty = postList.length === 0 && hasActiveFilters;

    return (
        <>
            <Head title="Estate Board" />

            <div className="mx-auto max-w-3xl space-y-5 px-3 py-4 pb-28 text-left sm:px-4 sm:py-6 md:px-6">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-hero px-5 py-6 text-white shadow-xl shadow-primary-900/20 sm:px-6 sm:py-7">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-sky-300 uppercase">Community Notice Board</span>
                            <div className="mt-1 flex items-center gap-2.5">
                                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Estate Board</h1>
                                {unread_count > 0 && (
                                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-black text-slate-300 ring-1 ring-slate-700">
                                        {unread_count}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
                                Announcements, maintenance notices and community updates from {estateName}.
                            </p>
                        </div>

                        {unread_count > 0 && currentTab !== 'unread' && (
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={() => visit({ tab: 'unread' })}
                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-500 hover:shadow-primary-600/40 active:scale-95"
                                >
                                    <span>Show {unread_count} unread</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search, filters and tabs */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    visit({ search });
                                }}
                                className="relative flex-1"
                                noValidate
                            >
                                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search announcements"
                                    aria-label="Search announcements"
                                    className="min-h-[42px] w-full rounded-2xl border border-slate-200 bg-white py-2 pr-9 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            visit({ search: '' });
                                        }}
                                        aria-label="Clear search"
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </form>

                            <button
                                type="button"
                                onClick={() => {
                                    setSheetCategory(category ?? '');
                                    setIsFilterSheetOpen(true);
                                }}
                                className={`relative flex min-h-[42px] items-center gap-2 rounded-2xl border px-3.5 text-xs font-bold transition-all active:scale-95 ${
                                    category
                                        ? 'border-primary-500 bg-primary-50/50 text-primary-700'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="hidden sm:inline">Filters</span>
                                {category && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white">
                                        1
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => visit({ tab: tab.id })}
                                    className={`flex-1 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:flex-none ${
                                        currentTab === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            {category && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                                    <span>{CATEGORIES.find((c) => c.id === category)?.label ?? category}</span>
                                    <button type="button" onClick={() => visit({ category: '' })} aria-label="Remove category filter">
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {search && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                    <span>"{search}"</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            visit({ search: '' });
                                        }}
                                        aria-label="Remove search"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={clearAll}
                                className="ml-1 text-xs font-bold text-slate-400 transition-colors hover:text-primary-600"
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Feed */}
                    {postList.length > 0 ? (
                        <InfiniteScroll
                            data="posts"
                            loading={
                                <div className="flex justify-center py-6" role="status" aria-label="Loading more announcements">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                                </div>
                            }
                        >
                            <div className="space-y-3">
                                {postList.map((post) => (
                                    <EstateBoardFeedPost key={post.id} post={post} estateName={estateName} />
                                ))}
                            </div>
                        </InfiniteScroll>
                    ) : isFilteredEmpty ? (
                        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xs sm:p-12">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-base font-black text-slate-900">
                                {search ? `No announcements match "${search}"` : 'No matching announcements'}
                            </h3>
                            <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500">
                                Try different keywords, or clear the filters to see everything on the board.
                            </p>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-95"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xs sm:p-12">
                            <h3 className="text-base font-black text-slate-900">Nothing posted yet</h3>
                            <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
                                Notices and announcements from your estate office will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Announcements">
                <div className="space-y-6 pt-2">
                    <div>
                        <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Category</label>
                        <div className="mt-2 grid grid-cols-1 gap-2">
                            {[{ id: '', label: 'All Categories' }, ...CATEGORIES].map((item) => (
                                <button
                                    key={item.id || 'all'}
                                    type="button"
                                    onClick={() => setSheetCategory(item.id)}
                                    className={`min-h-[44px] rounded-2xl border px-4 py-2.5 text-left text-xs font-bold transition-all ${
                                        sheetCategory === item.id
                                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setSheetCategory('')}
                            className="min-h-[44px] flex-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                visit({ category: sheetCategory });
                                setIsFilterSheetOpen(false);
                            }}
                            className="min-h-[44px] flex-[2] rounded-2xl bg-primary-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </MobileSheet>
        </>
    );
}

EstateBoardIndex.layout = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
