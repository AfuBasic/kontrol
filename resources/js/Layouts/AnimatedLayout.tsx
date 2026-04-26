import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export default function AnimatedLayout({ children }: { children: React.ReactNode }) {
    const { url } = usePage();
    const [displayChildren, setDisplayChildren] = useState(children);
    const [prevUrl, setPrevUrl] = useState(url);
    const pathname = url.split('?')[0];
    const prevPathname = useRef(pathname);

    // Sync children but allow parallel rendering during transition
    useEffect(() => {
        if (url !== prevUrl) {
            setDisplayChildren(children);
            setPrevUrl(url);
            prevPathname.current = pathname;
        }
    }, [url, children]);

    const pageVariants = {
        initial: {
            opacity: 0,
        },
        animate: {
            opacity: 1,
            transition: {
                duration: 0.3,
                ease: 'easeOut',
            },
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2,
                ease: 'easeIn',
            },
        },
    };

    return (
        <div className="relative w-full min-h-screen">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={pathname}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full min-h-screen bg-slate-50"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
