import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Copy, FileSpreadsheet, Link as LinkIcon, Mail, Power, RefreshCw, Share2, Upload, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    store as inviteLinkStore,
    regenerate as inviteLinkRegenerate,
    toggle as inviteLinkToggle,
} from '@/actions/App/Http/Controllers/Admin/InviteLinkController';
import { bulkInvite, index, store, create as residentCreate } from '@/actions/App/Http/Controllers/Admin/ResidentController';

type TabType = 'single' | 'bulk' | 'paste' | 'invite_link';

interface InviteLink {
    token: string;
    url: string;
    is_active: boolean;
    usage_count: number;
    max_usages: number | null;
    requires_approval: boolean;
    expires_at: string | null;
    is_expired: boolean;
}

interface Props {
    inviteLink: InviteLink | null;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function extractEmailsFromText(text: string): string[] {
    // Split by common delimiters: comma, space, newline, semicolon, dash
    const parts = text.split(/[,\s;\n-]+/);
    const emails: string[] = [];

    for (const part of parts) {
        const trimmed = part.trim().toLowerCase();
        if (EMAIL_REGEX.test(trimmed) && !emails.includes(trimmed)) {
            emails.push(trimmed);
        }
    }

    return emails;
}

function extractEmailsFromRow(row: unknown[]): string | null {
    for (const cell of row) {
        if (typeof cell === 'string') {
            const trimmed = cell.trim().toLowerCase();
            if (EMAIL_REGEX.test(trimmed)) {
                return trimmed;
            }
        }
    }
    return null;
}

export default function CreateResident({ inviteLink }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('invite_link');
    const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
    const [pasteText, setPasteText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Invite Link Modal & Settings State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isEditingSettings, setIsEditingSettings] = useState(false);
    const [inviteSettings, setInviteSettings] = useState({
        max_usages: inviteLink?.max_usages || '',
        requires_approval: inviteLink?.requires_approval ?? true,
        expires_at: inviteLink?.expires_at ? inviteLink.expires_at.split(' ')[0] : '',
    });

    // Sync state with props when inviteLink changes
    useEffect(() => {
        if (inviteLink) {
            setInviteSettings({
                max_usages: inviteLink.max_usages ?? '',
                requires_approval: inviteLink.requires_approval,
                expires_at: inviteLink.expires_at ? inviteLink.expires_at.split(' ')[0] : '',
            });
        }
    }, [inviteLink]);

    // Single resident form
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        unit_number: '',
        address: '',
    });

    function handleSubmitSingle(e: React.FormEvent) {
        e.preventDefault();
        post(store.url());
    }

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkError(null);
        setIsProcessing(true);
        setFileName(file.name);

        const isCsv = file.name.toLowerCase().endsWith('.csv');

        if (isCsv) {
            const { default: Papa } = await import('papaparse');
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    const emails: string[] = [];
                    results.data.forEach((row: any) => {
                        if (Array.isArray(row)) {
                            const email = extractEmailsFromRow(row);
                            if (email && !emails.includes(email)) {
                                emails.push(email);
                            }
                        }
                    });
                    setExtractedEmails(emails);
                    setIsProcessing(false);
                },
                error: () => {
                    setBulkError('Failed to parse CSV file.');
                    setIsProcessing(false);
                },
            });
        } else {
            // Assume XLSX
            try {
                const { default: ExcelJS } = await import('exceljs');
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const buffer = event.target?.result as ArrayBuffer;
                        const workbook = new ExcelJS.Workbook();
                        await workbook.xlsx.load(buffer);

                        const emails: string[] = [];

                        workbook.eachSheet((sheet) => {
                            sheet.eachRow((row) => {
                                // exceljs row.values can be an array where index 0 is null/empty
                                const values = Array.isArray(row.values) ? row.values.slice(1) : [];
                                const email = extractEmailsFromRow(values);
                                if (email && !emails.includes(email)) {
                                    emails.push(email);
                                }
                            });
                        });

                        setExtractedEmails(emails);
                        setIsProcessing(false);
                    } catch (err) {
                        console.error('Excel parse error:', err);
                        setBulkError('Failed to parse Excel file. Please ensure it is a valid .xlsx file.');
                        setIsProcessing(false);
                    }
                };
                reader.onerror = () => {
                    setBulkError('Failed to read file.');
                    setIsProcessing(false);
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error('Library load error:', err);
                setBulkError('Failed to load processing libraries.');
                setIsProcessing(false);
            }
        }
    }, []);

    // Handle paste text change
    const handlePasteChange = useCallback((text: string) => {
        setPasteText(text);
        const emails = extractEmailsFromText(text);
        setExtractedEmails(emails);
    }, []);

    // Remove email from list
    const removeEmail = useCallback((emailToRemove: string) => {
        setExtractedEmails((prev) => prev.filter((email) => email !== emailToRemove));
    }, []);

    // Submit bulk invites
    const handleBulkSubmit = useCallback(() => {
        if (extractedEmails.length === 0) return;

        router.post(
            bulkInvite.url(),
            { emails: extractedEmails },
            {
                onSuccess: () => {
                    setExtractedEmails([]);
                    setPasteText('');
                    setFileName(null);
                },
            },
        );
    }, [extractedEmails]);

    // Clear current selection
    const handleClear = useCallback(() => {
        setExtractedEmails([]);
        setPasteText('');
        setFileName(null);
        setBulkError(null);
    }, []);

    const { auth } = usePage<any>().props;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyLink = () => {
        if (inviteLink?.url) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(inviteLink.url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } else {
                // Fallback for non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = inviteLink.url;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
        }
    };

    const handleShareWhatsApp = () => {
        if (inviteLink?.url) {
            const text = encodeURIComponent(
                `Hi! You've been invited to join ${auth.user.estate_name} on Kontrol. 🚀\n\nClick the link below to get started: ${inviteLink.url}`,
            );
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    const handleGenerateLink = () => {
        const isInitialGeneration = !inviteLink;

        router.post(
            inviteLinkStore.url(),
            {
                max_usages: inviteSettings.max_usages || null,
                requires_approval: inviteSettings.requires_approval,
                expires_at: inviteSettings.expires_at || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowInviteModal(true);
                    setIsEditingSettings(false);
                },
            },
        );
    };

    const handleRegenerateLink = () => {
        if (!confirm('Are you sure? This will invalidate the previous link and reset its usage count.')) return;

        router.post(
            inviteLinkRegenerate.url(),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowInviteModal(true);
                },
            },
        );
    };

    const handleToggleLink = () => {
        router.post(
            inviteLinkToggle.url(),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const tabs = [
        { id: 'invite_link' as const, label: 'Invite Link', icon: LinkIcon },
        { id: 'single' as const, label: 'Single Resident', icon: User },
        { id: 'bulk' as const, label: 'Bulk Upload', icon: FileSpreadsheet },
        { id: 'paste' as const, label: 'Paste Emails', icon: Mail },
    ];

    return (
        <>
            <Head title="Add Resident" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Add Resident</h1>
                    <p className="mt-1 text-gray-500">Invite residents to your estate. Choose the method that works best for you.</p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                    className="mb-6"
                >
                    <div className="flex rounded-xl bg-gray-100 p-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id !== 'paste') {
                                            setPasteText('');
                                        }
                                        if (tab.id !== 'bulk') {
                                            setFileName(null);
                                        }
                                        setExtractedEmails([]);
                                        setBulkError(null);
                                    }}
                                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                        isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-lg bg-white shadow-sm"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className="relative z-10 h-4 w-4" />
                                    <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Tab Contents */}
                <AnimatePresence mode="wait">
                    {/* Single Resident Form */}
                    {activeTab === 'single' && (
                        <motion.form
                            key="single"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmitSingle}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-6">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="Enter resident's full name"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="resident@example.com"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">An invitation will be sent to this email.</p>
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Phone Number <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                {/* Unit Number */}
                                <div>
                                    <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                        Unit Number <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="unit_number"
                                        value={data.unit_number}
                                        onChange={(e) => setData('unit_number', e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="e.g., A-101, Block 2 Unit 5"
                                    />
                                    {errors.unit_number && <p className="mt-1 text-sm text-red-600">{errors.unit_number}</p>}
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                        Address <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="Enter resident's address within the estate"
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {processing ? 'Sending Invitation...' : 'Send Invitation'}
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* Bulk Upload */}
                    {activeTab === 'bulk' && (
                        <motion.div
                            key="bulk"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-6">
                                {/* Upload Area */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Upload Excel or CSV File</label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Upload any Excel (.xlsx) or CSV file. We'll automatically find all email addresses in the file.
                                    </p>

                                    <div className="mt-3">
                                        <label
                                            htmlFor="file-upload"
                                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition-colors hover:border-primary-400 hover:bg-primary-50"
                                        >
                                            <Upload className="mb-3 h-10 w-10 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">
                                                {fileName ? fileName : 'Click to upload or drag and drop'}
                                            </span>
                                            <span className="mt-1 text-xs text-gray-500">.xlsx, .csv</span>
                                            <input id="file-upload" type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
                                        </label>
                                    </div>

                                    {bulkError && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{bulkError}</div>}

                                    {isProcessing && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                            Processing file...
                                        </div>
                                    )}
                                </div>

                                {/* Extracted Emails Preview */}
                                {extractedEmails.length > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    Found {extractedEmails.length} valid email{extractedEmails.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <button type="button" onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700">
                                                Clear all
                                            </button>
                                        </div>

                                        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex flex-wrap gap-2">
                                                {extractedEmails.map((email) => (
                                                    <span
                                                        key={email}
                                                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
                                                    >
                                                        {email}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEmail(email)}
                                                            className="ml-1 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleBulkSubmit}
                                    disabled={extractedEmails.length === 0}
                                    className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Send {extractedEmails.length > 0 ? `${extractedEmails.length} ` : ''}Invitation
                                    {extractedEmails.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Paste Emails */}
                    {activeTab === 'paste' && (
                        <motion.div
                            key="paste"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-6">
                                {/* Paste Area */}
                                <div>
                                    <label htmlFor="paste-emails" className="block text-sm font-medium text-gray-700">
                                        Paste Email Addresses
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Paste multiple emails separated by commas, spaces, dashes, or new lines.
                                    </p>
                                    <textarea
                                        id="paste-emails"
                                        value={pasteText}
                                        onChange={(e) => handlePasteChange(e.target.value)}
                                        rows={6}
                                        className="mt-3 block w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                                        placeholder="john@example.com, jane@example.com&#10;mike@example.com&#10;sarah@example.com - tom@example.com"
                                    />
                                </div>

                                {/* Extracted Emails Preview */}
                                {extractedEmails.length > 0 && (
                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                    Found {extractedEmails.length} valid email{extractedEmails.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <button type="button" onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700">
                                                Clear all
                                            </button>
                                        </div>

                                        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="flex flex-wrap gap-2">
                                                {extractedEmails.map((email) => (
                                                    <span
                                                        key={email}
                                                        className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200"
                                                    >
                                                        {email}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEmail(email)}
                                                            className="ml-1 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {pasteText.length > 0 && extractedEmails.length === 0 && (
                                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                                        No valid email addresses found. Please check your input.
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleBulkSubmit}
                                    disabled={extractedEmails.length === 0}
                                    className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Send {extractedEmails.length > 0 ? `${extractedEmails.length} ` : ''}Invitation
                                    {extractedEmails.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Invite Link Tab */}
                    {activeTab === 'invite_link' && (
                        <motion.div
                            key="invite_link"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                        <LinkIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Configure Invite Link</h3>
                                        <p className="text-sm text-gray-500">Set limits and approval rules for your shareable link.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    {/* Max Usages */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Maximum Usage Limit</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={inviteSettings.max_usages}
                                                onChange={(e) => setInviteSettings((prev) => ({ ...prev, max_usages: e.target.value }))}
                                                placeholder="Unlimited"
                                                className="block w-full rounded-lg border border-gray-300 py-2.5 pr-12 pl-4 text-sm transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                            />
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-xs text-gray-400">users</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">Leave empty or set to 0 for unlimited uses.</p>
                                    </div>

                                    {/* Requires Approval */}
                                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <label className="flex cursor-pointer items-start gap-3">
                                            <div className="mt-1 flex h-5 items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={inviteSettings.requires_approval}
                                                    onChange={(e) => setInviteSettings((prev) => ({ ...prev, requires_approval: e.target.checked }))}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">Require Admin Approval</span>
                                                <span className="text-xs text-gray-500">
                                                    If enabled, residents will stay 'pending' after signup until you manually approve them in the
                                                    dashboard.
                                                </span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Expiry Date */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Expiry Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                                                value={inviteSettings.expires_at}
                                                onChange={(e) => setInviteSettings((prev) => ({ ...prev, expires_at: e.target.value }))}
                                                className="block w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-4 text-sm transition-all outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">Link will automatically expire after this date (min. 1 day).</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleGenerateLink}
                                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        {inviteLink ? 'Update & Share Link' : 'Generate Invite Link'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showInviteModal && inviteLink && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInviteModal(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="bg-primary-600 p-8 text-center text-white">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                                    <CheckCircle className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold">Invite Link Ready!</h3>
                                <p className="mt-2 text-sm text-white/80">
                                    Your estate invitation link has been generated and is ready to be shared with residents.
                                </p>
                            </div>

                            <div className="p-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">Shareable URL</label>
                                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                            <input
                                                type="text"
                                                readOnly
                                                value={inviteLink.url}
                                                className="flex-1 bg-transparent font-mono text-sm text-gray-600 focus:outline-none"
                                            />
                                            <motion.button
                                                onClick={handleCopyLink}
                                                whileTap={{ scale: 0.9 }}
                                                className={`rounded-lg p-2 transition-colors ${isCopied ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                            >
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={isCopied ? 'check' : 'copy'}
                                                        initial={{ opacity: 0, scale: 0.5 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.5 }}
                                                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                                    >
                                                        {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-gray-100 p-4">
                                            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Approval</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                                {inviteLink.requires_approval ? 'Manual' : 'Automatic'}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-gray-100 p-4">
                                            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Max Usage</p>
                                            <p className="mt-1 text-sm font-semibold text-gray-700">{inviteLink.max_usages || 'Unlimited'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4">
                                        <button
                                            onClick={handleShareWhatsApp}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-bold text-white shadow-lg shadow-[#25D366]/20 transition-all hover:opacity-90"
                                        >
                                            <Share2 className="h-5 w-5" />
                                            Share on WhatsApp
                                        </button>
                                        <button
                                            onClick={() => setShowInviteModal(false)}
                                            className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                                        >
                                            Close and Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
