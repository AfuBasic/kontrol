import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

interface Props {
    theme: 'light' | 'dark';
    className?: string;
}

export default function ThemeToggleIcon({ theme, className = 'h-5 w-5' }: Props) {
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={theme}
                initial={{ rotate: -120, scale: 0.3, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 120, scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex shrink-0 items-center justify-center"
            >
                {theme === 'dark' ? (
                    <Sun className={`${className} text-amber-400`} />
                ) : (
                    <Moon className={`${className} text-slate-700 dark:text-slate-300`} />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
