"use client";

import Link from "next/link";

interface MegaMenuItem {
    name: string;
    description: string;
    path: string;
    icon: string;
}

interface MegaMenuCategory {
    title: string;
    items: MegaMenuItem[];
}

interface MegaMenuProps {
    categories: MegaMenuCategory[];
    isOpen: boolean;
    onClose: () => void;
}

export default function MegaMenu({ categories, isOpen, onClose }: MegaMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 shadow-2xl border-b border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                    {categories.map((category, idx) => (
                        <div key={idx} className="space-y-6">
                            <h3 className="text-[#0070f3] text-sm font-black   pb-2 border-b-2 border-[#0070f3] inline-block">
                                {category.title}
                            </h3>
                            <div className="space-y-6">
                                {category.items.map((item, itemIdx) => (
                                    <Link
                                        key={itemIdx}
                                        href={item.path}
                                        onClick={onClose}
                                        className="flex items-start gap-4 group transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                                            <span className="material-symbols-rounded text-xl">
                                                {item.icon}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                                                {item.description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
