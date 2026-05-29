import { motion } from 'framer-motion';

interface Props {
    isExiting: boolean;
}

export default function AppLoader({ isExiting }: Props) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-10000 flex flex-col items-center justify-center bg-white"
        >
            <div className="relative flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="h-40 w-auto object-contain" />
                </motion.div>

                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '40px' }}
                    transition={{ delay: 0.4, duration: 1.5, ease: 'easeInOut' }}
                    className="mt-12 h-[2px] rounded-full bg-indigo-600"
                />

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-4 text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase"
                >
                    Secure Access
                </motion.p>
            </div>
        </motion.div>
    );
}
