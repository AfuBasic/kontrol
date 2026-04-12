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
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
        >
            {/* Table Header Skeleton */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left">
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <th key={i} className="px-6 py-3 text-left">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </th>
                            ))}
                            <th className="px-6 py-3">
                                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {skeletonRows.map((_, idx) => (
                            <motion.tr
                                key={idx}
                                variants={item}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                                <td className="px-6 py-3">
                                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card Skeleton */}
            <div className="sm:hidden space-y-3">
                {skeletonRows.map((_, idx) => (
                    <motion.div
                        key={idx}
                        variants={item}
                        className="rounded-lg border border-gray-100 bg-white p-4"
                    >
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                                </div>
                                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
