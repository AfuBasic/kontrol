/**
 * Pure state transitions for the six-box one-time-code input.
 *
 * Kept free of React so the awkward cases (autofill, paste, fast typing, deleting in the middle) are
 * unit-tested instead of discovered on a phone.
 */

export const OTP_LENGTH = 6;

export type OtpCells = string[];

export type OtpUpdate = {
    cells: OtpCells;
    /** Index of the box that should have focus next. */
    focus: number;
};

export const emptyCells = (): OtpCells => Array.from({ length: OTP_LENGTH }, () => '');

export const toCode = (cells: OtpCells): string => cells.join('');

export const isComplete = (cells: OtpCells): boolean => cells.every((cell) => /^\d$/.test(cell));

const clampIndex = (index: number): number => Math.max(0, Math.min(OTP_LENGTH - 1, index));

/**
 * Write digits into the boxes starting at `start`, ignoring anything that does not fit.
 */
function fill(cells: OtpCells, start: number, digits: string): OtpUpdate {
    const next = [...cells];

    for (let i = 0; i < digits.length && start + i < OTP_LENGTH; i++) {
        next[start + i] = digits[i];
    }

    // Land on the first empty box, or the last box once everything is filled.
    const firstEmpty = next.findIndex((cell) => cell === '');

    return { cells: next, focus: firstEmpty === -1 ? OTP_LENGTH - 1 : firstEmpty };
}

/**
 * A value arrived in one box (typing, deleting or an autofill suggestion).
 *
 * - Several digits at once (an autofill such as "From Mail: 123456") are spread across the boxes.
 * - Two characters means the person typed over a filled box: keep the new one.
 * - Nothing left means the box was cleared.
 * - Non-digits are ignored.
 */
export function applyInput(cells: OtpCells, index: number, raw: string): OtpUpdate {
    const digits = raw.replace(/\D/g, '');

    if (raw === '') {
        const next = [...cells];
        next[index] = '';

        return { cells: next, focus: index };
    }

    if (digits === '') {
        return { cells, focus: index };
    }

    if (digits.length > 2) {
        // A full code goes in from the start; a partial one fills from where it was entered.
        return fill(cells, digits.length >= OTP_LENGTH ? 0 : index, digits);
    }

    const next = [...cells];
    next[index] = digits.length === 2 ? digits[1] : digits;

    return { cells: next, focus: clampIndex(index + 1) };
}

/**
 * The person pasted text: take the digits and fill from the first box.
 */
export function applyPaste(cells: OtpCells, pasted: string): OtpUpdate {
    const digits = pasted.replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (digits === '') {
        return { cells, focus: 0 };
    }

    return fill(emptyCells(), 0, digits);
}

/**
 * Backspace pressed in an already-empty box: clear the previous one and move back, as a text field would.
 */
export function applyBackspaceOnEmpty(cells: OtpCells, index: number): OtpUpdate {
    if (index === 0) {
        return { cells, focus: 0 };
    }

    const next = [...cells];
    next[index - 1] = '';

    return { cells: next, focus: index - 1 };
}
