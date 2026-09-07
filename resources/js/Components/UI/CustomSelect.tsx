import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { Fragment } from 'react';

export interface CustomSelectOption<T extends string | number = string | number> {
    value: T;
    label: string;
    description?: string;
}

interface CustomSelectProps<T extends string | number = string | number> {
    value: T;
    onChange: (value: T) => void;
    options: CustomSelectOption<T>[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    buttonClassName?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function CustomSelect<T extends string | number = string | number>({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select an option',
    disabled = false,
    className = '',
    buttonClassName = '',
    size = 'md',
}: CustomSelectProps<T>) {
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const sizeClasses = {
        sm: 'py-2 px-3 text-xs rounded-xl min-h-[36px]',
        md: 'py-2.5 px-3.5 text-xs font-semibold rounded-xl min-h-[42px]',
        lg: 'py-3.5 px-4 text-sm font-semibold rounded-2xl min-h-[48px]',
    }[size];

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange} disabled={disabled}>
                <div className="relative">
                    <ListboxButton
                        className={`flex w-full items-center justify-between gap-2 border border-slate-200 bg-white text-left text-slate-800 shadow-2xs transition-all hover:border-slate-300 focus:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses} ${buttonClassName}`}
                    >
                        <span className={`block truncate ${!selectedOption ? 'text-slate-400 font-normal' : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform ui-open:rotate-180" aria-hidden="true" />
                    </ListboxButton>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <ListboxOptions className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 text-xs shadow-xl ring-1 ring-black/5 focus:outline-hidden">
                            {options.map((option) => (
                                <ListboxOption
                                    key={String(option.value)}
                                    value={option.value}
                                    className={({ active, selected }) =>
                                        `relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 select-none transition-colors ${
                                            active
                                                ? 'bg-slate-50 text-slate-900'
                                                : 'text-slate-700'
                                        } ${selected ? 'font-bold text-slate-900' : 'font-medium'}`
                                    }
                                >
                                    {({ selected }) => (
                                        <>
                                            <div className="flex flex-col">
                                                <span className="truncate">{option.label}</span>
                                                {option.description && (
                                                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                            {selected && (
                                                <Check className="h-3.5 w-3.5 shrink-0 text-slate-900 ml-2" aria-hidden="true" />
                                            )}
                                        </>
                                    )}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </Transition>
                </div>
            </Listbox>
        </div>
    );
}
