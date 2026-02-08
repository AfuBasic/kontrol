import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle, FileSpreadsheet, Mail, Upload, User, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkInvite, index, store } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import AdminLayout from '@/layouts/AdminLayout';

type TabType = 'single' | 'bulk' | 'paste';

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

export default function CreateResident() {
    const [activeTab, setActiveTab] = useState<TabType>('single');
    const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
    const [pasteText, setPasteText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

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
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBulkError(null);
        setIsProcessing(true);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const emails: string[] = [];

                // Process all sheets
                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

                    for (const row of rows) {
                        if (Array.isArray(row)) {
                            const email = extractEmailsFromRow(row);
                            if (email && !emails.includes(email)) {
                                emails.push(email);
                            }
                        }
                    }
                }

                setExtractedEmails(emails);
                setIsProcessing(false);
            } catch {
                setBulkError('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
                setIsProcessing(false);
            }
        };

        reader.onerror = () => {
            setBulkError('Failed to read file.');
            setIsProcessing(false);
        };

        reader.readAsBinaryString(file);
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

    const tabs = [
        { id: 'single' as const, label: 'Single Resident', icon: User },
        { id: 'bulk' as const, label: 'Bulk Upload', icon: FileSpreadsheet },
        { id: 'paste' as const, label: 'Paste Emails', icon: Mail },
    ];

    return (
        <AdminLayout>
            <Head title="Add Resident" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-semibold text-gray-900">Add Resident</h1>
                    <p className="mt-1 text-gray-500">Invite residents to your estate. They'll receive an email to set up their account.</p>
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

                {/* Single Resident Form */}
                {activeTab === 'single' && (
                    <motion.form
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                        onSubmit={handleSubmitSingle}
                        className="rounded-xl border border-gray-200 bg-white p-6"
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
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                        className="rounded-xl border border-gray-200 bg-white p-6"
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
                                        <span className="mt-1 text-xs text-gray-500">.xlsx, .xls, .csv</span>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                {bulkError && (
                                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{bulkError}</div>
                                )}

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
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
                        className="rounded-xl border border-gray-200 bg-white p-6"
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
            </div>
        </AdminLayout>
    );
}
