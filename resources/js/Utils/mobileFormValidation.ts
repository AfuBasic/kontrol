type ValidatableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type FieldValidationError = {
    field: ValidatableField;
    message: string;
};

const INVALID_ATTRIBUTE = 'data-kontrol-invalid';
const ERROR_ATTRIBUTE = 'data-kontrol-validation-error';
const ERROR_ID_SUFFIX = 'kontrol-validation-error';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let teardownMobileFormValidation: (() => void) | null = null;

export function initMobileFormValidation(): () => void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return () => {};
    }

    if (teardownMobileFormValidation) {
        return teardownMobileFormValidation;
    }

    const markForms = (root: ParentNode = document) => {
        root.querySelectorAll('form').forEach(markForm);
    };

    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof HTMLFormElement) {
                    markForm(node);
                }

                if (node instanceof Element) {
                    markForms(node);
                }
            });
        });
    });

    markForms();
    mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

    const handleNativeInvalid = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleSubmit = (event: SubmitEvent) => {
        if (!(event.target instanceof HTMLFormElement)) {
            return;
        }

        const form = event.target;

        markForm(form);
        clearFormErrors(form);

        const errors = collectFormErrors(form);

        if (errors.length === 0) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        errors.forEach(renderFieldError);
        focusField(errors[0].field);
    };

    const handleFieldChange = (event: Event) => {
        if (isValidatableField(event.target)) {
            clearFieldError(event.target);
        }
    };

    document.addEventListener('invalid', handleNativeInvalid, true);
    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('input', handleFieldChange, true);
    document.addEventListener('change', handleFieldChange, true);

    teardownMobileFormValidation = () => {
        mutationObserver.disconnect();
        document.removeEventListener('invalid', handleNativeInvalid, true);
        document.removeEventListener('submit', handleSubmit, true);
        document.removeEventListener('input', handleFieldChange, true);
        document.removeEventListener('change', handleFieldChange, true);
        teardownMobileFormValidation = null;
    };

    return teardownMobileFormValidation;
}

function markForm(form: HTMLFormElement): void {
    form.noValidate = true;
    form.setAttribute('novalidate', '');
    form.setAttribute('data-kontrol-client-validation', 'true');
}

function collectFormErrors(form: HTMLFormElement): FieldValidationError[] {
    const errors: FieldValidationError[] = [];
    const visitedRadioGroups = new Set<string>();

    Array.from(form.elements).forEach((element) => {
        if (!isValidatableField(element) || !shouldValidateField(element, form)) {
            return;
        }

        if (element instanceof HTMLInputElement && element.type === 'radio') {
            const key = element.name || element.id;

            if (visitedRadioGroups.has(key)) {
                return;
            }

            visitedRadioGroups.add(key);
        }

        const message = validateField(element, form);

        if (message) {
            errors.push({ field: element, message });
        }
    });

    return errors;
}

function validateField(field: ValidatableField, form: HTMLFormElement): string | null {
    const label = getFieldLabel(field);
    const value = getFieldValue(field);

    if (field.hasAttribute('required') && isEmptyRequiredField(field, form)) {
        return `${label} is required.`;
    }

    if (value === '') {
        return null;
    }

    if (field instanceof HTMLInputElement && field.type === 'email' && !isValidEmailValue(field, value)) {
        return 'Enter a valid email address.';
    }

    if (field instanceof HTMLInputElement && field.type === 'url' && !isValidUrl(value)) {
        return 'Enter a valid URL.';
    }

    if (field instanceof HTMLInputElement && field.pattern && !matchesPattern(value, field.pattern)) {
        return field.title || `Use the requested format for ${label}.`;
    }

    const minLength = readNumberAttribute(field, 'minlength');
    const maxLength = readNumberAttribute(field, 'maxlength');

    if (minLength !== null && value.length < minLength) {
        return `${label} must be at least ${minLength} characters.`;
    }

    if (maxLength !== null && value.length > maxLength) {
        return `${label} must be ${maxLength} characters or fewer.`;
    }

    if (field instanceof HTMLInputElement && (field.type === 'number' || field.type === 'range')) {
        const numericValue = Number(value);

        if (Number.isNaN(numericValue)) {
            return `${label} must be a number.`;
        }

        const min = readNumberAttribute(field, 'min');
        const max = readNumberAttribute(field, 'max');

        if (min !== null && numericValue < min) {
            return `${label} must be at least ${min}.`;
        }

        if (max !== null && numericValue > max) {
            return `${label} must be ${max} or less.`;
        }
    }

    return null;
}

function isValidatableField(value: unknown): value is ValidatableField {
    return value instanceof HTMLInputElement || value instanceof HTMLSelectElement || value instanceof HTMLTextAreaElement;
}

function shouldValidateField(field: ValidatableField, form: HTMLFormElement): boolean {
    if (field.disabled || field.hasAttribute('data-kontrol-skip-validation')) {
        return false;
    }

    if (field instanceof HTMLInputElement && ['button', 'hidden', 'image', 'reset', 'submit'].includes(field.type)) {
        return false;
    }

    if (field.closest('[data-kontrol-skip-validation], [hidden], [aria-hidden="true"]')) {
        return false;
    }

    let current: HTMLElement | null = field;

    while (current && current !== form) {
        const style = window.getComputedStyle(current);

        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }

        current = current.parentElement;
    }

    return true;
}

function isEmptyRequiredField(field: ValidatableField, form: HTMLFormElement): boolean {
    if (field instanceof HTMLInputElement) {
        if (field.type === 'checkbox') {
            return !field.checked;
        }

        if (field.type === 'radio') {
            return !getRadioGroup(form, field).some((radio) => radio.checked);
        }

        if (field.type === 'file') {
            return !field.files || field.files.length === 0;
        }
    }

    if (field instanceof HTMLSelectElement && field.multiple) {
        return field.selectedOptions.length === 0;
    }

    return getFieldValue(field) === '';
}

