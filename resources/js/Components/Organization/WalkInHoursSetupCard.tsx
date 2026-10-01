import { Link } from '@inertiajs/react';
import { ChevronRight, Clock } from 'lucide-react';

interface Props {
    organizationName: string;
    isAdmin: boolean;
}

/**
 * Shown while an organization that takes walk-ins only during its hours has none set:
 * until then, security turns every walk-in away at the gate.
 */
export default function WalkInHoursSetupCard({ organizationName, isAdmin }: Props) {
    return (
        <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200/80" aria-labelledby="walk-in-hours-setup">
            <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Clock className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                    <h2 id="walk-in-hours-setup" className="text-[15px] font-semibold text-amber-950">
                        Set your walk-in hours
                    </h2>
                    <p className="mt-0.5 text-[13px] leading-snug text-amber-900/80">
                        Security is turning away walk-ins to {organizationName} until you add the times you're open to visitors.
                    </p>
                </div>
            </div>

            {isAdmin ? (
                <Link
                    href="/org/public-windows"
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-amber-900 text-[14px] font-semibold text-white active:scale-[0.99]"
                >
                    Set walk-in hours
                    <ChevronRight className="h-4 w-4" />
                </Link>
            ) : (
                <p className="mt-3 rounded-xl bg-white/60 px-3 py-2.5 text-[13px] text-amber-900">
                    Ask a {organizationName} admin to set them.
                </p>
            )}
        </section>
    );
}
