import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowTopRightOnSquareIcon, CalendarIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface MetricData {
    total_this_month: number;
    approval_rate: number;
    conversion_rate: number;
}

interface FunnelData {
    stage: string;
    count: number;
}

interface Application {
    id: number;
    estate_name: string;
    email: string;
    phone: string;
    status: string;
    created_at: string;
    plan: { id: number; name: string } | null;
    assigned_to: { id: number; name: string } | null;
}

interface GroupedApplications {
    [key: string]: Application[];
}

interface Props {
    metrics: MetricData;
    funnel: FunnelData[];
    groupedApplications: GroupedApplications;
}

export default function ApplicationIndex({ metrics, funnel, groupedApplications }: Props) {
    const [boardData, setBoardData] = useState<GroupedApplications>(groupedApplications);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'approve' | 'reject' | null; draggableId: string; sourceCol: string; destCol: string; item: Application | null }>({ isOpen: false, action: null, draggableId: '', sourceCol: '', destCol: '', item: null });
    const [rejectReason, setRejectReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Update local state when props change
    useEffect(() => {
        setBoardData(groupedApplications);
    }, [groupedApplications]);

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }

    function onDragEnd(result: DropResult) {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;
        
        const movedItem = boardData[sourceCol].find(item => item.id.toString() === draggableId);
        if (!movedItem) return;

        if (destCol === 'Approved') {
            setConfirmModal({ isOpen: true, action: 'approve', draggableId, sourceCol, destCol, item: movedItem });
            return;
        }

        if (destCol === 'Rejected') {
            setConfirmModal({ isOpen: true, action: 'reject', draggableId, sourceCol, destCol, item: movedItem });
            return;
        }

        // Optimistic UI update for simple status changes
        commitDrag(sourceCol, destCol, destination.index, movedItem, draggableId);

        const newStatus = destCol.toLowerCase().replace(' ', '_');
        router.patch(`/zeus/applications/${draggableId}/status`, { status: newStatus }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => setBoardData(groupedApplications)
        });
    }

    function commitDrag(sourceCol: string, destCol: string, destIndex: number, movedItem: Application, draggableId: string) {
        const newBoard = { ...boardData };
        newBoard[sourceCol] = newBoard[sourceCol].filter(item => item.id.toString() !== draggableId);
        newBoard[destCol] = [...newBoard[destCol]];
        newBoard[destCol].splice(destIndex, 0, movedItem);
        setBoardData(newBoard);
    }

    function handleModalConfirm() {
        if (!confirmModal.action || !confirmModal.item) return;

        // Commit optimistic update
        commitDrag(confirmModal.sourceCol, confirmModal.destCol, 0, confirmModal.item, confirmModal.draggableId);
        setIsUpdating(true);

        if (confirmModal.action === 'approve') {
            router.post(`/zeus/applications/${confirmModal.draggableId}/approve`, {}, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsUpdating(false);
                    setConfirmModal({ ...confirmModal, isOpen: false });
                },
                onError: () => setBoardData(groupedApplications)
            });
        } else if (confirmModal.action === 'reject') {
            router.post(`/zeus/applications/${confirmModal.draggableId}/reject`, { reason: rejectReason }, {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setIsUpdating(false);
                    setRejectReason('');
                    setConfirmModal({ ...confirmModal, isOpen: false });
                },
                onError: () => setBoardData(groupedApplications)
            });
        }
    }

    function handleModalCancel() {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setRejectReason('');
    }

    return (
        <ZeusLayout>
            <Head title="Application Pipeline | Zeus Command Center" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-8"
            >
                <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Acquisition Pipeline</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Estate <span className="font-light text-slate-400">Applications</span>
                </h1>
            </motion.div>

            {/* Top Metrics & Funnel Row */}
            <div className="mb-10 grid gap-6 lg:grid-cols-3">
                {/* Metrics */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.05 }}
                        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">New This Month</p>
                        <div className="mt-2 flex items-baseline gap-3">
                            <p className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{metrics.total_this_month}</p>
                            <span className="flex items-center text-sm font-semibold text-green-600">
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </span>
                        </div>
                    </motion.div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Approval Rate</p>
                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metrics.approval_rate}%</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.15 }}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Conversion</p>
                            <p className="mt-2 text-2xl font-black text-primary-600">{metrics.conversion_rate}%</p>
                        </motion.div>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2"
                >
                    <h3 className="mb-6 text-[10px] font-bold tracking-wider text-slate-400 uppercase">Application Funnel Drop-off</h3>
                    <div className="h-48 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="funnelColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="stage" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} 
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#funnelColor)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Kanban / Pipeline View */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3 }}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Pipeline</h2>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex w-full gap-5 overflow-x-auto pb-6 scrollbar-hide">
                        {Object.entries(boardData).map(([groupName, groupApps]) => (
                            <Droppable droppableId={groupName} key={groupName}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex w-[340px] shrink-0 flex-col rounded-2xl p-4 ring-1 transition-colors ${
                                            snapshot.isDraggingOver 
                                                ? 'bg-slate-200/50 ring-slate-300 dark:bg-slate-800/60 dark:ring-slate-600' 
                                                : 'bg-slate-100/60 ring-slate-200/60 dark:bg-slate-800/30 dark:ring-slate-700/50'
                                        }`}
                                    >
                                        {/* Column Header */}
                                        <div className="mb-4 flex items-center justify-between px-1">
                                            <h3 className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-200">{groupName}</h3>
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                                                {groupApps.length}
                                            </span>
                                        </div>

                                        {/* Cards */}
                                        <div className="flex h-[calc(100vh-28rem)] min-h-[400px] flex-col gap-3 overflow-y-auto overflow-x-hidden pb-4 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                                            {groupApps.map((app, index) => (
                                                <Draggable 
                                                    draggableId={app.id.toString()} 
                                                    index={index} 
                                                    key={app.id}
                                                    isDragDisabled={groupName === 'Approved' || groupName === 'Rejected'}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`group relative flex flex-col overflow-hidden rounded-xl p-5 shadow-sm ring-1 transition-all ${
                                                                snapshot.isDragging 
                                                                    ? 'z-50 scale-[1.02] bg-white shadow-xl ring-primary-500 dark:bg-slate-900 dark:ring-primary-500' 
                                                                    : 'bg-white ring-slate-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-primary-500/50'
                                                            }`}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                            }}
                                                        >
                                                            <div className="relative mb-3 flex items-start justify-between">
                                                                <Link href={`/zeus/applications/${app.id}`} className="font-bold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400">
                                                                    {app.estate_name}
                                                                </Link>
                                                                {app.plan && (
                                                                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                        {app.plan.name}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="relative mb-4 flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <EnvelopeIcon className="h-3.5 w-3.5 opacity-70" />
                                                                    <span className="truncate">{app.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <PhoneIcon className="h-3.5 w-3.5 opacity-70" />
                                                                    <span>{app.phone}</span>
                                                                </div>
                                                            </div>

                                                            <div className="relative mt-auto flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                                    {formatDate(app.created_at)}
                                                                </div>
                                                                {app.assigned_to ? (
                                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 ring-2 ring-white dark:bg-primary-900/50 dark:text-primary-300 dark:ring-slate-900">
                                                                        {app.assigned_to.name.charAt(0)}
                                                                    </div>
                                                                ) : (
                                                                    <div className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                        Unassigned
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {groupApps.length === 0 && (
                                                <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-transparent text-sm font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                                                    Drop here
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            </motion.div>
            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={!isUpdating ? handleModalCancel : undefined}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-700/50"
                    >
                        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                            {confirmModal.action === 'approve' ? 'Approve Application' : 'Reject Application'}
                        </h3>
                        
                        {confirmModal.action === 'approve' ? (
                            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                                Are you sure you want to approve this application? This will create an estate and send an invitation email to the applicant.
                            </p>
                        ) : (
                            <>
                                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                                    Please provide a reason for rejecting this application. This will be sent to the applicant.
                                </p>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. The application does not meet our current requirements..."
                                    className="mb-6 w-full rounded-xl border-none bg-slate-100 p-4 text-sm shadow-inner ring-1 ring-inset ring-slate-200/60 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700/50 dark:focus:bg-slate-800"
                                    rows={4}
                                />
                            </>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                disabled={isUpdating}
                                onClick={handleModalCancel}
                                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModalConfirm}
                                disabled={isUpdating || (confirmModal.action === 'reject' && !rejectReason.trim())}
                                className={`rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                                    confirmModal.action === 'approve' ? 'bg-primary-600 hover:bg-primary-500' : 'bg-red-600 hover:bg-red-500'
                                }`}
                            >
                                {isUpdating ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </ZeusLayout>
    );
}
