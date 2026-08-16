import { formatStayDuration, type VisitorRecord } from './types';

type Props = {
    visitors: VisitorRecord[];
    /** When false, presence cannot be derived (no check-out tracking). */
    checkoutEnabled: boolean;
    expectedTodayCount?: number;
    onSelect?: (record: VisitorRecord) => void;
};

/**
 * Surface 1 - who is on the property right now (checked in, not checked out).
 * Warning color is reserved exclusively for overstay.
 */
export default function OnPropertyNow({ visitors, checkoutEnabled, expectedTodayCount = 0, onSelect }: Props) {
    return (
        <section aria-labelledby="on-property-heading" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 id="on-property-heading" className="text-base font-semibold tracking-tight text-gray-900">
                        On the property now
                    </h2>
                    {checkoutEnabled && visitors.length > 0 && (
                        <p className="mt-0.5 text-xs font-medium text-gray-500">
                            {visitors.length} {visitors.length === 1 ? 'guest' : 'guests'} checked in
                        </p>
                    )}
                </div>

                {checkoutEnabled && expectedTodayCount > 0 && (
                    <p className="text-xs font-medium text-gray-500">{expectedTodayCount} expected today</p>
                )}
            </div>

            {!checkoutEnabled ? (
                <p className="text-sm font-medium text-gray-500">
                    Presence isn&apos;t tracked for this estate - visitor check-out is disabled, so we can&apos;t tell who is still on the property.
                </p>
            ) : visitors.length === 0 ? (
                <p className="text-sm font-medium text-gray-500">No one currently on the property</p>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {visitors.map((visitor) => (
                        <li key={visitor.id}>
                            <button
                                type="button"
                                onClick={() => onSelect?.(visitor)}
                                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-gray-50 active:scale-[0.995] sm:gap-4 sm:px-5 ${
                                    visitor.is_overstayed ? 'border-l-2 border-l-warning-500 bg-warning-50/40 hover:bg-warning-50/70' : ''
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <p className="truncate text-sm font-semibold text-gray-900">{visitor.visitor.name}</p>
                                        {visitor.is_overstayed && (
                                            <span className="inline-flex items-center rounded-md bg-warning-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-warning-700 uppercase">
                                                Overstay
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                                        Visiting {visitor.host.name}
                                        {visitor.host.unit ? <span className="text-gray-400"> · {visitor.host.unit}</span> : null}
                                    </p>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-xs font-semibold text-gray-800 tabular-nums">{visitor.verified_at_time}</p>
                                    <p
                                        className={`mt-0.5 text-[11px] font-medium tabular-nums ${
                                            visitor.is_overstayed ? 'text-warning-700' : 'text-gray-400'
                                        }`}
                                    >
                                        {formatStayDuration(visitor.duration_minutes)}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
