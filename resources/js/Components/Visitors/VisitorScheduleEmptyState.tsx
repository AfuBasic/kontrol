import { motion } from 'framer-motion';
import { UserCheck, Plus } from 'lucide-react';

interface Props {
    onInvite: () => void;
}

export default function VisitorScheduleEmptyState({ onInvite }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="brand-card !rounded-3xl p-6 text-center text-white"
        >
            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                    <UserCheck className="h-7 w-7 text-sky-300" strokeWidth={1.75} />
                </div>

                <h3 className="text-lg font-bold tracking-tight">You're all clear today</h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-300">
                    No visitors are scheduled. When you invite a guest or a delivery, their pass and arrival details will show here.
                </p>

                <button
                    onClick={onInvite}
                    type="button"
                    className="group mt-6 inline-flex min-h-[44px] w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary-950/30 transition-all hover:bg-primary-400 active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    <span>Invite a Visitor</span>
                </button>
            </div>
        </motion.div>
    );
}
