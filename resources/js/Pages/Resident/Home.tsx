import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import CreateCodeBottomSheet from '@/Components/Resident/CreateCodeBottomSheet';
import CommandCenter from '@/Components/Resident/Dashboard/CommandCenter';
import DailyMetrics from '@/Components/Resident/Dashboard/DailyMetrics';
import DashboardHeader from '@/Components/Resident/Dashboard/DashboardHeader';
import LiveFeed from '@/Components/Resident/Dashboard/LiveFeed';
import QuickActions from '@/Components/Resident/Dashboard/QuickActions';
import VisitorStatus from '@/Components/Resident/Dashboard/VisitorStatus';
import resident from '@/routes/resident';

import type { SharedData } from '@/types';

import type { AccessCode, ActivityItem, HomeStats } from '@/types/access-code';
import type { EstateBoardPost } from '@/types';
import { Megaphone, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Props = SharedData & {
    stats: HomeStats;
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    latestAnnouncements: EstateBoardPost[];
    estateName: string;
};

export default function Home({ auth, stats, activeCodes, recentActivity, latestAnnouncements, estateName }: Props) {
    const userRoles = auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const parentResidentName = auth?.user?.resident_subscription?.parent_resident_name;
    const { estate_plan } = usePage<SharedData & { estate_plan: { features: string[] } | null }>().props;
    const hasAccessCodeGen = estate_plan?.features?.includes('access-code-generation') ?? true;
    const hasLiveFeed = estate_plan?.features?.includes('real-time-visit-feed') ?? true;
    const hasEstateBoard = estate_plan?.features?.includes('interactive-notice-board') ?? true;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const expectedToday = activeCodes.filter((c) => c.status === 'active').length;
    const lastActivityTime = recentActivity[0]?.time;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 pb-32">
                {/* 1. GREETING SECTION */}
                <DashboardHeader
                    userName={auth?.user?.name ?? 'Resident'}
                    estateName={estateName}
                    unreadCount={auth?.user?.unread_notifications_count ?? 0}
                    isHouseholdMember={isHouseholdMember}
                    parentResidentName={parentResidentName}
                />

                {/* 2. DYNAMIC HERO (COMMAND CENTER) */}
                <CommandCenter
                    expectedToday={expectedToday}
                    lastActivity={lastActivityTime}
                    onAction={() => setIsCreateModalOpen(true)}
                    canGenerate={auth?.user?.resident_subscription?.plan_name !== 'Standard' && hasAccessCodeGen}
                />

                {/* 2.5 ANNOUNCEMENTS (NEW) */}
                {hasEstateBoard && latestAnnouncements && latestAnnouncements.length > 0 && (
                    <section>
                        <div className="mb-4 flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">What's New</h3>
                            <Link href="/resident/estate-board" className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                                View Board
                            </Link>
                        </div>
                        <div className="flex flex-col gap-3">
                            {latestAnnouncements.map((post) => (
                                <Link 
                                    key={post.id} 
                                    href={`/resident/estate-board/${post.hashid}`}
                                    className="group flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                                        <Megaphone className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {post.title}
                                        </h4>
                                        <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {formatDistanceToNow(new Date(post.published_at || post.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. QUICK ACTIONS STRIP */}
                <section>
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Quick Actions</h3>
                    </div>
                    <QuickActions />
                </section>

                {/* 4. VISITOR STATUS */}
                {auth?.user?.resident_subscription?.plan_name !== 'Standard' && hasAccessCodeGen && (
                    <>
                        <section>
                            <div className="mb-4 flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Visitor Journey</h3>
                            </div>
                            <VisitorStatus activeCodes={activeCodes} />
                        </section>

                        {/* 5. DAILY METRICS */}
                        <section>
                            <div className="mb-4 flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Today's Progress</h3>
                            </div>
                            <DailyMetrics stats={stats} />
                        </section>
                    </>
                )}

                {/* 6. LIVE ACTIVITY FEED */}
                {auth?.user?.resident_subscription?.plan_name !== 'Standard' && hasLiveFeed && (
                    <section>
                        <div className="mb-4 flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Live Activity</h3>
                            <Link href={resident.activity.url()} className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                                View All
                            </Link>
                        </div>
                        <LiveFeed activities={recentActivity} />
                    </section>
                )}
            </div>

            <CreateCodeBottomSheet isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </>
    );
}
