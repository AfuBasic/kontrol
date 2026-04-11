import { useState } from 'react';
import { CheckIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
    color: string; // hex or css color string from DB
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    features: Feature[];
}

interface Props {
    plan: Plan;
    allFeatures: Feature[];
    billingPeriod: 'quarterly' | 'semi-annually' | 'annually';
    onSelect: (planId: number) => void;
}

export default function PricingCard({ plan, allFeatures, billingPeriod, onSelect }: Props) {
    const [showAll, setShowAll] = useState(false);
    const accent = plan.color || '#3b82f6'; // fallback blue
    const primaryFeatures = allFeatures.slice(0, 4);
    const extraFeatures = allFeatures.slice(4);

    const billingIntervalLabel = {
        'quarterly': 'per quarter',
        'semi-annually': 'every 6 months',
        'annually': 'per year',
    }[plan.billing_interval] || plan.billing_interval;

    return (
        <div
            className={`group relative flex h-full flex-col overflow-hidden rounded-4xl border bg-slate-900/60 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 ${
                plan.is_featured ? 'z-10 border-white/10 lg:scale-[1.03]' : 'border-slate-800/80 hover:border-slate-700/80'
            }`}
            style={{
                boxShadow: plan.is_featured
                    ? `0 0 60px -15px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
        >
            {/* Intense Ambient Top Glow */}
            <div
                className="absolute top-[-50px] right-[-20%] left-[-20%] h-48 rounded-full opacity-20 blur-[80px] transition-opacity duration-700 group-hover:opacity-40"
                style={{ background: accent }}
            />

            {/* Featured/Custom badge */}
            {(plan.badge || plan.is_featured) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                    <div
                        className="inline-flex items-center gap-1.5 rounded-b-xl px-4 py-1.5 text-center text-[10px] font-bold tracking-widest text-white uppercase shadow-lg backdrop-blur-md"
                        style={{
                            background: `linear-gradient(to bottom, ${accent}dd, ${accent}aa)`,
                            borderBottom: '1px solid rgba(255,255,255,0.2)',
                            borderLeft: '1px solid rgba(255,255,255,0.1)',
                            borderRight: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        {plan.is_featured && <StarIcon className="h-3 w-3" />}
                        {plan.badge || 'Most Popular'}
                    </div>
                </div>
            )}

            <div className="relative z-20 flex flex-1 flex-col p-8 lg:p-10">
                <h3 className={`text-xl font-bold tracking-tight text-white ${plan.is_featured ? 'mt-2' : ''}`}>{plan.name}</h3>
                <p className="mt-2 text-sm leading-relaxed font-light text-slate-400">{plan.description}</p>
                <div className="mt-8 mb-2 flex items-baseline gap-x-2">
                    <span className="text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">{plan.formatted_price}</span>
                    <span className="text-sm font-medium text-slate-400">/ {billingIntervalLabel}</span>
                </div>

                <ul className="mt-8 space-y-4 border-t border-slate-800/80 pt-8">
                    <li className="flex items-center text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                        <CheckIcon className="mr-3 h-5 w-5 shrink-0" style={{ color: accent }} />
                        {plan.max_residents ? `Up to ${plan.max_residents} residents` : 'Unlimited residents'}
                    </li>
                    <li className="flex items-center text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                        <CheckIcon className="mr-3 h-5 w-5 shrink-0" style={{ color: accent }} />
                        {plan.max_security ? `Up to ${plan.max_security} security staff` : 'Unlimited security staff'}
                    </li>
                    <li className="flex items-center text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                        <CheckIcon className="mr-3 h-5 w-5 shrink-0" style={{ color: accent }} />
                        {plan.max_admins ? `Up to ${plan.max_admins} admin users` : 'Unlimited admin users'}
                    </li>

                    {primaryFeatures.map((f) => {
                        const isIncluded = plan.features.some((pf) => pf.id === f.id);
                        return (
                            <li
                                key={f.id}
                                className={`flex items-start text-sm transition-colors ${isIncluded ? 'font-medium text-slate-300' : 'font-light text-slate-500 opacity-40'}`}
                            >
                                {isIncluded ? (
                                    <CheckIcon className="mt-0.5 mr-3 h-5 w-5 shrink-0" style={{ color: accent }} />
                                ) : (
                                    <XMarkIcon className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-slate-600" />
                                )}
                                <span className={isIncluded ? '' : 'line-through decoration-slate-600/50'}>{f.name}</span>
                            </li>
                        );
                    })}

                    {extraFeatures.length > 0 && !showAll && (
                        <li>
                            <button
                                type="button"
                                className="mt-2 text-xs font-semibold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-300"
                                onClick={() => setShowAll(true)}
                            >
                                + {extraFeatures.length} more features
                            </button>
                        </li>
                    )}

                    {showAll &&
                        extraFeatures.map((f) => {
                            const isIncluded = plan.features.some((pf) => pf.id === f.id);
                            return (
                                <li
                                    key={f.id}
                                    className={`flex items-start text-sm transition-colors ${isIncluded ? 'font-medium text-slate-300' : 'font-light text-slate-500 opacity-40'}`}
                                >
                                    {isIncluded ? (
                                        <CheckIcon className="mt-0.5 mr-3 h-5 w-5 shrink-0" style={{ color: accent }} />
                                    ) : (
                                        <XMarkIcon className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-slate-600" />
                                    )}
                                    <span className={isIncluded ? '' : 'line-through decoration-slate-600/50'}>{f.name}</span>
                                </li>
                            );
                        })}
                </ul>
            </div>

            <div className="relative z-20 mt-auto p-8 pt-0 lg:p-10">
                <button
                    onClick={() => onSelect(plan.id)}
                    className="w-full rounded-[14px] px-6 py-4 text-sm font-bold tracking-wide transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]"
                    style={
                        plan.is_featured
                            ? {
                                  background: `linear-gradient(to bottom, ${accent}, ${accent}dd)`,
                                  color: '#fff',
                                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 8px 20px -6px ${accent}60`,
                                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                              }
                            : {
                                  background: 'rgba(255,255,255,0.03)',
                                  color: '#fff',
                                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.1)',
                              }
                    }
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}
