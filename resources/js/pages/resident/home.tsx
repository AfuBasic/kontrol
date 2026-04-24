import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { AccessCode, ActivityItem, HomeStats } from '@/types/access-code';
import ResidentLayout from '@/layouts/ResidentLayout';
import DashboardHeader from '@/components/Resident/Dashboard/DashboardHeader';
import CommandCenter from '@/components/Resident/Dashboard/CommandCenter';
import QuickActions from '@/components/Resident/Dashboard/QuickActions';
import VisitorStatus from '@/components/Resident/Dashboard/VisitorStatus';
import DailyMetrics from '@/components/Resident/Dashboard/DailyMetrics';
import LiveFeed from '@/components/Resident/Dashboard/LiveFeed';

import type { SharedData } from '@/types';

type Props = SharedData & {
    stats: HomeStats;
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    estateName: string;
};

import { useState } from 'react';
import CreateCodeBottomSheet from '@/components/Resident/CreateCodeBottomSheet';

export default function Home({ auth, stats, activeCodes, recentActivity, estateName }: Props) {
    // Calculate live data for Command Center
    const activeNow = activeCodes.filter((c) => c.status === 'used').length;
    const expectedToday = activeCodes.filter((c) => c.status === 'active').length;
    const lastActivityTime = recentActivity[0]?.time;

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <ResidentLayout>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-8 pb-32">
                {/* 1. GREETING SECTION */}
                <DashboardHeader
                    userName={auth?.user?.name ?? 'Resident'}
                    estateName={estateName}
                    unreadCount={auth?.user?.unread_notifications_count ?? 0}
                />

                {/* 2. DYNAMIC HERO (COMMAND CENTER) */}
                <CommandCenter
                    expectedToday={expectedToday}
                    activeNow={activeNow}
                    lastActivity={lastActivityTime}
                    onAction={() => setIsCreateModalOpen(true)}
                />

                {/* 3. QUICK ACTIONS STRIP */}
                <section>
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Quick Actions</h3>
                    </div>
                    <QuickActions />
                </section>

                {/* 4. VISITOR STATUS */}
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

                {/* 6. LIVE ACTIVITY FEED */}
                <section>
                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Live Activity</h3>
                        <Link href={'/access-codes'} className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                            View All
                        </Link>
                    </div>
                    <LiveFeed activities={recentActivity} />
                </section>
            </div>

            <CreateCodeBottomSheet isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </ResidentLayout>
    );
}
