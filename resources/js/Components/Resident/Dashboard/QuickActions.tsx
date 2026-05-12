import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { UserPlus, History, Shield, HelpCircle, ArrowRight, Megaphone } from 'lucide-react';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import HouseholdMemberController from '@/actions/App/Http/Controllers/Resident/HouseholdMemberController';

const actions = [
    {
        name: 'Estate Board',
        description: 'Latest community news & posts',
        icon: Megaphone,
        href: '/resident/estate-board',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
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

import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

export default function QuickActions() {
    const { estate_plan, auth } = usePage<SharedData & { estate_plan: any }>().props;
    const features = estate_plan?.features || [];
    const userRoles = auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');

    const visibleActions = actions.filter((action) => {
        if (action.name === 'Invite Family' && (isHouseholdMember || !features.includes('household-management'))) {
            return false;
        }
        if (action.name === 'View History' && !features.includes('access-code-generation')) {
            return false;
        }
        return true;
    });

    return (
        <div className="grid grid-cols-1 gap-4">
            {visibleActions.map((action, index) => (
                <motion.div key={action.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }}>
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
