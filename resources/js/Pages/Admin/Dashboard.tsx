import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowTrendingDownIcon,
    ArrowTrendingUpIcon,
    BuildingOffice2Icon,
    ChatBubbleLeftRightIcon,
    ClockIcon,
    DocumentTextIcon,
    MegaphoneIcon,
    PlusIcon,
    ShieldCheckIcon,
    SparklesIcon,
    UsersIcon,
    ArrowRightIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { MessageCircle, Image as ImageIcon, Globe, Users, Shield, TrendingUp } from 'lucide-react';

import { create as createPost, index as postsIndex, show as showPost } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import AdminLayout from '@/Layouts/AdminLayout';
import type { ChartDataPoint, DashboardStats, PostAudience, RecentActivity, RecentPost, TodayStats } from '@/types';

type Props = {
    stats: DashboardStats;
    chartData: ChartDataPoint[];
    recentActivity: RecentActivity[];
    recentPosts: RecentPost[];
    todayStats: TodayStats;
};

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-3 w-3" />;
        case 'security':
            return <Shield className="h-3 w-3" />;
        default:
            return <Globe className="h-3 w-3" />;
    }
}

function StatCard({
    title,
    value,
    subValue,
    trend,
    icon: Icon,
    href,
    delay,
}: {
    title: string;
    value: number;
    subValue?: string;
    trend?: number;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;
    delay: number;
}) {
    const content = (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={href ? { y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' } : undefined}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 transition-all ${href ? 'cursor-pointer shadow-sm hover:border-[#1F6FDB]/30 hover:shadow-xl' : 'shadow-sm'}`}
        >
            {/* Subtle brand glow on hover */}
            <motion.div
                className="absolute inset-x-0 -top-px h-1 bg-linear-to-r from-transparent via-[#1F6FDB]/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                initial={false}
            />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: delay + 0.2 }}
                        className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase"
                    >
                        {title}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + 0.3 }}
                        className="mt-2 text-4xl font-black text-slate-900"
                    >
                        {value.toLocaleString()}
                    </motion.p>
                    {subValue && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: delay + 0.4 }}
                            className="mt-1 text-xs font-semibold text-slate-500"
                        >
                            {subValue}
                        </motion.p>
                    )}
                    {trend !== undefined && trend !== 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: delay + 0.5 }}
                            className="mt-3 flex items-center gap-1.5"
                        >
                            {trend > 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-rose-500" />
                            )}
                            <span className={`text-[11px] font-black ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {trend > 0 ? '+' : ''}
                                {trend}%
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">vs last month</span>
                        </motion.div>
                    )}
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-200 group-hover:bg-[#F0F5FF] group-hover:text-[#1F6FDB] group-hover:ring-[#1F6FDB]/30"
                >
                    <Icon className="h-6 w-6" />
                </motion.div>
            </div>
        </motion.div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

function MiniChart({ data }: { data: ChartDataPoint[] }) {
    const maxValue = Math.max(...data.map((d) => d.posts + d.comments), 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-linear-to-br from-slate-900 to-slate-800 p-8 shadow-xl"
        >
            {/* Decorative gradient orb */}
            <motion.div
                className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

            <div className="relative z-10 mb-8 flex items-start justify-between">
                <div>
                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-black text-white"
                    >
                        Activity Overview
                    </motion.h3>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-1 text-sm text-slate-400">
                        Posts and comments this week
                    </motion.p>
                </div>
                <div className="flex items-center gap-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                        <span className="text-sm font-medium text-slate-300">Posts</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                        <span className="text-sm font-medium text-slate-300">Comments</span>
                    </motion.div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
                {data.map((point, idx) => {
                    const postsHeight = (point.posts / maxValue) * 100;
                    const commentsHeight = (point.comments / maxValue) * 100;

                    return (
                        <motion.div
                            key={point.date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                            className="flex flex-1 flex-col items-center gap-2.5"
                        >
                            <div
                                className="relative flex w-full items-end justify-center gap-1 rounded-t-lg bg-white/5 p-2 backdrop-blur-sm"
                                style={{ height: '120px' }}
                            >
                                {/* Posts bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${postsHeight}%` }}
                                    transition={{ duration: 0.6, delay: 0.4 + idx * 0.06, ease: 'easeOut' }}
                                    className="w-2.5 rounded-t-md bg-linear-to-t from-blue-500 to-blue-300 shadow-lg shadow-blue-500/50"
                                    style={{ minHeight: point.posts > 0 ? '8px' : '0' }}
                                    title={`Posts: ${point.posts}`}
                                />
                                {/* Comments bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${commentsHeight}%` }}
                                    transition={{ duration: 0.6, delay: 0.45 + idx * 0.06, ease: 'easeOut' }}
                                    className="w-2.5 rounded-t-md bg-linear-to-t from-emerald-500 to-emerald-300 shadow-lg shadow-emerald-500/50"
                                    style={{ minHeight: point.comments > 0 ? '8px' : '0' }}
                                    title={`Comments: ${point.comments}`}
                                />
                            </div>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                                className="text-xs font-bold text-slate-400"
                            >
                                {point.day}
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 + idx * 0.05 }}
                                className="text-[10px] font-semibold text-slate-500"
                            >
                                {point.posts + point.comments}
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

function RecentActivityFeed({ activities }: { activities: RecentActivity[] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="surface-card"
        >
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
                    <p className="text-xs text-gray-500">Latest actions in your estate</p>
                </div>
                <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>

            {activities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {activities.map((activity, idx) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                            className="native-list-item border-none px-0 py-3"
                        >
                            <div className="flex flex-1 flex-col gap-1">
                                <p className="text-sm text-gray-900">
                                    <span className="font-medium">{activity.causer?.name || 'System'}</span>{' '}
                                    <span className="text-gray-600">{activity.description}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    {activity.subject_type && (
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                            {activity.subject_type}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">{activity.created_at}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <ClockIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No recent activity</p>
                    <p className="mt-1 text-xs text-gray-500">Activity will appear here as things happen</p>
                </div>
            )}
        </motion.div>
    );
}

function RecentPostsFeed({ posts }: { posts: RecentPost[] }) {
    // Extract text from HTML for preview
    function extractTextFromHtml(html: string): string {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="surface-card"
        >
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Recent Posts</h3>
                    <p className="text-xs text-gray-500">Latest from the estate board</p>
                </div>
                <Link href={postsIndex.url()} className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700">
                    View all
                </Link>
            </div>

            {posts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                        >
                            <Link href={showPost.url({ post: post.hashid as unknown as number })} className="native-list-item border-none px-0 py-3">
                                <div className="flex-1">
                                    {post.title ? (
                                        <h4 className="font-medium text-gray-900">{post.title}</h4>
                                    ) : (
                                        <p className="line-clamp-2 text-sm text-gray-700">{extractTextFromHtml(post.body)}</p>
                                    )}
                                    {post.title && <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{extractTextFromHtml(post.body)}</p>}
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-gray-500">{post.author.name}</span>
                                        <span className="h-0.5 w-0.5 rounded-full bg-gray-300" />
                                        <span className="text-xs text-gray-500">{post.published_at}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                                        {getAudienceIcon(post.audience)}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <div className="flex items-center gap-0.5">
                                            <MessageCircle className="h-3 w-3" />
                                            <span>{post.comments_count}</span>
                                        </div>
                                        {post.has_media && (
                                            <div className="flex items-center gap-0.5">
                                                <ImageIcon className="h-3 w-3" />
                                                <span>{post.media_count}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                        <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No posts yet</p>
                    <p className="mt-1 text-xs text-gray-500">Create your first announcement</p>
                    <Link href={createPost.url()} className="native-button mt-4 bg-[#1F6FDB] px-6 text-white shadow-lg shadow-[#1F6FDB]/20 ring-1 ring-[#1F6FDB]/50 transition-all hover:bg-[#0A3D91] active:scale-95">
                        <MegaphoneIcon className="h-5 w-5" />
                        Create Post
                    </Link>
                </div>
            )}
        </motion.div>
    );
}

function QuickActions() {
    const actions = [
        {
            label: 'Create Post',
            href: createPost.url(),
            icon: MegaphoneIcon,
            color: 'from-[#1F6FDB] to-[#0A3D91]',
            shadow: 'shadow-[#1F6FDB]/30',
        },
        {
            label: 'Add Resident',
            href: ResidentController.create.url(),
            icon: UsersIcon,
            color: 'from-slate-800 to-slate-900',
            shadow: 'shadow-slate-200',
        },
        {
            label: 'Add Security',
            href: SecurityPersonnelController.create.url(),
            icon: ShieldCheckIcon,
            color: 'from-slate-700 to-slate-800',
            shadow: 'shadow-slate-200',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid gap-3 sm:flex sm:flex-wrap"
        >
            {actions.map((action, idx) => (
                <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.08 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Link
                        href={action.href}
                        className={`group relative overflow-hidden rounded-xl bg-linear-to-br ${action.color} px-5 py-3.5 text-sm font-bold text-white shadow-xl ${action.shadow} flex items-center justify-center gap-2 transition-all hover:shadow-2xl sm:flex-1`}
                    >
                        {/* Shine effect on hover */}
                        <motion.div
                            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.5 }}
                        />
                        <action.icon className="h-5 w-5" />
                        <span>{action.label}</span>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}

