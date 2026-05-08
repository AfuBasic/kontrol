import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Feature {
    id: number;
    name: string;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    formatted_price: string;
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
    is_featured: boolean;
    badge: string | null;
    color: string;
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    features: Feature[];
}

interface Props {
    plan: Plan;
    allFeatures: Feature[];
    billingPeriod: 'quarterly' | 'semi-annually' | 'annually';
    savings?: number;
    onSelect: (planId: number) => void;
}

export default function PricingCard({ plan, allFeatures, savings, onSelect }: Props) {
    const [showAll, setShowAll] = useState(false);
    const primaryFeatures = allFeatures.slice(0, 4);
    const extraFeatures = allFeatures.slice(4);

    const billingIntervalLabel = {
        quarterly: 'per quarter',
        'semi-annually': 'per 6 months',
        annually: 'per year',
    }[plan.billing_interval];

    const priceValue = plan.formatted_price.replace(/[^\d.,]/g, '');

    const capacityItems = [
        plan.max_residents ? `Up to ${plan.max_residents} residents` : 'Unlimited residents',
        plan.max_security ? `Up to ${plan.max_security} security staff` : 'Unlimited security staff',
        plan.max_admins ? `Up to ${plan.max_admins} admins` : 'Unlimited admins',
    ];

    if (plan.is_featured) {
        return (
            <FeaturedCard
                plan={plan}
                priceValue={priceValue}
                billingIntervalLabel={billingIntervalLabel}
                savings={savings}
                capacityItems={capacityItems}
                primaryFeatures={primaryFeatures}
                extraFeatures={extraFeatures}
                showAll={showAll}
                onToggleShowAll={() => setShowAll((v) => !v)}
                onSelect={() => onSelect(plan.id)}
            />
        );
    }

    return (
        <RegularCard
            plan={plan}
            priceValue={priceValue}
            billingIntervalLabel={billingIntervalLabel}
            savings={savings}
            capacityItems={capacityItems}
            primaryFeatures={primaryFeatures}
            extraFeatures={extraFeatures}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((v) => !v)}
            onSelect={() => onSelect(plan.id)}
        />
    );
}

interface CardProps {
    plan: Plan;
    priceValue: string;
    billingIntervalLabel: string;
    savings?: number;
    capacityItems: string[];
    primaryFeatures: Feature[];
    extraFeatures: Feature[];
    showAll: boolean;
    onToggleShowAll: () => void;
    onSelect: () => void;
}

function RegularCard({
    plan,
    priceValue,
    billingIntervalLabel,
    savings,
    capacityItems,
    primaryFeatures,
    extraFeatures,
    showAll,
    onToggleShowAll,
    onSelect,
}: CardProps) {
    return (
        <div className="relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-slate-300 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.15)]">
            {plan.badge && (
                <div className="absolute -top-3 left-8">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.15em] text-slate-600 uppercase shadow-sm">
                        {plan.badge}
                    </span>
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">{plan.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{plan.description}</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
                {savings && savings > 0 ? (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Save {savings}%
                    </span>
                ) : null}
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-slate-500">₦</span>
                    <span className="text-5xl font-bold tracking-tight text-slate-900">{priceValue}</span>
                </div>
                <p className="text-xs text-slate-500">{billingIntervalLabel} · per resident</p>
            </div>

            <button
                onClick={onSelect}
                className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
            >
                Get started
            </button>

            <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-500 uppercase">What's included</p>
                <ul className="mt-4 space-y-3">
                    {capacityItems.map((item) => (
                        <FeatureRow key={item} label={item} included variant="light" />
                    ))}
                    {primaryFeatures.map((f) => (
                        <FeatureRow key={f.id} label={f.name} included={plan.features.some((pf) => pf.id === f.id)} variant="light" />
                    ))}
                    {showAll &&
                        extraFeatures.map((f) => (
                            <FeatureRow key={f.id} label={f.name} included={plan.features.some((pf) => pf.id === f.id)} variant="light" />
                        ))}
                </ul>
                {extraFeatures.length > 0 && (
                    <button
                        type="button"
                        onClick={onToggleShowAll}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
                    >
                        {showAll ? 'Show less' : `Show ${extraFeatures.length} more`}
                        <svg
                            className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

function FeaturedCard({
    plan,
    priceValue,
    billingIntervalLabel,
    savings,
    capacityItems,
    primaryFeatures,
    extraFeatures,
    showAll,
    onToggleShowAll,
    onSelect,
}: CardProps) {
    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-slate-950 p-8 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] lg:-my-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary-700/15 blur-3xl" />
            </div>

            <div className="relative">
                <div className="absolute -top-5 left-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-primary-500 to-primary-700 px-3 py-1 text-[10px] font-semibold tracking-[0.15em] text-white uppercase shadow-lg shadow-primary-500/30">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-white" />
                        {plan.badge || 'Most popular'}
                    </span>
                </div>

                <div className="mt-4">
                    <h3 className="text-lg font-semibold tracking-tight text-white">{plan.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{plan.description}</p>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    {savings && savings > 0 ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30 ring-inset">
                            Save {savings}%
                        </span>
                    ) : null}
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-slate-400">₦</span>
                        <span className="text-5xl font-bold tracking-tight text-white">{priceValue}</span>
                    </div>
                    <p className="text-xs text-slate-400">{billingIntervalLabel} · per resident</p>
                </div>

                <button
                    onClick={onSelect}
                    className="mt-6 w-full rounded-xl bg-white py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:bg-slate-100"
                >
                    Get started
                </button>

                <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-400 uppercase">What's included</p>
                    <ul className="mt-4 space-y-3">
                        {capacityItems.map((item) => (
                            <FeatureRow key={item} label={item} included variant="dark" />
                        ))}
                        {primaryFeatures.map((f) => (
                            <FeatureRow key={f.id} label={f.name} included={plan.features.some((pf) => pf.id === f.id)} variant="dark" />
                        ))}
                        {showAll &&
                            extraFeatures.map((f) => (
                                <FeatureRow key={f.id} label={f.name} included={plan.features.some((pf) => pf.id === f.id)} variant="dark" />
                            ))}
                    </ul>
                    {extraFeatures.length > 0 && (
                        <button
                            type="button"
                            onClick={onToggleShowAll}
                            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
                        >
                            {showAll ? 'Show less' : `Show ${extraFeatures.length} more`}
                            <svg
                                className={`h-3 w-3 transition-transform ${showAll ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeatureRow({ label, included, variant }: { label: string; included: boolean; variant: 'light' | 'dark' }) {
    const includedIconClass = variant === 'light' ? 'text-primary-600' : 'text-primary-400';
    const excludedIconClass = variant === 'light' ? 'text-slate-300' : 'text-slate-600';
    const includedTextClass = variant === 'light' ? 'text-slate-700' : 'text-slate-200';
    const excludedTextClass = variant === 'light' ? 'text-slate-400' : 'text-slate-500';

    return (
        <li className="flex items-start gap-3 text-sm">
            {included ? (
                <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${includedIconClass}`} strokeWidth={2.5} />
            ) : (
                <XMarkIcon className={`mt-0.5 h-4 w-4 shrink-0 ${excludedIconClass}`} strokeWidth={2.5} />
            )}
            <span className={included ? includedTextClass : `${excludedTextClass} line-through decoration-slate-300`}>{label}</span>
        </li>
    );
}
