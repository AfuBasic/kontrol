import { motion } from 'framer-motion';
import { UserCheck, Plus, Sparkles, ShieldCheck, Clock } from 'lucide-react';

interface Props {
    onInvite: () => void;
}

export default function VisitorScheduleEmptyState({ onInvite }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50/80 p-6 text-center shadow-xs"
        >
            {/* Soft Ambient Background Decoration */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary-500/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Visual Icon Badge */}
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500/15 to-indigo-500/10 ring-1 ring-primary-500/20 shadow-xs">
                    <UserCheck className="h-8 w-8 text-primary-600" strokeWidth={1.75} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                    </span>
                </div>

                {/* Main Heading & Subtitle */}
                <h3 className="text-base font-bold tracking-tight text-slate-900">
                    You're all clear today
                </h3>
                <p className="mt-1.5 max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                    No visitors are currently scheduled. When you invite guests or deliveries, their arrival details and gate passes will show here.
                </p>

                {/* Value Highlights Pill Row */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary-500" />
                        Gate Verification
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        Instant Pass Codes
                    </span>
                </div>

                {/* Primary Call to Action */}
                <div className="mt-6 w-full max-w-xs">
                    <button
                        onClick={onInvite}
                        type="button"
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-primary-600 to-[#1F6FDB] py-3 text-xs font-bold text-white shadow-md shadow-primary-600/20 transition-all hover:brightness-105 active:scale-98"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                        <span>Invite a Visitor</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