function TodayHighlights({ stats }: { stats: TodayStats }) {
    const hasActivity = stats.new_posts > 0 || stats.new_comments > 0 || stats.new_residents > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-8 shadow-sm"
        >
            {/* Decorative gradient orbs */}
            <motion.div
                className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-blue-100/50 blur-3xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
                className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-indigo-100/30 blur-3xl"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10 mb-8 flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F5FF]"
                    >
                        <SparklesIcon className="h-6 w-6 text-[#1F6FDB]" />
                    </motion.div>
                    <div>
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-black text-slate-900"
                        >
                            Today's Highlights
                        </motion.h3>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-[10px] font-black tracking-widest text-[#1F6FDB] uppercase"
                        >
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </motion.p>
                    </div>
                </div>
            </div>

            {hasActivity ? (
                <motion.div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'New Posts', value: stats.new_posts, color: 'text-[#1F6FDB]' },
                        { label: 'Comments', value: stats.new_comments, color: 'text-[#0A3D91]' },
                        { label: 'Residents', value: stats.new_residents, color: 'text-slate-600' },
                    ].map((stat, idx) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-center"
                        >
                            <motion.p
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, delay: 0.5 + idx * 0.1 }}
                                className={`text-3xl font-black ${stat.color}`}
                            >
                                {stat.value}
                            </motion.p>
                            <p className="mt-1 text-[10px] font-black tracking-tighter text-slate-400 uppercase">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border border-dashed border-slate-200 p-6 text-center"
                >
                    <p className="text-sm font-medium text-slate-500">No activity yet today</p>
                    <p className="mt-1 text-xs text-slate-400">Start by creating a post to get things going!</p>
                </motion.div>
            )}
        </motion.div>
    );
}

