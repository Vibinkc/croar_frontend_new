"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface OnboardingDocument {
    id: string;
    name: string;
    status: string;
    file_path?: string;
}

interface OnboardingActivity {
    id: string;
    action: string;
    description?: string;
    performed_by: string;
    timestamp: string;
}

interface OnboardingField {
    name: string;
    label: string;
    type: string;
}

interface OnboardingSection {
    id: string;
    title: string;
    fields: OnboardingField[];
}

interface Onboarding {
    id: string;
    onboarding_code: string;
    initiation_date: string;
    status: { name: string };
    application: {
        candidate_id: string;
        candidate: {
            full_name: string;
        };
    };
    template: {
        form_config: {
            sections: OnboardingSection[];
        };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form_data: Record<string, any>;
    documents: OnboardingDocument[];
    activities: OnboardingActivity[];
}

// date-fns format() throws RangeError on an Invalid Date; guard before formatting.
const safeFormat = (value: string | null | undefined, pattern: string): string => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : format(d, pattern);
};

export default function OnboardingDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { token, canAccess } = useAuth();

    const [onboarding, setOnboarding] = useState<Onboarding | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("Employee");
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Job Information", "Personal Information"]));

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectedDocIds, setRejectedDocIds] = useState<Set<string>>(new Set());
    const [rejectedFieldNames, setRejectedFieldNames] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (token && id) {
            fetchOnboardingDetails();
        }
    }, [token, id]);

    const fetchOnboardingDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOnboarding(data);
            }
        } catch (error) {
            console.error("Error fetching onboarding details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title);
            else next.add(title);
            return next;
        });
    };

    const handleApproveHire = async () => {
        if (!window.confirm("Are you sure you want to approve this onboarding and hire the candidate?")) return;
        
        setIsProcessing(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/${id}/approve`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ notes: "Approved via dashboard" })
            });
            if (res.ok) {
                alert("Candidate has been hired successfully!");
                fetchOnboardingDetails();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to approve"}`);
            }
        } catch (error) {
            console.error("Error approving onboarding:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmResubmit = async () => {
        if (!rejectReason.trim()) {
            alert("Please provide a reason for the correction request.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/${id}/resubmit`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    reason: rejectReason,
                    rejected_document_ids: Array.from(rejectedDocIds),
                    rejected_fields: Array.from(rejectedFieldNames)
                })
            });
            if (res.ok) {
                alert("Correction request sent to candidate.");
                setIsRejectModalOpen(false);
                setRejectReason("");
                setRejectedDocIds(new Set());
                setRejectedFieldNames(new Set());
                fetchOnboardingDetails();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to request correction"}`);
            }
        } catch (error) {
            console.error("Error requesting correction:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleDocRejection = (docId: string) => {
        setRejectedDocIds(prev => {
            const next = new Set(prev);
            if (next.has(docId)) next.delete(docId);
            else next.add(docId);
            return next;
        });
    };

    const toggleFieldRejection = (fieldName: string) => {
        setRejectedFieldNames(prev => {
            const next = new Set(prev);
            if (next.has(fieldName)) next.delete(fieldName);
            else next.add(fieldName);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50/30">
                <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!onboarding) return null;

    const tabs = ["Employee", "Documents", "Activity Log"];

    // Combine template sections with potentially missing data sections
    const templateSections = onboarding.template?.form_config?.sections || [];
    
    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400 transition-all border border-transparent hover:border-slate-200"
                    >
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Onboarding</h1>
                </div>
                <div className="flex items-center gap-3">
                    {canAccess("onboarding:moderate") && onboarding.status?.name !== 'Completed' && (
                        <>
                            <button 
                                onClick={() => setIsRejectModalOpen(true)}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-black   hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                Reject / Request Correction
                            </button>
                            <button 
                                onClick={handleApproveHire}
                                disabled={isProcessing}
                                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-black   shadow-lg shadow-[#7C3AED]/20 transition-all disabled:opacity-50"
                            >
                                {isProcessing ? "Processing..." : "Approve & Hire"}
                            </button>
                        </>
                    )}
                    {canAccess("employees:create") && onboarding.status?.name === 'Completed' && (
                        <button 
                            onClick={() => router.push(`/enterprise/employees/add?candidateId=${onboarding.application?.candidate_id}`)}
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black   shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-sm">badge</span>
                            Convert to Employee
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-8 space-y-6">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200">
                                {onboarding.application?.candidate?.full_name?.[0]?.toUpperCase() || "C"}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    {onboarding.application?.candidate?.full_name} <span className="text-slate-300 font-medium ml-1.5">({onboarding.onboarding_code})</span>
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black   ${
                                        onboarding.status?.name === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                        onboarding.status?.name === 'Action Required' || onboarding.status?.name === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {onboarding.status?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-right">
                            <span className="text-[9px] font-black text-slate-400  tracking-[0.2em]">Initiated On</span>
                            <span className="text-xs font-black text-slate-700">{safeFormat(onboarding.initiation_date, "MMMM dd, yyyy")}</span>
                        </div>
                    </div>

                    {/* Horizontal Tabs */}
                    <div className="flex items-center gap-8 mt-8 border-b border-slate-100 relative z-10">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-xs font-black  tracking-[0.1em] transition-all relative ${activeTab === tab ? "text-[#7C3AED]" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <motion.div 
                                        layoutId="activeTab" 
                                        className="absolute bottom-0 h-1 bg-[#7C3AED] rounded-full w-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                    {activeTab === "Employee" && (
                        <div className="space-y-4">
                            {templateSections.length > 0 ? (
                                templateSections.map((section: OnboardingSection) => (
                                    <div key={section.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group">
                                        <button 
                                            onClick={() => toggleSection(section.title)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-all"
                                        >
                                            <h3 className="text-sm font-black text-slate-800 tracking-tight">{section.title}</h3>
                                            <span className={`material-symbols-rounded transition-transform duration-300 ${expandedSections.has(section.title) ? "rotate-180" : ""}`}>
                                                keyboard_arrow_down
                                            </span>
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {expandedSections.has(section.title) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <div className="px-8 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6 border-t border-slate-50">
                                                        {section.fields?.map((field: OnboardingField) => (
                                                            <div key={field.name} className="space-y-1 relative group/field">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-black text-slate-400  ">{field.label}</p>
                                                                    {canAccess("onboarding:moderate") && onboarding.status?.name !== 'Completed' && (
                                                                        <button 
                                                                            onClick={() => toggleFieldRejection(field.name)}
                                                                            className={`w-6 h-6 flex items-center justify-center rounded-xl transition-all opacity-0 group-hover/field:opacity-100 ${
                                                                                rejectedFieldNames.has(field.name) 
                                                                                    ? "bg-rose-500 text-white opacity-100" 
                                                                                    : "bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                                                                            }`}
                                                                            title={rejectedFieldNames.has(field.name) ? "Selected for correction" : "Request correction for this field"}
                                                                        >
                                                                            <span className="material-symbols-rounded text-xs">{rejectedFieldNames.has(field.name) ? "close" : "edit_square"}</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <p className={`text-sm font-bold break-words ${rejectedFieldNames.has(field.name) ? "text-rose-600" : "text-slate-800"}`}>
                                                                    {(() => {
                                                                        const val = onboarding.form_data?.[section.id]?.[field.name] || 
                                                                                    onboarding.form_data?.[field.name];
                                                                        
                                                                        if (!val) return <span className="text-slate-200  font-medium">Not provided</span>;
                                                                        
                                                                        if (field.type === 'file') {
                                                                            return (
                                                                                <button 
                                                                                    onClick={() => window.open(`${BACKEND_URL.replace('/api/v1', '')}/${val.replace(/\\/g, '/')}`, '_blank')}
                                                                                    className="flex items-center gap-2 text-[#7C3AED] hover:underline"
                                                                                >
                                                                                    <span className="material-symbols-rounded text-sm">attach_file</span>
                                                                                    <span className="text-xs">View Upload</span>
                                                                                </button>
                                                                            );
                                                                        }
                                                                        
                                                                        return String(val);
                                                                    })()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                                    <span className="material-symbols-rounded text-4xl text-slate-200 mb-4">description</span>
                                    <p className="text-slate-400 text-xs font-black  ">No Profile Data Available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "Documents" && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {onboarding.documents?.map((doc: OnboardingDocument) => (
                                <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center justify-between hover:border-[#7C3AED]/30 hover:shadow-xl hover:shadow-[#7C3AED]/5 transition-all group">
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.status === "Received" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                                            <span className="material-symbols-rounded">{doc.status === "Received" ? "check_circle" : "file_present"}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{doc.name}</h4>
                                            <p className={`text-[10px] font-black   ${doc.status === "Received" ? "text-emerald-500" : "text-slate-400"}`}>{doc.status}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {canAccess("onboarding:moderate") && onboarding.status?.name !== 'Completed' && doc.status === "Received" && (
                                            <button 
                                                onClick={() => toggleDocRejection(doc.id)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                                                    rejectedDocIds.has(doc.id) 
                                                        ? "bg-rose-500 border-rose-500 text-white" 
                                                        : "bg-white border-slate-200 text-rose-500 hover:bg-rose-50"
                                                }`}
                                                title={rejectedDocIds.has(doc.id) ? "Marked for rejection" : "Reject this document"}
                                            >
                                                <span className="material-symbols-rounded text-lg">
                                                    {rejectedDocIds.has(doc.id) ? "close" : "error"}
                                                </span>
                                            </button>
                                        )}
                                        {doc.status === "Received" && doc.file_path && (
                                            <button 
                                                onClick={() => window.open(`${BACKEND_URL.replace('/api/v1', '')}/${doc.file_path.replace(/\\/g, '/')}`, '_blank')}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#7C3AED]/5 text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white transition-all shadow-sm"
                                            >
                                                <span className="material-symbols-rounded text-lg">visibility</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}

                    {activeTab === "Activity Log" && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-10 shadow-sm relative overflow-hidden">
                            <div className="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                {onboarding.activities?.map((act: OnboardingActivity) => (
                                    <div key={act.id} className="relative pl-12 group/act">
                                        <div className="absolute left-0 top-1.5 w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 z-10 transition-colors group-hover/act:border-[#7C3AED] group-hover/act:text-[#7C3AED]">
                                            <span className="material-symbols-rounded text-base">history</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-800">{act.action}</h4>
                                            <p className="text-xs font-medium text-slate-400 mt-1">{act.description || `Action performed by ${act.performed_by}`}</p>
                                            <p className="text-[10px] font-black text-[#7C3AED] bg-[#7C3AED]/5 inline-block px-2 py-1 rounded-xl   mt-3">
                                                {safeFormat(act.timestamp, "MMM dd, HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject/Correction Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRejectModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Request Correction</h3>
                                    <button 
                                        onClick={() => setIsRejectModalOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400"
                                    >
                                        <span className="material-symbols-rounded">close</span>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {(rejectedDocIds.size > 0 || rejectedFieldNames.size > 0) && (
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl max-h-48 overflow-y-auto">
                                            {rejectedDocIds.size > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-[10px] font-black text-rose-600   mb-2">Documents Rejection ({rejectedDocIds.size})</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from(rejectedDocIds).map(id => {
                                                            const doc = onboarding.documents.find((d: OnboardingDocument) => d.id === id);
                                                            return (
                                                                <span key={id} className="px-3 py-1 bg-white border border-rose-200 text-rose-600 text-[10px] font-bold rounded-xl flex items-center gap-2">
                                                                    {doc?.name}
                                                                    <button onClick={() => toggleDocRejection(id)} className="material-symbols-rounded text-xs hover:text-rose-800">close</button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {rejectedFieldNames.size > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-600   mb-2">Form Fields Rejection ({rejectedFieldNames.size})</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from(rejectedFieldNames).map(name => (
                                                            <span key={name} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-600 text-[10px] font-bold rounded-xl flex items-center gap-2">
                                                                {name.replace(/_/g, ' ').toUpperCase()}
                                                                <button onClick={() => toggleFieldRejection(name)} className="material-symbols-rounded text-xs hover:text-indigo-800">close</button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-black text-slate-400   block mb-2">Feedback / Reason for Correction</label>
                                        <textarea 
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Explain what needs to be changed or why specific documents were rejected..."
                                            className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button 
                                        onClick={() => setIsRejectModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black   transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmResubmit}
                                        disabled={isProcessing || !rejectReason.trim()}
                                        className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black   shadow-lg shadow-rose-200 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? "Sending..." : "Send Request"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
