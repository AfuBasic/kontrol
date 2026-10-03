interface Props {
    /** How many are done. */
    value: number;
    /** Out of how many. */
    total: number;
    /** Ring colour while in progress. */
    tone?: 'amber' | 'blue';
    size?: number;
    label?: string;
}

const TONES = {
    amber: { track: 'stroke-amber-100', bar: 'stroke-amber-500', text: 'text-amber-700' },
    blue: { track: 'stroke-blue-100', bar: 'stroke-[#0b4aa2]', text: 'text-[#0b4aa2]' },
} as const;

/**
 * A small circular progress indicator with the count in the middle. The ring fills smoothly as numbers
 * change, and stays still for people who ask their device to reduce motion.
 */
export default function ProgressRing({ value, total, tone = 'amber', size = 40, label }: Props) {
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
    const colours = TONES[tone];

    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={value}
            aria-label={label ?? `${value} of ${total}`}
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={colours.track} />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ratio)}
                    className={`${colours.bar} transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none`}
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums ${colours.text}`}>
                {value}/{total}
            </span>
        </div>
    );
}
