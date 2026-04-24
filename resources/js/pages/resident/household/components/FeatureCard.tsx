import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
    title: string;
    description: string;
    icon: ReactNode;
    color: string;
    delay?: number;
}

export default function FeatureCard({ title, description, icon, color, delay = 0 }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200 transition-all hover:shadow-lg"
        >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-black text-slate-900">{title}</h4>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">{description}</p>
            </div>
        </motion.div>
    );
}
