import { describe, expect, it } from 'vitest';
import { applyBackspaceOnEmpty, applyInput, applyPaste, emptyCells, isComplete, OTP_LENGTH, toCode } from '../otpInput';

const cellsFrom = (code: string) => emptyCells().map((_, i) => code[i] ?? '');

describe('otpInput', () => {
    it('starts with six empty boxes', () => {
        expect(emptyCells()).toHaveLength(OTP_LENGTH);
        expect(toCode(emptyCells())).toBe('');
        expect(isComplete(emptyCells())).toBe(false);
    });

    it('types one digit and moves to the next box', () => {
        const { cells, focus } = applyInput(emptyCells(), 0, '4');

        expect(cells[0]).toBe('4');
        expect(focus).toBe(1);
    });

    it('does not lose digits when they arrive faster than a render, because each step takes the latest cells', () => {
        // Simulates six inputs delivered back to back, each applied to the result of the previous one.
        let cells = emptyCells();
        let focus = 0;
        for (const digit of '046525') {
            ({ cells, focus } = applyInput(cells, focus, digit));
        }

        expect(toCode(cells)).toBe('046525');
        expect(isComplete(cells)).toBe(true);
    });

    it('ignores letters and symbols', () => {
        const start = cellsFrom('12');
        const { cells, focus } = applyInput(start, 2, 'a');

        expect(cells).toEqual(start);
        expect(focus).toBe(2);
    });

    it('keeps the newly typed digit when typing over a filled box', () => {
        const { cells, focus } = applyInput(cellsFrom('123456'), 2, '39');

        expect(cells[2]).toBe('9');
        expect(focus).toBe(3);
    });

    it('spreads a six-digit autofill across all the boxes', () => {
        const { cells } = applyInput(emptyCells(), 0, '123456');

        expect(toCode(cells)).toBe('123456');
    });

    it('spreads an autofill that lands in a later box from the first box when it is a full code', () => {
        const { cells } = applyInput(emptyCells(), 3, '654321');

        expect(toCode(cells)).toBe('654321');
    });

    it('clears only the box that was emptied and leaves the others where they are', () => {
        const { cells, focus } = applyInput(cellsFrom('123456'), 2, '');

        expect(cells).toEqual(['1', '2', '', '4', '5', '6']);
        expect(focus).toBe(2);
        expect(isComplete(cells)).toBe(false);
    });

    it('pastes a code, ignoring spaces, dashes and anything past six digits', () => {
        const { cells } = applyPaste(cellsFrom('999999'), ' 046-525 99 ');

        expect(toCode(cells)).toBe('046525');
    });

    it('puts focus on the first empty box after a partial paste', () => {
        const { cells, focus } = applyPaste(emptyCells(), '12');

        expect(toCode(cells)).toBe('12');
        expect(focus).toBe(2);
    });

    it('keeps the boxes untouched when the pasted text has no digits', () => {
        const start = cellsFrom('12');

        expect(applyPaste(start, 'abc').cells).toEqual(start);
    });

    it('backspace in an empty box clears the previous box and steps back', () => {
        const { cells, focus } = applyBackspaceOnEmpty(cellsFrom('12'), 2);

        expect(cells).toEqual(['1', '', '', '', '', '']);
        expect(focus).toBe(1);
    });

    it('backspace in the first box stays put', () => {
        const start = emptyCells();
        const { cells, focus } = applyBackspaceOnEmpty(start, 0);

        expect(cells).toEqual(start);
        expect(focus).toBe(0);
    });
});
