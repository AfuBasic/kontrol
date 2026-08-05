export function formatCurrency(amount: number, currency: string = 'NGN'): string {
    const validCurrency = typeof currency === 'string' && /^[A-Za-z]{3}$/.test(currency)
        ? currency.toUpperCase()
        : 'NGN';

    try {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: validCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    }
}
