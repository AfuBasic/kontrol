import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Feature {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    group: string;
    suggested_plan: 'basic' | 'growth' | 'pro' | null;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    billing_interval: 'quarterly' | 'semi-annually' | 'annually';
    is_featured: boolean;
    badge: string | null;
    color: string;
    visibility: 'public' | 'private';
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    is_active: boolean;
    features: number[];
}

interface Props {
    plan: Plan;
    features: Record<string, Feature[]>;
}

const colors = ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan'];
const billingIntervals = ['quarterly', 'semi-annually', 'annually'];

const suggestedPlanStyles: Record<string, { badge: string; label: string }> = {
    basic: { badge: 'bg-blue-100 text-blue-700', label: 'Basic' },
    growth: { badge: 'bg-purple-100 text-purple-700', label: 'Growth' },
    pro: { badge: 'bg-amber-100 text-amber-700', label: 'Pro' },
};

export default function EditPlan({ plan, features }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description || '',
        price: String(plan.price),
        billing_interval: plan.billing_interval,
        is_featured: plan.is_featured,
        badge: plan.badge || '',
        color: plan.color,
        visibility: plan.visibility,
        max_residents: plan.max_residents ? String(plan.max_residents) : '',
        max_security: plan.max_security ? String(plan.max_security) : '',
        max_admins: plan.max_admins ? String(plan.max_admins) : '',
        features: plan.features,
    });

    const [selectedColor, setSelectedColor] = useState(plan.color);
    const [featureSearch, setFeatureSearch] = useState('');

    // Filter features based on search
    const filteredFeatures = useMemo(() => {
        if (!featureSearch.trim()) {
            return features;
        }

        const lowerSearch = featureSearch.toLowerCase();
        const filtered: Record<string, Feature[]> = {};

        Object.entries(features).forEach(([group, groupFeatures]) => {
            const matched = groupFeatures.filter(
                (f) => f.name.toLowerCase().includes(lowerSearch) || f.description?.toLowerCase().includes(lowerSearch),
            );
            if (matched.length > 0) {
                filtered[group] = matched;
            }
        });

        return filtered;
    }, [features, featureSearch]);

    function handleFeatureToggle(featureId: number) {
        if (data.features.includes(featureId)) {
            setData(
                'features',
                data.features.filter((id) => id !== featureId),
            );
        } else {
            setData('features', [...data.features, featureId]);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Convert empty strings to null for nullable fields
        const submitData = {
            ...data,
            badge: data.badge || null,
            max_residents: data.max_residents ? Number(data.max_residents) : null,
            max_security: data.max_security ? Number(data.max_security) : null,
            max_admins: data.max_admins ? Number(data.max_admins) : null,
        };

        put(`/zeus/plans/${plan.id}`, {
            data: submitData,
        } as any);
    }

    return (
        <ZeusLayout>
            <Head title={`Edit Plan - ${plan.name}`} />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <a href="/zeus/plans" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Plans
                </a>
            </motion.div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Main Form Column */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="space-y-6 lg:col-span-2"
                >
                    {/* Basic Info */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900">Plan Details</h2>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug</label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing & Billing */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900">Pricing & Billing</h2>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price (in kobo)</label>
                                    <input
                                        type="number"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    />
                                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                                </div>

                                {/* Billing Interval */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Billing Interval</label>
                                    <select
                                        value={data.billing_interval}
                                        onChange={(e) => setData('billing_interval', e.target.value as any)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    >
                                        {billingIntervals.map((interval) => (
                                            <option key={interval} value={interval}>
                                                {interval.charAt(0).toUpperCase() + interval.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Limits */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900">Limits</h2>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Residents</label>
                                    <input
                                        type="number"
                                        value={data.max_residents}
                                        onChange={(e) => setData('max_residents', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Security</label>
                                    <input
                                        type="number"
                                        value={data.max_security}
                                        onChange={(e) => setData('max_security', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Admins</label>
                                    <input
                                        type="number"
                                        value={data.max_admins}
                                        onChange={(e) => setData('max_admins', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Display Settings */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-lg font-semibold text-gray-900">Display Settings</h2>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Badge */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Badge (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.badge}
                                        onChange={(e) => setData('badge', e.target.value)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    />
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Color</label>
                                    <select
                                        value={data.color}
                                        onChange={(e) => {
                                            setData('color', e.target.value);
                                            setSelectedColor(e.target.value);
                                        }}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    >
                                        {colors.map((color) => (
                                            <option key={color} value={color}>
                                                {color.charAt(0).toUpperCase() + color.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Featured */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={data.is_featured}
                                        onChange={(e) => setData('is_featured', e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                                    />
                                    <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-700">
                                        Mark as Featured
                                    </label>
                                </div>

                                {/* Visibility */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Visibility</label>
                                    <select
                                        value={data.visibility}
                                        onChange={(e) => setData('visibility', e.target.value as any)}
                                        className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Features Column */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="sticky top-8 flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Features</h2>

                        {/* Search Input */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={featureSearch}
                                onChange={(e) => setFeatureSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-xs text-gray-900 transition-colors placeholder:text-gray-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            {Object.keys(filteredFeatures).length === 0 ? (
                                <p className="py-8 text-center text-sm text-gray-500">No features found</p>
                            ) : (
                                Object.entries(filteredFeatures).map(([group, groupFeatures]) => (
                                    <div key={group}>
                                        <h3 className="mb-3 text-xs font-bold tracking-wide text-gray-600 uppercase">{group}</h3>
                                        <div className="space-y-2">
                                            {groupFeatures.map((feature) => (
                                                <label
                                                    key={feature.id}
                                                    className="flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={data.features.includes(feature.id)}
                                                        onChange={() => handleFeatureToggle(feature.id)}
                                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                                                            {feature.suggested_plan && (
                                                                <span
                                                                    className={`rounded px-2 py-0.5 text-[10px] font-semibold ${suggestedPlanStyles[feature.suggested_plan].badge}`}
                                                                >
                                                                    {suggestedPlanStyles[feature.suggested_plan].label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {feature.description && <p className="text-xs text-gray-500">{feature.description}</p>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="border-t border-gray-200 p-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>
            </form>
        </ZeusLayout>
    );
}