export default function Dashboard({ stats, chartData, recentActivity, recentPosts, todayStats }: Props) {
    return (
        <AdminLayout>
            <Head title="Dashboard" />

            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mb-12"
            >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
                            className="pt-4 text-4xl font-black text-slate-900 sm:text-5xl"
                        >
                            Welcome back!
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100">
                                <BuildingOffice2Icon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{stats.estate.name}</p>
                                {stats.estate.address && <p className="text-sm text-gray-500">{stats.estate.address}</p>}
                            </div>
                        </motion.div>
                    </div>
                    <div className="sm:mt-0">
                        <QuickActions />
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Residents"
                    value={stats.residents.total}
                    subValue={`${stats.residents.active} active`}
                    trend={stats.residents.trend}
                    icon={UsersIcon}
                    href={ResidentController.index.url()}
                    delay={0}
                />
                <StatCard
                    title="Security Personnel"
                    value={stats.security.total}
                    subValue={`${stats.security.active} on duty`}
                    icon={ShieldCheckIcon}
                    href={SecurityPersonnelController.index.url()}
                    delay={0.05}
                />
                <StatCard
                    title="Board Posts"
                    value={stats.posts.total}
                    subValue={`${stats.posts.published} published, ${stats.posts.draft} drafts`}
                    trend={stats.posts.trend}
                    icon={DocumentTextIcon}
                    href={postsIndex.url()}
                    delay={0.1}
                />
                <StatCard title="Comments" value={stats.comments.total} subValue="Total engagement" icon={ChatBubbleLeftRightIcon} delay={0.15} />
            </div>

            {/* Main Content Grid - Single column on mobile */}
            <div className="space-y-8">
                <MiniChart data={chartData} />
                <TodayHighlights stats={todayStats} />
                <RecentActivityFeed activities={recentActivity} />
                <RecentPostsFeed posts={recentPosts} />
            </div>
        </AdminLayout>
    );
}
