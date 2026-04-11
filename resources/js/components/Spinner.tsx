import { motion } from 'framer-motion';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'white' | 'primary' | 'gray';
}

const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
};

const colorClasses = {
    white: 'text-white',
    primary: 'text-primary-500',
    gray: 'text-gray-500',
};

export default function Spinner({ size = 'md', color = 'white' }: SpinnerProps) {
    return (
        <motion.svg
            className={`${sizeClasses[size]} ${colorClasses[color]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </motion.svg>
    );
}
