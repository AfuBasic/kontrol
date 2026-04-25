import { motion } from 'framer-motion';

type Props = {
    used: number;
    limit: number | null;
};

export default function DailyLimitCard({ used, limit }: Props) {
    const isUnlimited = limit === null;
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= limit;

    return (
        <div className="mb-6 overflow-hidden rounded-2xl bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-gray-100">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900">Daily Generation Limit</h3>
                    <p className="text-xs text-gray-500">
                        {isUnlimited ? (
                            <span>
                                You have generated <span className="font-medium text-gray-900">{used}</span> codes today
                            </span>
                        ) : (
                            <span>
                                You have generated <span className="font-medium text-gray-900">{used}</span> of{' '}
                                <span className="font-medium text-gray-900">{limit}</span> codes today
                            </span>
                        )}
                    </p>
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isAtLimit ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                    }`}
                >
                    {isUnlimited ? <span className="text-xl font-bold">∞</span> : <span className="text-sm font-bold">{limit - used}</span>}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`absolute inset-y-0 left-0 rounded-full ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-indigo-500'}`}
                />
            </div>

            {isAtLimit && <p className="mt-2 text-xs font-medium text-red-600">You have reached your daily limit. Please try again tomorrow.</p>}
        </div>
    );
}
