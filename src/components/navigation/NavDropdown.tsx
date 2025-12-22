import Link from "next/link";
import { NavItem, validateMenuSize } from "@/lib/navigation";
import { useEffect } from "react";

interface NavDropdownProps {
    label: string;
    labelContent?: React.ReactNode;
    name: string;
    isOpen: boolean;
    onToggle: (name: string) => void;
    onClose: () => void;
    items: NavItem[];
    isActive: (path: string) => boolean;
    align?: "left" | "right";
    className?: string;
    onItemClick?: (item: NavItem) => void;
}

export function NavDropdown({
    label,
    labelContent,
    name,
    isOpen,
    onToggle,
    onClose,
    items,
    isActive,
    align = "left",
    className = "",
    onItemClick,
}: NavDropdownProps) {

    // Developer warning for menu size
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            validateMenuSize(label, items);
        }
    }, [items, label]);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(name);
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isOpen
                    ? "text-slate-100 bg-slate-800" // Open state
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" // Default/Hover
                    }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {labelContent || (
                    <>
                        {label}
                        <span className={`text-[10px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                            ▼
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <div
                    className={`
                        absolute top-full mt-2 w-56 py-2 z-50 rounded-xl
                        bg-slate-900/95 backdrop-blur-md
                        border border-slate-700/50
                        shadow-xl shadow-slate-950/50
                        ring-1 ring-white/5
                        origin-top
                        animate-in fade-in zoom-in-95 duration-100
                        ${align === "right" ? "right-0" : "left-0"}
                    `}
                >
                    {items.map((item) => {
                        const active = isActive(item.href);

                        // Render Submenu Item
                        if (item.children) {
                            return (
                                <div key={item.label} className="group/item relative">
                                    <button
                                        className={`
                                            w-full text-left flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-150
                                            text-slate-300 hover:bg-slate-800 hover:text-white
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon && <span className="text-base min-w-[1.25rem]">{item.icon}</span>}
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.label}</span>
                                                {item.description && (
                                                    <span className="text-[10px] text-slate-500 group-hover/item:text-slate-400">
                                                        {item.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-500">▶</span>
                                    </button>

                                    {/* Submenu Drawer - Slide out to the side */}
                                    <div className="hidden group-hover/item:block absolute top-0 right-full mr-2 w-56 py-2 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-xl shadow-slate-950/50 ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-100 origin-right z-50">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.label}
                                                href={child.href}
                                                onClick={() => {
                                                    onClose();
                                                    if (onItemClick) onItemClick(child);
                                                }}
                                                className={`
                                                    group/child flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                                                    text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent hover:border-sky-500
                                                `}
                                            >
                                                {child.icon && <span className="text-base min-w-[1.25rem]">{child.icon}</span>}
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{child.label}</span>
                                                    {child.description && (
                                                        <span className="text-[10px] text-slate-500 group-hover/child:text-slate-400">
                                                            {child.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Render Standard Item
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    onClose();
                                    if (onItemClick) onItemClick(item);
                                }}
                                className={`
                                    group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150
                                    ${active
                                        ? "bg-sky-500/10 text-sky-400 border-l-2 border-sky-500"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent"
                                    }
                                `}
                            >
                                {item.icon && <span className="text-base min-w-[1.25rem]">{item.icon}</span>}
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.label}</span>
                                    {item.description && (
                                        <span className={`text-[10px] ${active ? "text-sky-500/70" : "text-slate-500 group-hover:text-slate-400"}`}>
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
