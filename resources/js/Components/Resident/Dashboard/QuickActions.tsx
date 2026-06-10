import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { UserPlus, History, Shield, HelpCircle, ArrowRight, Megaphone } from 'lucide-react';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import HouseholdMemberController from '@/actions/App/Http/Controllers/Resident/HouseholdMemberController';

const actions = [
    {
        name: 'Announcements',
        description: 'Latest community news & posts',
        icon: Megaphone,
        href: '/resident/estate-board',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50/70 border border-emerald-100/50',
    },
    {
        name: 'Invite Family',
        description: 'Share access with your household',
        icon: UserPlus,
        href: '/resident/household',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50/70 border border-indigo-100/50',
    },
    {
        name: 'View History',
        description: 'Track all community entries',
        icon: History,
        href: '/resident/visitors',
        color: 'text-amber-600',
        bg: 'bg-amber-50/70 border border-amber-100/50',
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
        <div
            className={`grid gap-3 ${
                visibleActions.length === 2 ? 'grid-cols-2' : visibleActions.length === 3 ? 'grid-cols-3' : 'grid-cols-1'
            }`}
        >
            {visibleActions.map((action, index) => (
                <motion.div
                    key={action.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                >
                    <Link
                        href={action.href}
                        className="group flex flex-col items-center justify-center text-center p-4 bg-white rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.015)] border border-slate-200/50 transition-all hover:shadow-[0_8px_25px_rgba(0,0,0,0.03)] hover:border-slate-300 active:scale-95 min-h-[110px]"
                    >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-2.5 transition-transform duration-300 group-hover:scale-105 ${action.bg} ${action.color}`}>
                            <action.icon className="h-6 w-6" strokeWidth={2.4} />
                        </div>
                        <span className="text-xs font-black text-slate-800 leading-tight truncate w-full">
                            {action.name}
                        </span>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
