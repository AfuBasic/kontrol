import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AnimatedLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();

    return (
        <div className="relative min-h-screen w-full">
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={url}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.32, 0.94, 0.6, 1] }} // Native iOS Cubic Bezier
                    className="relative min-h-screen w-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
