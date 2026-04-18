"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/utils/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import Handlebars from "handlebars";

export default function ResumeViewer() {
    const { id } = useParams();
    const [submission, setSubmission] = useState<any>(null);
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const resumeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (id) fetchSubmission();
    }, [id]);

    const fetchSubmission = async () => {
        try {
            const res = await apiClient.get(`/api/v1/resume/builder/submission/${id}`);
            if (res.ok) {
                const sub = await res.json();
                setSubmission(sub);
                const resT = await apiClient.get(`/api/v1/resume/builder/template/${sub.template_id}`);
                if (resT.ok) {
                    setTemplate(await resT.json());
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-10 text-center">Loading resume...</div>;
    if (!submission || !template) return <div className="p-10 text-center">Resume not found</div>;

    const { data } = submission;

    // Render Logic
    const renderContent = () => {
        // 1. Try HTML Template (Handlebars)
        if (template.html_template) {
            let templateStr = template.html_template;
            try {
                // Register helper if needed (e.g. format dates?)
                // Fix potential single-brace syntax from LLM (e.g. Svelte style)



                // 0. Ultra-robust normalization: Force collapse ANY sequence of 2+ braces
                // We use multiple strategies to ensure zero "triple brace" leaks.
                templateStr = templateStr
                    .replace(/\{{2,}/g, '{{')
                    .replace(/\}{2,}/g, '}}');

                // 1. Fix blocks with spaces: {{ #each ... }} -> {{#each ...}}
                // This is the specific fix for the user's reported error.
                templateStr = templateStr.replace(/\{\{\s+#([a-z1-9_]+)/gi, '{{#$1');
                templateStr = templateStr.replace(/\{\{\s+\/([a-z1-9_]+)/gi, '{{/$1');

                // 2. Fix trailing partial braces: some_text}}{{ or some_text}}{{{
                templateStr = templateStr.replace(/\}\}\{{1,3}$/g, '}}');
                templateStr = templateStr.replace(/\}\}\{\{\s*$/g, '}}');

                // 3. Fix single-brace blocks: {#each ...} -> {{#each ...}}
                templateStr = templateStr.replace(/(?<!\{)\{#([a-z1-9_]+)\s+([^}]+)\}(?!\})/gi, '{{#$1 $2}}');
                templateStr = templateStr.replace(/(?<!\{)\{\/([a-z1-9_]+)\}(?!\})/gi, '{{/$1}}');

                // 4. Fix single-brace variables: {var} -> {{var}}
                templateStr = templateStr.replace(/(?<!\{)\{([a-zA-Z0-9_\.]+)\}(?!\})/g, '{{$1}}');

                const compiled = Handlebars.compile(templateStr);
                return <div dangerouslySetInnerHTML={{ __html: compiled(data) }} className="resume-html" />;
            } catch (e) {
                console.error("Handlebars Template Error", {
                    message: (e as Error).message,
                    template: templateStr,
                });
                return (
                    <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">
                        <strong>Template Rendering Error (v6):</strong> Invalid resume template. Please fix syntax errors.
                    </div>
                );
            }
        }

        // 2. Fallback: Heuristic Rendering
        const { sections } = template.extracted_fields || { sections: [] };
        return (
            <>
                {sections.map((section: any) => {
                    const sectionData = data[section.title];
                    if (!sectionData) return null;

                    const isPersonal = section.title.includes("personal") || section.title.includes("contact");
                    const isList = section.type === 'list';

                    if (isPersonal) {
                        return (
                            <div key={section.title} className="mb-8 border-b-2 border-slate-800 pb-6 text-center">
                                <h1 className="text-4xl font-black text-slate-900 mb-2  tracking-tight">
                                    {sectionData.name || sectionData.full_name || sectionData.first_name + " " + sectionData.last_name || "Name"}
                                </h1>
                                <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 font-medium">
                                    {Object.entries(sectionData).map(([k, v]) => {
                                        if (k.includes("name") || !v) return null;
                                        return <span key={k}>{String(v)}</span>;
                                    })}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={section.title} className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900   mb-3 border-b border-slate-900 pb-1">
                                {section.label || section.title}
                            </h2>

                            {isList ? (
                                <div className="space-y-4">
                                    {(sectionData as any[]).map((item, idx) => (
                                        <div key={idx} className="mb-2">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-bold text-slate-800 text-md">
                                                    {item.title || item.role || item.position || item.degree || item.university || item.company || Object.values(item)[0]}
                                                </h3>
                                                <span className="text-sm text-slate-500 font-bold whitespace-nowrap">
                                                    {item.date || item.duration || item.year || ""}
                                                </span>
                                            </div>
                                            {(item.company || item.university) && (item.company !== item.title && item.university !== item.title) && (
                                                <p className="text-sm text-slate-600 font-semibold mb-1 ">
                                                    {item.company || item.university} {item.location ? `· ${item.location}` : ''}
                                                </p>
                                            )}
                                            <div className="text-sm text-slate-600 leading-relaxed text-justify">
                                                {item.description || item.summary || item.details ||
                                                    Object.entries(item).map(([k, v]) => {
                                                        if (['title', 'role', 'date', 'year', 'company', 'university', 'location'].includes(k)) return null;
                                                        return <div key={k}>{String(v)}</div>
                                                    })
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                                    {sectionData.description || sectionData.summary || Object.values(sectionData).join(" ")}
                                </div>
                            )}
                        </div>
                    );
                })}
            </>
        )
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 print:p-0 print:max-w-none">
            <div className="flex justify-between items-center mb-8 print:hidden">
                <Link href="/practice/resume-builder" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">← Back to Dashboard</Link>
                <div className="flex gap-4">
                    <Link
                        href={`/practice/resume-builder/${submission.template_id}?sub=${submission.id}`}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        <span className="material-icons-outlined">edit</span>
                        Edit Data
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                    >
                        <span className="material-icons-outlined">print</span>
                        Download / Print PDF
                    </button>
                </div>
            </div>

            <div ref={resumeRef} className="bg-white shadow-2xl print:shadow-none p-12 min-h-[1100px] w-full mx-auto rounded-none print:w-full text-left">
                {renderContent()}
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; }
                    nav, header, footer, aside, .no-print { display: none !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:p-0 { padding: 0 !important; }
                    .print\\:w-full { width: 100% !important; max-width: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                }
            `}</style>
        </div>
    );
}
