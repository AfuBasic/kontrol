import { motion } from 'framer-motion';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    color?: 'primary' | 'white';
}

export default function Spinner({ size = 'md', className = '', color = 'primary' }: SpinnerProps) {
    const sizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
    };

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
            className={`${sizes[size]} rounded-full border-t-2 border-r-2 ${color === 'white' ? 'border-white/20 border-t-white' : 'border-indigo-600/20 border-t-indigo-600'} ${className}`}
        />
    );
}
