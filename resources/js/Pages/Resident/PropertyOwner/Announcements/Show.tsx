import { Head, Link, router } from '@inertiajs/react';
import { index, destroy } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/AnnouncementController';
import { 
    MegaphoneIcon, 
    ArrowLeftIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Target {
    type: string;
    name: string;
}

interface Props {
    announcement: {
        id: number;
        hashid: string;
        title: string;
        body: string;
        applies_to: string;
        created_at: string;
    };
    targets: Target[];
}

export default function Show({ announcement, targets }: Props) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this announcement? This will remove it from target feeds.')) {
            router.delete(destroy.url(announcement.hashid as any));
        }
    };

    return (
        <div className="mx-auto max-w-2xl pb-24">
            <Head title={`Announcement - ${announcement.title}`} />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link
                        href={index.url()}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-650 hover:bg-slate-50 shadow-xs ring-1 ring-slate-100 transition-all"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Broadcast Details</h1>
                        <p className="text-xs text-slate-500">Estate Announcement Bulletin</p>
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-4 text-xs font-bold text-rose-650 hover:bg-rose-100 hover:text-rose-700 transition-all"
                >
                    <TrashIcon className="h-4.5 w-4.5" />
                    Delete
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="space-y-6 rounded-3xl bg-white p-6 shadow-xs ring-1 ring-slate-100 sm:p-8"
            >
                <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <MegaphoneIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold uppercase">Published Date</span>
                                <p className="text-xs font-black text-slate-900">{announcement.created_at}</p>
                            </div>
                        </div>
                        <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-500 tracking-wider ring-1 ring-slate-100">
                            {announcement.applies_to === 'all' ? 'All Managed' : 'Targeted'}
                        </span>
                    </div>
                </div>

                {/* Announcement Body */}
                <div className="prose max-w-none">
                    <h2 className="text-xl font-black text-slate-950">{announcement.title}</h2>
                    <p className="mt-4 text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                        {announcement.body}
                    </p>
                </div>

                {/* Target Audience List */}
                {announcement.applies_to === 'target' && (
                    <div className="border-t border-slate-100 pt-6 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Recipients</h4>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto rounded-2xl bg-slate-50 p-4">
                            {targets.map((tgt, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm ring-1 ring-slate-150"
                                >
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                        {tgt.type}:
                                    </span>
                                    <span className="font-bold text-slate-900">
                                        {tgt.name}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
