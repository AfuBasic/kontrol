import { router, usePage } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import * as ContextController from "@/actions/App/Http/Controllers/Auth/ContextController";
import clsx from "clsx";
import { Building, Shield, Home, Briefcase, ChevronDown, Check } from "lucide-react";

interface ContextData {
    id: number;
    estate_id: number;
    estate_name: string;
    role_name: string;
    scope_type: string;
    zone_id: number | null;
    zone_name: string | null;
}

interface Props {
    variant?: "light" | "dark";
    align?: "left" | "right";
}

export default function ContextSwitcher({ variant = "dark", align }: Props) {
    const { auth } = usePage().props as any;
    const currentContext = auth.user?.context as ContextData | null;
    const availableContexts = (auth.user?.available_contexts || []) as ContextData[];
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Default align to left for light variant (top-left navs), right for dark variant
    const alignment = align ?? (variant === "light" ? "left" : "right");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside as EventListener);
            document.addEventListener("touchstart", handleClickOutside as EventListener);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside as EventListener);
            document.removeEventListener("touchstart", handleClickOutside as EventListener);
        };
    }, [isOpen]);

    const { support_mode } = (usePage().props as any) || {};
    const isImpersonating = Boolean(support_mode?.active);

    if (isImpersonating || !currentContext || availableContexts.length <= 1) {
        return null;
    }

    const switchContext = (assignmentId: number) => {
        setIsOpen(false);
        router.post(
            ContextController.switchMethod.url(),
            {
                assignment_id: assignmentId,
            },
            {
                preserveState: false,
            },
        );
    };

    const getRoleIcon = (roleName: string, className = "w-4 h-4") => {
        const role = roleName.toLowerCase();
        if (role.includes("admin")) {
            return <Briefcase className={clsx(className, variant === "light" ? "text-purple-600" : "text-purple-400")} />;
        }
        if (role.includes("security")) {
            return <Shield className={clsx(className, variant === "light" ? "text-blue-600" : "text-blue-400")} />;
        }
        if (role.includes("resident") || role.includes("household")) {
            return <Home className={clsx(className, variant === "light" ? "text-emerald-600" : "text-emerald-400")} />;
        }
        return <Building className={clsx(className, variant === "light" ? "text-slate-500" : "text-gray-400")} />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "group flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all text-left",
                    variant === "dark"
                        ? "hover:bg-white/10 active:bg-white/15"
                        : "hover:bg-slate-100/80 active:bg-slate-200/70 border border-slate-200/80 bg-white/70 shadow-xs",
                )}
            >
                <div className="flex flex-col justify-center text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p
                            className={clsx(
                                "max-w-[130px] truncate text-sm leading-tight font-bold sm:max-w-[180px] md:max-w-[220px]",
                                variant === "dark" ? "text-white" : "text-slate-900",
                            )}
                        >
                            {currentContext.estate_name}
                        </p>
                        <ChevronDown
                            className={clsx(
                                "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                                isOpen && "rotate-180",
                                variant === "dark" ? "text-white/60 group-hover:text-white" : "text-slate-400 group-hover:text-slate-700",
                            )}
                        />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="shrink-0">
                            {getRoleIcon(currentContext.role_name, "w-3 h-3")}
                        </div>
                        <p
                            className={clsx(
                                "text-[11px] leading-tight font-medium capitalize truncate",
                                variant === "dark" ? "text-gray-400" : "text-slate-500",
                            )}
                        >
                            {currentContext.role_name.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>
            </button>

            {isOpen && (
                <div
                    className={clsx(
                        "absolute z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150",
                        alignment === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
                        variant === "dark"
                            ? "border-slate-800/80 bg-slate-950/95 text-slate-100 shadow-black/40"
                            : "border-slate-200/80 bg-white/95 text-slate-900 shadow-slate-900/10",
                    )}
                >
                    <div
                        className={clsx(
                            "border-b px-3.5 py-2.5",
                            variant === "dark" ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/70",
                        )}
                    >
                        <p
                            className={clsx(
                                "text-[10px] font-bold tracking-wider uppercase",
                                variant === "dark" ? "text-slate-400" : "text-slate-500",
                            )}
                        >
                            Switch Context
                        </p>
                    </div>
                    <div className="max-h-[60vh] space-y-1 overflow-y-auto p-1.5">
                        {availableContexts.map((ctx) => {
                            const isSelected = currentContext.id === ctx.id;
                            return (
                                <button
                                    key={ctx.id}
                                    type="button"
                                    onClick={() => switchContext(ctx.id)}
                                    className={clsx(
                                        "group flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-all",
                                        isSelected
                                            ? variant === "dark"
                                                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                                                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/20 font-semibold"
                                            : variant === "dark"
                                              ? "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                                              : "text-slate-700 hover:bg-slate-100/90 hover:text-slate-900",
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                        <div
                                            className={clsx(
                                                "shrink-0 rounded-lg p-2 transition-colors",
                                                isSelected
                                                    ? variant === "dark"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-emerald-100 text-emerald-700"
                                                    : variant === "dark"
                                                      ? "bg-slate-800/80 group-hover:bg-slate-700"
                                                      : "bg-slate-100 group-hover:bg-slate-200 text-slate-600",
                                            )}
                                        >
                                            {getRoleIcon(ctx.role_name, "w-4 h-4")}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold leading-tight">
                                                {ctx.estate_name}
                                            </p>
                                            <p
                                                className={clsx(
                                                    "text-xs capitalize leading-tight mt-0.5 truncate",
                                                    isSelected
                                                        ? variant === "dark"
                                                            ? "text-emerald-400/80"
                                                            : "text-emerald-600"
                                                        : variant === "dark"
                                                          ? "text-slate-400"
                                                          : "text-slate-500",
                                                )}
                                            >
                                                {ctx.role_name.replace(/_/g, " ")}
                                                {ctx.zone_name ? ` • ${ctx.zone_name}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <Check
                                            className={clsx(
                                                "h-4 w-4 shrink-0",
                                                variant === "dark" ? "text-emerald-400" : "text-emerald-600",
                                            )}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
