import { motion } from 'framer-motion';

export default function ResidentsSkeleton() {
    const skeletonRows = Array.from({ length: 5 });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {/* Table Header Skeleton */}
            <div className="hidden overflow-x-auto sm:block">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                            </th>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <th key={i} className="px-6 py-3 text-left">
                                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                                </th>
                            ))}
                            <th className="px-6 py-3">
                                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {skeletonRows.map((_, idx) => (
                            <motion.tr key={idx} variants={item} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                                <td className="px-6 py-3">
                                    <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                                        <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-6 w-14 animate-pulse rounded-full bg-gray-200" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Skeleton */}
            <div className="space-y-3 sm:hidden">
                {skeletonRows.map((_, idx) => (
                    <motion.div key={idx} variants={item} className="rounded-lg border border-gray-100 bg-white p-4">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                                    <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                                </div>
                                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-2">
                                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                                <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
