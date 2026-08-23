import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileSpreadsheet, Link as LinkIcon, Mail, Upload, User, X, ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { bulkInvite, index, store } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import {
    store as inviteLinkStore,
    regenerate as inviteLinkRegenerate,
    toggle as inviteLinkToggle,
    destroy as inviteLinkDestroy,
} from '@/actions/App/Http/Controllers/Admin/PropertyOwnerInviteLinkController';
import AdminLayout from '@/Layouts/AdminLayout';
import type { InviteLink } from '../Components/InviteLinksTab';
import InviteLinksTab from '../Components/InviteLinksTab';

type TabType = 'single' | 'bulk' | 'paste' | 'invite_link';

interface Props {
    inviteLinks?: InviteLink[];
    zones?: { id: number; name: string }[];
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function extractEmailsFromText(text: string): string[] {
    // Split by common delimiters: comma, space, newline, semicolon
    const parts = text.split(/[,\s;\n]+/);
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

export default function CreatePropertyOwner({ inviteLinks = [], zones = [] }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('invite_link');
    const [extractedEmails, setExtractedEmails] = useState<string[]>([]);
    const [pasteText, setPasteText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [selectedZone, setSelectedZone] = useState<string>('');

    const { auth } = usePage<any>().props;

    // Single form
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        unit_number: '',
        address: '',
        zone_id: '',
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
            { emails: extractedEmails, zone_id: selectedZone || null },
            {
                onSuccess: () => {
                    setExtractedEmails([]);
                    setPasteText('');
                    setFileName(null);
                    setSelectedZone('');
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

    // End of bulk processing functions

    const tabs = [
        { id: 'invite_link' as const, label: 'Invite Link', icon: LinkIcon },
        { id: 'single' as const, label: 'Single Owner', icon: User },
        { id: 'bulk' as const, label: 'Bulk Upload', icon: FileSpreadsheet },
        { id: 'paste' as const, label: 'Paste Emails', icon: Mail },
    ];

    return (
        <>
            <Head title="Invite Property Owner" />

            <div className="mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="mb-8"
                >
                    <Link
                        href={index.url()}
                        className="group mb-2 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-[#1F6FDB]"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Property Owners
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">Invite Property Owner</h1>
                    <p className="mt-1 text-gray-500">
                        Invite a landlord or property manager to delegate resident administration. Choose the method that works best.
                    </p>
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
                    {/* Single Property Owner Form */}
                    {activeTab === 'single' && (
                        <motion.form
                            key="single"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmitSingle}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                            noValidate
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
                                        className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Enter property owner's full name"
                                        required
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
                                        className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="owner@example.com"
                                        required
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
                                        className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                </div>

                                {/* Unit Number */}
                                <div>
                                    <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700">
                                        Primary Unit Number <span className="text-gray-400">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="unit_number"
                                        value={data.unit_number}
                                        onChange={(e) => setData('unit_number', e.target.value)}
                                        className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g., Block C, Villa 12"
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
                                        className="mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Enter address details"
                                    />
                                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                                </div>

                                {/* Zone Assignment Selection */}
                                {zones.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Property Location & Scope</label>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Determine whether this owner's property is part of a specific zone.
                                        </p>

                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${data.zone_id === '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="scope_mode"
                                                    checked={data.zone_id === ''}
                                                    onChange={() => setData('zone_id', '')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Entire Estate</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Property is not restricted to a specific zone.
                                                    </span>
                                                </div>
                                            </label>

                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${data.zone_id !== '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="scope_mode"
                                                    checked={data.zone_id !== ''}
                                                    onChange={() => setData('zone_id', zones[0]?.id.toString() || '')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Specific Zone</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Property belongs to a specific phase or block.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Zone Selector Dropdown when Specific Zone is selected */}
                                        {data.zone_id !== '' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                                            >
                                                <label htmlFor="zone_id" className="block text-xs font-semibold text-gray-700">
                                                    Select Zone
                                                </label>
                                                <select
                                                    id="zone_id"
                                                    value={data.zone_id}
                                                    onChange={(e) => setData('zone_id', e.target.value)}
                                                    className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-[#1F6FDB] focus:ring-1 focus:ring-[#1F6FDB] focus:outline-none"
                                                >
                                                    {zones.map((zone) => (
                                                        <option key={zone.id} value={zone.id}>
                                                            {zone.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.zone_id && <p className="mt-1 text-xs text-red-600">{errors.zone_id}</p>}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-xl bg-[#1F6FDB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
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
                                            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 transition-colors hover:border-blue-400 hover:bg-blue-50"
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
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1F6FDB] border-t-transparent" />
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

                                {/* Zone Assignment for Bulk */}
                                {zones.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700">Property Location & Scope</label>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Determine whether these owners' properties are part of a specific zone.
                                        </p>

                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${selectedZone === '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="bulk_scope_mode"
                                                    checked={selectedZone === ''}
                                                    onChange={() => setSelectedZone('')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Entire Estate</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Properties are not restricted to a specific zone.
                                                    </span>
                                                </div>
                                            </label>

                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${selectedZone !== '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="bulk_scope_mode"
                                                    checked={selectedZone !== ''}
                                                    onChange={() => setSelectedZone(zones[0]?.id.toString() || '')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Specific Zone</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Properties belong to a specific phase or block.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Zone Selector Dropdown when Specific Zone is selected */}
                                        {selectedZone !== '' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                                            >
                                                <label htmlFor="bulk_zone_id" className="block text-xs font-semibold text-gray-700">
                                                    Select Zone
                                                </label>
                                                <select
                                                    id="bulk_zone_id"
                                                    value={selectedZone}
                                                    onChange={(e) => setSelectedZone(e.target.value)}
                                                    className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-[#1F6FDB] focus:ring-1 focus:ring-[#1F6FDB] focus:outline-none"
                                                >
                                                    {zones.map((zone) => (
                                                        <option key={zone.id} value={zone.id}>
                                                            {zone.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleBulkSubmit}
                                    disabled={extractedEmails.length === 0}
                                    className="rounded-xl bg-[#1F6FDB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                                        className="mt-3 block w-full rounded-xl border border-gray-300 px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="owner1@example.com, owner2@example.com&#10;owner3@example.com"
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

                                {/* Zone Assignment for Paste */}
                                {zones.length > 0 && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700">Property Location & Scope</label>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Determine whether these owners' properties are part of a specific zone.
                                        </p>

                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${selectedZone === '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paste_scope_mode"
                                                    checked={selectedZone === ''}
                                                    onChange={() => setSelectedZone('')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Entire Estate</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Properties are not restricted to a specific zone.
                                                    </span>
                                                </div>
                                            </label>

                                            <label
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${selectedZone !== '' ? 'border-[#1F6FDB] bg-blue-50/20 ring-1 ring-[#1F6FDB]' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paste_scope_mode"
                                                    checked={selectedZone !== ''}
                                                    onChange={() => setSelectedZone(zones[0]?.id.toString() || '')}
                                                    className="mt-0.5 text-[#1F6FDB] focus:ring-[#1F6FDB]"
                                                />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-900">Specific Zone</span>
                                                    <span className="mt-0.5 block text-[11px] text-gray-500">
                                                        Properties belong to a specific phase or block.
                                                    </span>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Zone Selector Dropdown when Specific Zone is selected */}
                                        {selectedZone !== '' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                                            >
                                                <label htmlFor="paste_zone_id" className="block text-xs font-semibold text-gray-700">
                                                    Select Zone
                                                </label>
                                                <select
                                                    id="paste_zone_id"
                                                    value={selectedZone}
                                                    onChange={(e) => setSelectedZone(e.target.value)}
                                                    className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-[#1F6FDB] focus:ring-1 focus:ring-[#1F6FDB] focus:outline-none"
                                                >
                                                    {zones.map((zone) => (
                                                        <option key={zone.id} value={zone.id}>
                                                            {zone.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                <Link
                                    href={index.url()}
                                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleBulkSubmit}
                                    disabled={extractedEmails.length === 0}
                                    className="rounded-xl bg-[#1F6FDB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <InviteLinksTab
                                inviteLinks={inviteLinks}
                                zones={zones}
                                urls={{
                                    store: inviteLinkStore.url(),
                                    toggle: inviteLinkToggle.url(),
                                    regenerate: inviteLinkRegenerate.url(),
                                    destroy: inviteLinkDestroy.url(),
                                }}
                                estateName={auth?.user?.estate_name || 'your estate'}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}

CreatePropertyOwner.layout = (page: any) => <AdminLayout title="Add Property Owner" children={page} />;
