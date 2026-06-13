import type { Variants } from 'framer-motion';
import { motion } from 'framer-motion';
import React from 'react';

type Variant = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'scale-up';

interface Props {
    children: React.ReactNode;
    variant?: Variant;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
    amount?: number | 'some' | 'all';
}

const variants: Record<Variant, Variants> = {
    fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    'slide-up': { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
    'slide-down': { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } },
    'slide-left': { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
    'slide-right': { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } },
    'scale-up': { hidden: { opacity: 0, scale: 0.95, y: 15 }, visible: { opacity: 1, scale: 1, y: 0 } },
};

export default function ScrollReveal({
    children,
    variant = 'slide-up',
    delay = 0,
    duration = 0.5,
    className,
    once = true,
    amount = 0.05,
}: Props) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
                once,
                amount,
                fallback: true,
            } as any}
            variants={variants[variant]}
            transition={{ duration, delay, ease: [0.215, 0.610, 0.355, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
