import { clsx, type ClassValue } from 'clsx';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div 
            className={cn(
                "relative overflow-hidden rounded-md bg-slate-200/60",
                className
            )}
        >
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-slate-100">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-2 w-1/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}
