import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import ConfirmationModal from './ConfirmationModal';
import ResidentConfirmationModal from './ResidentConfirmationModal';

type ConfirmationType = 'danger' | 'warning' | 'info';
type ConfirmationVariant = 'admin' | 'resident';

type ConfirmationOptions = {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ConfirmationType;
    onConfirm: () => void | Promise<void>;
};

type ConfirmationContextValue = {
    confirm: (variant: ConfirmationVariant, options: ConfirmationOptions) => void;
};

type ConfirmationTrigger = {
    confirm: (options: ConfirmationOptions) => void;
};

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
    const [confirmation, setConfirmation] = useState<(ConfirmationOptions & { variant: ConfirmationVariant }) | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const close = useCallback(() => {
        if (!isLoading) {
            setConfirmation(null);
        }
    }, [isLoading]);

    const confirm = useCallback((variant: ConfirmationVariant, options: ConfirmationOptions) => {
        setConfirmation({ ...options, variant });
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!confirmation) {
            return;
        }

        setIsLoading(true);

        try {
            await confirmation.onConfirm();
            setConfirmation(null);
        } finally {
            setIsLoading(false);
        }
    }, [confirmation]);

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            <ConfirmationModal
                isOpen={confirmation?.variant === 'admin'}
                onClose={close}
                onConfirm={handleConfirm}
                title={confirmation?.title ?? 'Confirm action'}
                message={confirmation?.message ?? ''}
                confirmLabel={confirmation?.confirmLabel}
                cancelLabel={confirmation?.cancelLabel}
                type={confirmation?.type}
                isLoading={isLoading}
            />
            <ResidentConfirmationModal
                isOpen={confirmation?.variant === 'resident'}
                onClose={close}
                onConfirm={handleConfirm}
                title={confirmation?.title ?? 'Confirm action'}
                message={confirmation?.message ?? ''}
                confirmLabel={confirmation?.confirmLabel}
                cancelLabel={confirmation?.cancelLabel}
                type={confirmation?.type}
                isLoading={isLoading}
            />
        </ConfirmationContext.Provider>
    );
}

function useConfirmation(variant: ConfirmationVariant): ConfirmationTrigger {
    const context = useContext(ConfirmationContext);

    if (!context) {
        throw new Error('A confirmation hook must be used within a ConfirmationProvider.');
    }

    return {
        confirm: (options) => context.confirm(variant, options),
    };
}

export function useAdminConfirmation(): ConfirmationTrigger {
    return useConfirmation('admin');
}

export function useResidentConfirmation(): ConfirmationTrigger {
    return useConfirmation('resident');
}
