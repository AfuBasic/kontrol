import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
    value: number;
    format?: (value: number) => string;
    className?: string;
}

export default function AnimatedCounter({ value, format, className = '' }: Props) {
    const spring = useSpring(0, { stiffness: 80, damping: 20 });
    const display = useTransform(spring, (current) => (format ? format(current) : Math.round(current).toLocaleString()));

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span className={className}>{display}</motion.span>;
}