function getFieldValue(field: ValidatableField): string {
    return field.value.trim();
}

function isValidEmailValue(field: HTMLInputElement, value: string): boolean {
    const values = field.multiple ? value.split(',').map((entry) => entry.trim()) : [value];

    return values.every((entry) => EMAIL_PATTERN.test(entry));
}

function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value);

        return Boolean(url.protocol && url.host);
    } catch (_error) {
        return false;
    }
}

function matchesPattern(value: string, pattern: string): boolean {
    try {
        return new RegExp(`^(?:${pattern})$`).test(value);
    } catch (_error) {
        return true;
    }
}

function readNumberAttribute(field: ValidatableField, attribute: string): number | null {
    const value = field.getAttribute(attribute);

    if (value === null || value === '') {
        return null;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
}

function getRadioGroup(form: HTMLFormElement, field: HTMLInputElement): HTMLInputElement[] {
    return Array.from(form.elements).filter(
        (element): element is HTMLInputElement =>
            element instanceof HTMLInputElement && element.type === 'radio' && element.name === field.name && shouldValidateField(element, form),
    );
}

function renderFieldError({ field, message }: FieldValidationError): void {
    clearFieldError(field);

    const fieldId = ensureFieldId(field);
    const errorId = `${fieldId}-${ERROR_ID_SUFFIX}`;
    const error = document.createElement('p');

    error.id = errorId;
    error.textContent = message;
    error.className = 'kontrol-form-validation-error';
    error.setAttribute(ERROR_ATTRIBUTE, 'true');

    getErrorAnchor(field).insertAdjacentElement('afterend', error);

    field.setAttribute(INVALID_ATTRIBUTE, 'true');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', appendDescribedBy(field.getAttribute('aria-describedby'), errorId));
}

function clearFormErrors(form: HTMLFormElement): void {
    form.querySelectorAll(`[${ERROR_ATTRIBUTE}]`).forEach((element) => element.remove());
    Array.from(form.elements).forEach((element) => {
        if (isValidatableField(element)) {
            clearFieldState(element);
        }
    });
}

function clearFieldError(field: ValidatableField): void {
    const fieldId = field.id;

    if (fieldId) {
        document.getElementById(`${fieldId}-${ERROR_ID_SUFFIX}`)?.remove();
    }

    const nextError = getErrorAnchor(field).nextElementSibling;

    if (nextError?.hasAttribute(ERROR_ATTRIBUTE)) {
        nextError.remove();
    }

    clearFieldState(field);
}

function clearFieldState(field: ValidatableField): void {
    field.removeAttribute(INVALID_ATTRIBUTE);
    field.removeAttribute('aria-invalid');

    const fieldId = field.id;

    if (!fieldId) {
        return;
    }

    const errorId = `${fieldId}-${ERROR_ID_SUFFIX}`;
    const describedBy = field
        .getAttribute('aria-describedby')
        ?.split(/\s+/)
        .filter((id) => id && id !== errorId)
        .join(' ');

    if (describedBy) {
        field.setAttribute('aria-describedby', describedBy);
    } else {
        field.removeAttribute('aria-describedby');
    }
}

function ensureFieldId(field: ValidatableField): string {
    if (field.id) {
        return field.id;
    }

    const name = field.name || field.getAttribute('aria-label') || 'field';
    field.id = `kontrol-${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;

    return field.id;
}

function getErrorAnchor(field: ValidatableField): Element {
    const parent = field.parentElement;

    if (parent && parent !== field.form && (parent.classList.contains('relative') || parent.classList.contains('group'))) {
        return parent;
    }

    return field;
}

function focusField(field: ValidatableField): void {
    field.scrollIntoView({ block: 'center', behavior: 'smooth' });

    window.setTimeout(() => {
        field.focus({ preventScroll: true });
    }, 180);
}

function appendDescribedBy(existing: string | null, errorId: string): string {
    const ids = new Set((existing || '').split(/\s+/).filter(Boolean));
    ids.add(errorId);

    return Array.from(ids).join(' ');
}

function getFieldLabel(field: ValidatableField): string {
    const ariaLabel = field.getAttribute('aria-label');

    if (ariaLabel) {
        return cleanLabel(ariaLabel);
    }

    if (field.id) {
        const explicitLabel = document.querySelector(`label[for="${escapeSelector(field.id)}"]`);

        if (explicitLabel?.textContent) {
            return cleanLabel(explicitLabel.textContent);
        }
    }

    const wrappedLabel = field.closest('label');

    if (wrappedLabel?.textContent) {
        return cleanLabel(wrappedLabel.textContent);
    }

    const nearbyLabel = findNearbyLabel(field);

    if (nearbyLabel?.textContent) {
        return cleanLabel(nearbyLabel.textContent);
    }

    const placeholder = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field.placeholder : '';

    return cleanLabel(placeholder || field.name || 'This field');
}

function findNearbyLabel(field: ValidatableField): HTMLLabelElement | null {
    let current = field.parentElement;

    for (let depth = 0; current && current !== field.form && depth < 3; depth += 1) {
        const labels = Array.from(current.querySelectorAll('label'));
        const matchingLabel = labels.find((label) => label.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING);

        if (matchingLabel) {
            return matchingLabel;
        }

        current = current.parentElement;
    }

    return null;
}

function cleanLabel(label: string): string {
    const clean = label
        .replace(/\*/g, '')
        .replace(/\s*\(optional\)\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    return clean || 'This field';
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function escapeSelector(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
    }

    return value.replace(/["\\]/g, '\\$&');
}
