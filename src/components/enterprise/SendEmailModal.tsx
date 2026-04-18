import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateIds: string[];
    jobId?: string | null;
    token: string;
}

export default function SendEmailModal({ isOpen, onClose, candidateIds, jobId, token }: SendEmailModalProps) {
    const slug = "default"; // Added to fix "Cannot find name 'slug'" error
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isDrafting, setIsDrafting] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // AI Inputs
    const [aiPurpose, setAiPurpose] = useState("schedule an interview");
    const [aiTone, setAiTone] = useState("professional");

    const [senderContext, setSenderContext] = useState<any>(null);
    const [customVars, setCustomVars] = useState<string[]>([]);
    const [customVarValues, setCustomVarValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            fetchSenderContext();
        }
    }, [isOpen, jobId]);

    // Extract variables
    useEffect(() => {
        const text = subject + " " + body;
        const regex = /\{\{([^}]+)\}\}/g;
        const found = new Set<string>();
        let match;
        while ((match = regex.exec(text)) !== null) {
            const varName = match[1].trim();
            // Filter out standard ones
            if (!["candidate_name", "job_title", "company_name", "recruiter_name", "name"].includes(varName)) {
                found.add(varName);
            }
        }
        setCustomVars(Array.from(found));
    }, [subject, body]);

    const fetchSenderContext = async () => {
        try {
            const url = new URL(`${BACKEND_URL}/api/v1/enterprise/communication/context`);
            if (jobId) url.searchParams.append("job_id", jobId);

            const res = await fetch(url.toString(), {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSenderContext(data);

                // Pre-fill company name if missing in DB but user wants to override
                if (!data.company_name) {
                    setCustomVarValues(prev => ({ ...prev, "{{company_name}}": "" }));
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/templates`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleTemplateSelect = (id: string) => {
        setSelectedTemplateId(id);
        const t = templates.find(t => t.id === id);
        if (t) {
            setSubject(t.subject);
            setBody(t.body);
        } else {
            setSubject("");
            setBody("");
        }
    };

    const handleAiDraft = async () => {
        setIsDrafting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "X-Tenant-Slug": slug
                },
                body: JSON.stringify({
                    purpose: aiPurpose,
                    tone: aiTone
                })
            });
            const data = await res.json();

            // Handle different variations of response (mock vs real)
            if (data.content) {
                try {
                    const parsed = JSON.parse(data.content);
                    setSubject(parsed.subject || "");
                    setBody(parsed.body || "");
                } catch (e) {
                    // If content is just string (not JSON)
                    setBody(data.content);
                }
            } else if (data.subject || data.body) {
                setSubject(data.subject || "");
                setBody(data.body || "");
            }

        } catch (e) {
            alert("Failed to draft email");
        } finally {
            setIsDrafting(false);
        }
    };

    const handleSend = async () => {
        setIsSending(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "X-Tenant-Slug": slug
                },
                body: JSON.stringify({
                    recipient_ids: candidateIds,
                    template_id: selectedTemplateId || null,
                    job_id: jobId || null,
                    subject: subject,
                    body: body,
                    custom_variables: customVarValues
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert(result.message || "Emails sent successfully!");
                onClose();
            } else {
                alert("Failed to send emails.");
            }
        } catch (e) {
            alert("Error sending emails.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-black text-slate-800">EMAIL CAMPAIGN ({candidateIds.length})</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {/* Template Selection */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold   text-slate-500 mb-2">Load Template</label>
                        <select
                            className="w-full p-3 border border-slate-200 rounded-xl text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-100 outline-none"
                            value={selectedTemplateId}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                        >
                            <option value="" className="text-slate-900 bg-white">-- Custom Email --</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id} className="text-slate-900 bg-white">{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* AI Drafter - Only for Custom Emails */}
                    {!selectedTemplateId && (
                        <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3 items-center">
                            <div className="flex-1">
                                <input
                                    placeholder="Email purpose (e.g. Schedule and invite for technical interview)..."
                                    className="w-full p-2.5 rounded-lg border border-indigo-100 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                                    value={aiPurpose}
                                    onChange={e => setAiPurpose(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAiDraft}
                                disabled={isDrafting}
                                className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                {isDrafting ? <span className="animate-spin material-icons text-sm">refresh</span> : <span className="material-icons text-sm">auto_awesome</span>}
                                AI DRAFT
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-4">
                        <input
                            className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                            placeholder="Subject Line"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                        />
                        <textarea
                            className="w-full p-4 border border-slate-200 rounded-xl h-64 font-mono text-sm text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                            placeholder="Write your email here... (Supports HTML)"
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />

                        {/* Variable Dashboard */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <h4 className="text-xs font-bold   text-slate-500 mb-3">Detected Variables</h4>

                            <div className="space-y-3">
                                {/* Standard Variables */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <VariableStatus
                                        label="Candidate Name"
                                        code="{{candidate_name}}"
                                        status="Available"
                                        statusColor="text-green-600"
                                    />
                                    <VariableStatus
                                        label="Job Title"
                                        code="{{job_title}}"
                                        status="Auto-Detected"
                                        statusColor="text-green-600"
                                    />
                                    <VariableStatus
                                        label="Company Name"
                                        code="{{company_name}}"
                                        status={customVarValues["{{company_name}}"] ? "Overridden" : (senderContext?.company_name ? "Available" : "Missing")}
                                        statusColor={customVarValues["{{company_name}}"] ? "text-blue-600" : (senderContext?.company_name ? "text-green-600" : "text-red-500")}
                                    />
                                    <VariableStatus
                                        label="Recruiter Name"
                                        code="{{recruiter_name}}"
                                        status={customVarValues["{{recruiter_name}}"] ? "Overridden" : (senderContext?.recruiter_name ? "Available" : "Missing")}
                                        statusColor={customVarValues["{{recruiter_name}}"] ? "text-blue-600" : (senderContext?.recruiter_name ? "text-green-600" : "text-red-500")}
                                    />
                                </div>

                                {/* Custom/Missing Global Variables Input */}
                                {customVars.map(v => (
                                    <div key={v} className="flex items-center gap-3">
                                        <span className="bg-indigo-100 text-indigo-700 font-mono text-xs px-2 py-1 rounded">{`{{${v}}}`}</span>
                                        <input
                                            placeholder={`Value for ${v}...`}
                                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-300"
                                            value={customVarValues[v] || ""}
                                            onChange={e => setCustomVarValues({ ...customVarValues, [v]: e.target.value })}
                                        />
                                    </div>
                                ))}
                                {/* Show input for missing global vars if needed */}
                                {!senderContext?.company_name && (
                                    <div className="flex items-center gap-3">
                                        <span className="bg-red-50 text-red-600 font-mono text-xs px-2 py-1 rounded">{"{{company_name}}"}</span>
                                        <input
                                            placeholder="Enter Company Name override..."
                                            className="flex-1 p-2 border border-red-200 rounded-lg text-sm outline-none focus:border-red-300"
                                            value={customVarValues["{{company_name}}"] || ""}
                                            onChange={e => setCustomVarValues({ ...customVarValues, "{{company_name}}": e.target.value })}
                                        />
                                    </div>
                                )}
                                {!senderContext?.recruiter_name && (
                                    <div className="flex items-center gap-3">
                                        <span className="bg-red-50 text-red-600 font-mono text-xs px-2 py-1 rounded">{"{{recruiter_name}}"}</span>
                                        <input
                                            placeholder="Enter Recruiter Name override..."
                                            className="flex-1 p-2 border border-red-200 rounded-lg text-sm outline-none focus:border-red-300"
                                            value={customVarValues["{{recruiter_name}}"] || ""}
                                            onChange={e => setCustomVarValues({ ...customVarValues, "{{recruiter_name}}": e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">CANCEL</button>
                    <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                SENDING...
                            </>
                        ) : (
                            <>
                                <span className="material-icons text-sm">send</span>
                                SEND EMAIL
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div >
    );
}

function VariableStatus({ label, code, status, statusColor }: { label: string, code: string, status: string, statusColor: string }) {
    return (
        <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-100">
            <div className="flex flex-col">
                <span className="font-bold text-slate-700">{label}</span>
                <span className="font-mono text-[10px] text-slate-400">{code}</span>
            </div>
            <span className={`font-bold ${statusColor}`}>{status}</span>
        </div>
    );
}
