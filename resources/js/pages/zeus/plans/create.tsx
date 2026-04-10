import { Head, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';
import { ChevronLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Feature {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    group: string;
}

interface CopyPlan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    billing_interval: 'monthly' | 'annual';
    is_featured: boolean;
    badge: string | null;
    color: string;
    visibility: 'public' | 'private';
    max_residents: number | null;
    max_security: number | null;
    max_admins: number | null;
    features: number[];
}

interface Props {
    features: Record<string, Feature[]>;
    copyPlan?: CopyPlan;
}

const colors = ['blue', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'green', 'teal', 'cyan'];
const billingIntervals = ['monthly', 'annual'];

export default function CreatePlan({ features, copyPlan }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        billing_interval: 'monthly',
        is_featured: false,
        badge: '',
        color: 'blue',
        visibility: 'public',
        max_residents: '',
        max_security: '',
        max_admins: '',
        features: [] as number[],
    });

    const [selectedColor, setSelectedColor] = useState('blue');
    const [featureSearch, setFeatureSearch] = useState('');

    // Pre-fill form when copying a plan
    useEffect(() => {
        if (copyPlan) {
            setData({
                name: `Copy of ${copyPlan.name}`,
                slug: `${copyPlan.slug}-copy-${Date.now()}`,
                description: copyPlan.description || '',
                price: copyPlan.price.toString(),
                billing_interval: copyPlan.billing_interval,
                is_featured: false,
                badge: copyPlan.badge || '',
                color: copyPlan.color,
                visibility: copyPlan.visibility,
                max_residents: copyPlan.max_residents?.toString() || '',
                max_security: copyPlan.max_security?.toString() || '',
                max_admins: copyPlan.max_admins?.toString() || '',
                features: copyPlan.features,
            });
            setSelectedColor(copyPlan.color);
        }
    }, [copyPlan]);

    // Filter features based on search
    const filteredFeatures = useMemo(() => {
        if (!featureSearch.trim()) {
            return features;
        }

        const lowerSearch = featureSearch.toLowerCase();
        const filtered: Record<string, Feature[]> = {};

        Object.entries(features).forEach(([group, groupFeatures]) => {
            const matched = groupFeatures.filter(
                (f) =>
                    f.name.toLowerCase().includes(lowerSearch) ||
                    f.description?.toLowerCase().includes(lowerSearch)
            );
            if (matched.length > 0) {
                filtered[group] = matched;
            }
        });

        return filtered;
    }, [features, featureSearch]);

    function handleFeatureToggle(featureId: number) {
        if (data.features.includes(featureId)) {
            setData('features', data.features.filter((id) => id !== featureId));
        } else {
            setData('features', [...data.features, featureId]);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/zeus/plans');
    }

    return (
        <ZeusLayout>
            <Head title={copyPlan ? 'Copy Plan' : 'Create Plan'} />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <a
                    href="/zeus/plans"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Plans
                </a>
            </motion.div>

            {/* Header with copy indicator */}
            {copyPlan && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4"
                >
                    <p className="text-sm font-medium text-blue-900">
                        You're creating a copy of <span className="font-bold">"{copyPlan.name}"</span>
                    </p>
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Main Form Column */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="lg:col-span-2 space-y-6"
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
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        // Auto-generate slug
                                        setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                                    }}
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="e.g., Professional Plan"
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
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="professional-plan"
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
                                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="Brief description of this plan"
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
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="0"
                                    />
                                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                                </div>

                                {/* Billing Interval */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Billing Interval</label>
                                    <select
                                        value={data.billing_interval}
                                        onChange={(e) => setData('billing_interval', e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Security</label>
                                    <input
                                        type="number"
                                        value={data.max_security}
                                        onChange={(e) => setData('max_security', e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Admins</label>
                                    <input
                                        type="number"
                                        value={data.max_admins}
                                        onChange={(e) => setData('max_admins', e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="Leave empty for unlimited"
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
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        placeholder="e.g., Most Popular"
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
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                                        onChange={(e) => setData('visibility', e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
                    className="rounded-xl border border-gray-200 bg-white shadow-sm sticky top-8 flex flex-col overflow-hidden"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                >
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Features</h2>

                        {/* Search Input */}
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={featureSearch}
                                onChange={(e) => setFeatureSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-500 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="space-y-6">
                            {Object.keys(filteredFeatures).length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-8">No features found</p>
                            ) : (
                                Object.entries(filteredFeatures).map(([group, groupFeatures]) => (
                            <div key={group}>
                                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">{group}</h3>
                                <div className="space-y-2">
                                    {groupFeatures.map((feature) => (
                                        <label
                                            key={feature.id}
                                            className="flex items-start gap-3 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.features.includes(feature.id)}
                                                onChange={() => handleFeatureToggle(feature.id)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                                            />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                                                {feature.description && (
                                                    <p className="text-xs text-gray-500">{feature.description}</p>
                                                )}
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
                            {processing ? (copyPlan ? 'Copying...' : 'Creating...') : (copyPlan ? 'Create Copy' : 'Create Plan')}
                        </button>
                    </div>
                </motion.div>
            </form>
        </ZeusLayout>
    );
}
