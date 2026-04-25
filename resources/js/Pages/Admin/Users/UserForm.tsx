import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link, useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect } from 'react';

type Props = {
    user?: {
        name: string;
        email: string;
        role?: string;
    };
    submitUrl: string;
    method?: 'post' | 'put';
    title: string;
    description: string;
    submitText: string;
    cancelUrl: string;
    roles?: Array<{ name: string; guard_name: string }>;
};

export default function UserForm({ user, submitUrl, method = 'post', title, description, submitText, cancelUrl, roles = [] }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || '',
    });

    // Sync form data when user prop changes (e.g. re-navigation)
    useEffect(() => {
        setData({
            name: user?.name || '',
            email: user?.email || '',
            role: user?.role || '',
        });
    }, [user]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (method === 'put') {
            put(submitUrl);
        } else {
            post(submitUrl);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
            <div className="mb-8">
                <Link href={cancelUrl} className="mb-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="mr-1 h-4 w-4" />
                    Back to Admins
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <form onSubmit={submit} className="p-6">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                placeholder="e.g. Jane Doe"
                                required
                                autoFocus
                                autoComplete="name"
                            />
                            {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                disabled={!!data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                placeholder="e.g. jane@example.com"
                                required
                                autoComplete="username"
                            />
                            {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {roles && roles.length > 0 && (
                            <div>
                                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <div className="relative">
                                    <select
                                        id="role"
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3.5 text-gray-900 placeholder-gray-400 transition-all focus:border-[#1F6FDB] focus:bg-white focus:ring-2 focus:ring-[#1F6FDB]/20 focus:outline-none"
                                        required
                                    >
                                        <option value="" disabled>
                                            Select a role...
                                        </option>
                                        {roles.map((role) => (
                                            <option key={role.name} value={role.name}>
                                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                {(errors as any).role && <p className="mt-1.5 text-sm text-red-600">{(errors as any).role}</p>}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
                        <Link href={cancelUrl} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                submitText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
