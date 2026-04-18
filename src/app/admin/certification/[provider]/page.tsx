"use client";

import { useAuth } from "@/context/AuthContext";
import { CERTIFICATION_DATA } from "@/data/certifications";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CertificationPage() {
    const params = useParams();
    const router = useRouter();
    const { role } = useAuth();

    // In client components, params can be accessed directly via useParams hook
    const providerId = params?.provider as string;
    const providerData = CERTIFICATION_DATA[providerId];

    if (!providerData) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                <span className="material-icons-outlined text-4xl mb-2">search_off</span>
                <p>Provider not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center p-4 border border-slate-100">
                    <img
                        src={providerData.logo}
                        alt={providerData.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://www.svgrepo.com/show/513337/verified.svg';
                        }}
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{providerData.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {providerData.certs.length} Certifications Available
                    </p>
                </div>
            </div>

            {/* Certifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {providerData.certs.map((cert, index) => (
                    <div
                        key={index}
                        className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-[var(--color-primary)] flex items-center justify-center">
                                <span className="material-icons-outlined text-xl">workspace_premium</span>
                            </div>
                            <span className="material-icons-outlined text-slate-300 group-hover:text-[var(--color-primary)] transition-colors text-lg">
                                open_in_new
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-700 text-sm leading-snug mb-2 flex-1">
                            {cert.name}
                        </h3>

                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400   bg-slate-50 px-2 py-1 rounded">
                                Certification
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
