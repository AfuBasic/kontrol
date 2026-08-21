
import { motion } from 'framer-motion';

interface Props {
    userName: string;
    estateName: string;
    _unreadCount: number;
    isHouseholdMember?: boolean;
    parentResidentName?: string | null;
}

export default function DashboardHeader({ userName, estateName, _unreadCount, isHouseholdMember, parentResidentName }: Props) {
    const firstName = userName.split(' ')[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
            <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold tracking-tight text-slate-900"
            >
                {greeting}, {firstName}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-medium text-slate-500"
            >
                {estateName} {isHouseholdMember && parentResidentName && `· Household of ${parentResidentName}`}
            </motion.p>
        </motion.div>
    );
}
