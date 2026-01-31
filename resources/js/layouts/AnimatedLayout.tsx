import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AnimatedLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();

    const pageVariants = {
        initial: { x: 50, opacity: 0.5 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0.5 },
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={url}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                    duration: 0.2,
                    type: 'keyframes',
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
