import { UserPlus, History, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import HouseholdMemberController from '@/actions/App/Http/Controllers/Resident/HouseholdMemberController';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';

const actions = [
    {
        name: 'Invite Family',
        description: 'Share access with your household',
        icon: UserPlus,
        href: '/resident/household',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
    },
    {
        name: 'View History',
        description: 'Track all community entries',
        icon: History,
        href: '/resident/visitors',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
];

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 gap-4">
            {actions.map((action, index) => (
                <motion.div
                    key={action.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                >
                    <Link
                        href={action.href}
                        className="group relative flex items-center justify-between overflow-hidden rounded-[32px] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50 transition-all hover:shadow-lg active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.bg} ${action.color}`}>
                                <action.icon className="h-7 w-7" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-slate-900">{action.name}</h4>
                                <p className="text-xs font-bold text-slate-400">{action.description}</p>
                            </div>
                        </div>
                        
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all group-hover:bg-indigo-600 group-hover:text-white">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
