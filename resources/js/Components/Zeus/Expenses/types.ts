export type Receipt = { id: number; name: string; mime: string; size: number; is_pdf: boolean; url: string; download_url: string };

export type Category = { id: number; name: string };

export type ExpenseRow = {
    id: number;
    incurred_on: string;
    amount: number;
    payee: string;
    note: string | null;
    original_amount_note: string | null;
    archived: boolean;
    category: { id: number | null; name: string | null; archived: boolean };
    receipts: Receipt[];
};

export type Limits = { max_receipts: number; max_receipt_mb: number };

export type Summary = {
    month: string | null;
    spent: number;
    count: number;
    revenue: number | null;
    net: number | null;
    by_category: Array<{ id: number; name: string; total: number; count: number }>;
};

export type Filters = { month: string; category_id: number | null; search: string | null; archived: boolean };
