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
} from '@heroicons/react/24/outline';
import { MessageCircle, Image as ImageIcon, Globe, Users, Shield } from 'lucide-react';

import { create as createPost, index as postsIndex, show as showPost } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import AdminLayout from '@/layouts/AdminLayout';
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
    color,
    href,
    delay,
}: {
    title: string;
    value: number;
    subValue?: string;
    trend?: number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'purple' | 'amber';
    href?: string;
    delay: number;
}) {
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            border: 'border-blue-100',
        },
        green: {
            bg: 'bg-emerald-50',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            border: 'border-emerald-100',
        },
        purple: {
            bg: 'bg-violet-50',
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
            border: 'border-violet-100',
        },
        amber: {
            bg: 'bg-amber-50',
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            border: 'border-amber-100',
        },
    };

    const classes = colorClasses[color];

    const content = (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`group relative overflow-hidden rounded-2xl border ${classes.border} ${classes.bg} p-6 transition-all hover:shadow-lg ${href ? 'cursor-pointer' : ''}`}
        >
            {/* Background decoration */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/50 blur-3xl" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
                    {subValue && <p className="mt-1 text-sm text-gray-500">{subValue}</p>}
                    {trend !== undefined && trend !== 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                            {trend > 0 ? (
                                <>
                                    <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-emerald-600">+{trend}%</span>
                                </>
                            ) : (
                                <>
                                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-600">{trend}%</span>
                                </>
                            )}
                            <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${classes.iconBg} ${classes.iconColor} transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                </div>
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
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-gray-100 bg-white p-6"
        >
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Activity Overview</h3>
                    <p className="text-sm text-gray-500">Posts and comments this week</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-gray-600">Posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-600">Comments</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between gap-2" style={{ height: '160px' }}>
                {data.map((point, idx) => {
                    const postsHeight = (point.posts / maxValue) * 100;
                    const commentsHeight = (point.comments / maxValue) * 100;

                    return (
                        <div key={point.date} className="group flex flex-1 flex-col items-center gap-2">
                            <div className="relative flex w-full items-end justify-center gap-1" style={{ height: '120px' }}>
                                {/* Posts bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${postsHeight}%` }}
                                    transition={{ duration: 0.5, delay: 0.3 + idx * 0.05 }}
                                    className="w-3 rounded-t-md bg-blue-500 transition-all group-hover:bg-blue-600"
                                    style={{ minHeight: point.posts > 0 ? '8px' : '0' }}
                                />
                                {/* Comments bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${commentsHeight}%` }}
                                    transition={{ duration: 0.5, delay: 0.35 + idx * 0.05 }}
                                    className="w-3 rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600"
                                    style={{ minHeight: point.comments > 0 ? '8px' : '0' }}
                                />

                                {/* Tooltip */}
                                <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                    <div className="font-medium">{point.date}</div>
                                    <div className="mt-1 flex flex-col gap-0.5">
                                        <span>{point.posts} posts</span>
                                        <span>{point.comments} comments</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500">{point.day}</span>
                        </div>
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
            className="rounded-2xl border border-gray-100 bg-white p-6"
        >
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    <p className="text-sm text-gray-500">Latest actions in your estate</p>
                </div>
                <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>

            {activities.length > 0 ? (
                <div className="space-y-4">
                    {activities.map((activity, idx) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                            className="group flex items-start gap-4"
                        >
                            <div className="relative">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 ring-4 ring-white">
                                    <span className="text-xs font-semibold">
                                        {activity.causer?.name.charAt(0).toUpperCase() || 'S'}
                                    </span>
                                </div>
                                {idx !== activities.length - 1 && (
                                    <div className="absolute top-9 left-1/2 h-full w-px -translate-x-1/2 bg-gray-100" />
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <p className="text-sm text-gray-900">
                                    <span className="font-medium">{activity.causer?.name || 'System'}</span>{' '}
                                    <span className="text-gray-600">{activity.description}</span>
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    {activity.subject_type && (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
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
            className="rounded-2xl border border-gray-100 bg-white p-6"
        >
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
                    <p className="text-sm text-gray-500">Latest from the estate board</p>
                </div>
                <Link
                    href={postsIndex.url()}
                    className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                >
                    View all
                </Link>
            </div>

            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
                        >
                            <Link
                                href={showPost.url({ post: post.hashid })}
                                className="group block rounded-xl border border-gray-100 p-4 transition-all hover:border-primary-200 hover:bg-primary-50/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        {post.title ? (
                                            <h4 className="truncate font-medium text-gray-900 transition-colors group-hover:text-primary-600">
                                                {post.title}
                                            </h4>
                                        ) : (
                                            <p className="line-clamp-2 text-sm text-gray-700">
                                                {extractTextFromHtml(post.body)}
                                            </p>
                                        )}
                                        {post.title && (
                                            <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                                                {extractTextFromHtml(post.body)}
                                            </p>
                                        )}
                                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                            <span>{post.author.name}</span>
                                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                                            <span>{post.published_at}</span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                            {getAudienceIcon(post.audience)}
                                        </span>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" />
                                                <span>{post.comments_count}</span>
                                            </div>
                                            {post.has_media && (
                                                <div className="flex items-center gap-1">
                                                    <ImageIcon className="h-3 w-3" />
                                                    <span>{post.media_count}</span>
                                                </div>
                                            )}
                                        </div>
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
                    <Link
                        href={createPost.url()}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <PlusIcon className="h-4 w-4" />
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
            label: 'New Post',
            href: createPost.url(),
            icon: MegaphoneIcon,
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
            label: 'Add Resident',
            href: ResidentController.create.url(),
            icon: UsersIcon,
            color: 'bg-emerald-500 hover:bg-emerald-600',
        },
        {
            label: 'Add Security',
            href: SecurityPersonnelController.create.url(),
            icon: ShieldCheckIcon,
            color: 'bg-amber-500 hover:bg-amber-600',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-wrap gap-3"
        >
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md ${action.color}`}
                >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                </Link>
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
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-orange-50 p-6"
        >
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <SparklesIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Today's Highlights</h3>
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {hasActivity ? (
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.new_posts}</p>
                        <p className="text-xs text-gray-600">New Posts</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.new_comments}</p>
                        <p className="text-xs text-gray-600">Comments</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.new_residents}</p>
                        <p className="text-xs text-gray-600">New Residents</p>
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm text-gray-600">No activity yet today. Start by creating a post!</p>
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-8"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Welcome back!
                        </h1>
                        <div className="mt-1 flex items-center gap-2 text-gray-600">
                            <BuildingOffice2Icon className="h-4 w-4" />
                            <span>{stats.estate.name}</span>
                            {stats.estate.address && (
                                <>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-sm text-gray-500">{stats.estate.address}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <QuickActions />
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Residents"
                    value={stats.residents.total}
                    subValue={`${stats.residents.active} active`}
                    trend={stats.residents.trend}
                    icon={UsersIcon}
                    color="blue"
                    href={ResidentController.index.url()}
                    delay={0}
                />
                <StatCard
                    title="Security Personnel"
                    value={stats.security.total}
                    subValue={`${stats.security.active} on duty`}
                    icon={ShieldCheckIcon}
                    color="green"
                    href={SecurityPersonnelController.index.url()}
                    delay={0.05}
                />
                <StatCard
                    title="Board Posts"
                    value={stats.posts.total}
                    subValue={`${stats.posts.published} published, ${stats.posts.draft} drafts`}
                    trend={stats.posts.trend}
                    icon={DocumentTextIcon}
                    color="purple"
                    href={postsIndex.url()}
                    delay={0.1}
                />
                <StatCard
                    title="Comments"
                    value={stats.comments.total}
                    subValue="Total engagement"
                    icon={ChatBubbleLeftRightIcon}
                    color="amber"
                    delay={0.15}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Chart & Today */}
                <div className="space-y-6 lg:col-span-2">
                    <MiniChart data={chartData} />
                    <TodayHighlights stats={todayStats} />
                </div>

                {/* Right Column - Activity */}
                <div className="space-y-6">
                    <RecentActivityFeed activities={recentActivity} />
                </div>
            </div>

            {/* Recent Posts - Full Width */}
            <div className="mt-6">
                <RecentPostsFeed posts={recentPosts} />
            </div>
        </AdminLayout>
    );
}
