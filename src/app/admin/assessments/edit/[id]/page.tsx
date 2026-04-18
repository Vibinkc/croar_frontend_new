"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import QuestionForm from "@/components/admin/QuestionForm";
import { apiClient } from "@/utils/api";

interface Question {
    id: number;
    type: string;
    content: {
        question: string;
        options?: any;
        initial_code?: any;
        test_cases?: any[];
        scenario?: string;
        min_words?: number;
        max_words?: number;
    };
    topic: string;
    difficulty: string;
    correct_answer?: {
        answer: string;
        explanation: string;
    };
    batch?: string;
}

interface Section {
    id: string | number;
    title: string;
    description: string;
    type: string;
    time_limit: number;
    max_questions_to_attempt: number;
    selection_algorithm: string;
    question_ids: number[];
    order: number;
    questions?: any[];
}

// Helper to format ISO string to local input datetime-local format
const formatToLocalInput = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to get color theme based on question type
const getTypeColor = (type: string) => {
    switch (type) {
        case 'APTITUDE': return { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', ring: 'focus:ring-indigo-500' };
        case 'CODING': return { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', ring: 'focus:ring-green-500' };
        case 'SUBJECTIVE': return { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', ring: 'focus:ring-purple-500' };
        case 'COMMUNICATION': return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', ring: 'focus:ring-blue-500' };
        case 'PERSONALITY': return { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-700', ring: 'focus:ring-pink-500' };
        case 'BEHAVIORAL': return { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', ring: 'focus:ring-orange-500' };
        default: return { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-700', ring: 'focus:ring-gray-500' };
    }
};

export default function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        time_limit_minutes: 30,
        start_at: "",
        end_at: "",
        category: "General"
    });

    // Sections State
    const [sections, setSections] = useState<Section[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | number>('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSectionType, setNewSectionType] = useState('APTITUDE');
    const [newSectionTimeLimit, setNewSectionTimeLimit] = useState(0);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);

    // UI State for enhanced view
    const [expandedQuestionIds, setExpandedQuestionIds] = useState<number[]>([]);
    const [bankSearch, setBankSearch] = useState("");
    const [bankDifficulty, setBankDifficulty] = useState("");
    const [bankTopic, setBankTopic] = useState("");
    const [availableBankTopics, setAvailableBankTopics] = useState<string[]>([]);
    const [expandedBankItemIds, setExpandedBankItemIds] = useState<number[]>([]);

    useEffect(() => {
        if (allQuestions.length > 0) {
            const topics = Array.from(new Set(allQuestions.map(q => q.topic).filter(Boolean))).sort();
            setAvailableBankTopics(topics);
        }
    }, [allQuestions]);

    const toggleQuestionExpand = (qId: number) => {
        setExpandedQuestionIds(prev =>
            prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [qRes, aRes] = await Promise.all([
                    apiClient.get(`/api/v1/content/questions`),
                    apiClient.get(`/api/v1/assessments/${id}`)
                ]);

                if (qRes.ok) {
                    setAllQuestions(await qRes.json());
                }

                if (aRes.ok) {
                    const aData = await aRes.json();
                    setFormData({
                        title: aData.title || "",
                        description: aData.description || "",
                        time_limit_minutes: aData.time_limit_minutes || 30,
                        start_at: aData.start_at ? formatToLocalInput(aData.start_at) : "",
                        end_at: aData.end_at ? formatToLocalInput(aData.end_at) : "",
                        category: aData.category || "General"
                    });

                    // Populate Sections
                    if (aData.sections && aData.sections.length > 0) {
                        const loadedSections = aData.sections.map((s: any) => ({
                            id: s.id.toString(), // Ensure string ID for consistency with local IDs
                            title: s.title,
                            description: s.description || "",
                            type: s.type || 'APTITUDE',
                            time_limit: s.time_limit || 0,
                            max_questions_to_attempt: s.max_questions_to_attempt || 0,
                            selection_algorithm: s.selection_algorithm || 'RANDOM',
                            order: s.order,
                            question_ids: s.questions ? s.questions.map((q: any) => q.id) : []
                        }));
                        setSections(loadedSections);
                        setActiveSectionId(loadedSections[0].id);
                    } else if (aData.questions && aData.questions.length > 0) {
                        // Migration fallback: if response has flat questions but no sections (shouldn't happen with new backend, but safety net)
                        // Or if we are converting old assessment to new structure
                        const defaultSection = {
                            id: 'default-migrated',
                            title: 'General Section',
                            description: 'Imported questions',
                            type: 'APTITUDE',
                            time_limit: 0,
                            max_questions_to_attempt: 0,
                            selection_algorithm: 'RANDOM',
                            order: 0,
                            question_ids: aData.questions.map((q: any) => q.id)
                        };
                        setSections([defaultSection]);
                        setActiveSectionId('default-migrated');
                    } else {
                        // Empty state
                        const defaultSection = { id: 'default', title: 'General Section', description: '', type: 'APTITUDE', time_limit: 0, max_questions_to_attempt: 0, selection_algorithm: 'RANDOM', order: 0, question_ids: [] };
                        setSections([defaultSection]);
                        setActiveSectionId('default');
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAddSection = () => {
        const newId = `sec-${Date.now()}`;
        setSections([...sections, { id: newId, title: `New Section ${sections.length + 1}`, description: '', type: 'APTITUDE', time_limit: 0, max_questions_to_attempt: 0, selection_algorithm: 'RANDOM', order: sections.length, question_ids: [] }]);
        setActiveSectionId(newId);
    };

    const handleRemoveSection = (id: string | number) => {
        if (sections.length === 1) return alert("Cannot remove the last section");
        const newSections = sections.filter(s => s.id !== id);
        setSections(newSections);
        if (activeSectionId === id) setActiveSectionId(newSections[0].id);
    };

    const handleUpdateSection = (id: string | number, field: keyof Section, value: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleMoveSection = (index: number, direction: number) => {
        if (index + direction < 0 || index + direction >= sections.length) return;
        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[index + direction];
        newSections[index + direction] = temp;
        // Update order field if necessary
        setSections(newSections.map((s, i) => ({ ...s, order: i })));
    };

    const handleAddQuestionToSection = (qId: number) => {
        setSections(sections.map(s =>
            s.id === activeSectionId
                ? { ...s, question_ids: s.question_ids.includes(qId) ? s.question_ids : [...s.question_ids, qId] }
                : s
        ));
    };

    const handleRemoveQuestionFromSection = (secId: string | number, qId: number) => {
        setSections(sections.map(s =>
            s.id === secId
                ? { ...s, question_ids: s.question_ids.filter(id => id !== qId) }
                : s
        ));
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await apiClient.get('/api/v1/assessments/template/download');
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'assessment_bulk_import_template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download template');
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Failed to download template');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadProgress("Uploading...");
        setUploadErrors([]);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await apiClient.post(`/api/v1/assessments/${id}/bulk-import`, formData, {
                headers: {
                    // Let browser set Content-Type with boundary
                }
            });

            if (res.ok) {
                const result = await res.json();
                setUploadProgress(`✅ ${result.message}`);

                if (result.warnings && result.warnings.length > 0) {
                    setUploadErrors(result.warnings);
                }

                // Reload assessment data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                const err = await res.json();
                setUploadProgress("");
                setUploadErrors([err.detail || "Upload failed"]);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadProgress("");
            setUploadErrors(["Failed to upload file"]);
        }

        // Reset file input
        e.target.value = '';
    };

    const handleExportAssessment = async () => {
        try {
            const res = await apiClient.get(`/api/v1/assessments/${id}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${formData.title || 'assessment'}_export.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to export assessment');
            }
        } catch (error) {
            console.error('Error exporting assessment:', error);
            alert('Failed to export assessment');
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Calculate total time from sections
            const totalMinutes = sections.reduce((acc, s) => acc + (s.time_limit || 0), 0);

            // Validate sections have time limits
            if (totalMinutes === 0) {
                alert('Please add sections with time limits');
                setSaving(false);
                return;
            }

            // Validate every section has at least one question
            const emptySection = sections.find(s => (s.question_ids?.length || 0) === 0);
            if (emptySection) {
                alert(`⚠️ Section "${emptySection.title}" has 0 questions!\n\nPlease add at least one question to each section before saving.`);
                setSaving(false);
                return;
            }

            const payload = {
                title: formData.title,
                description: formData.description,
                time_limit_minutes: totalMinutes, // Use calculated total
                start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
                end_at: null, // Will be calculated from start_at + totalMinutes
                category: formData.category,
                sections: sections.map((s, idx) => ({
                    id: typeof s.id === 'number' ? s.id : undefined, // Only send ID if it's a number (existing section)
                    title: s.title,
                    description: s.description,
                    type: s.type,
                    order: idx,
                    time_limit: s.time_limit,
                    max_questions_to_attempt: s.max_questions_to_attempt,
                    selection_algorithm: s.selection_algorithm,
                    question_ids: s.question_ids
                }))
            };

            const res = await apiClient.put(`/api/v1/assessments/${id}`, payload);

            if (res.ok) {
                alert('Assessment updated successfully!');
                router.push('/admin/assessments');
                router.refresh(); // Refresh to show updated list
            } else {
                const err = await res.json();
                alert(`Failed to update assessment: ${err.detail}`);
            }
        } catch (error) {
            console.error('Error updating assessment:', error);
            alert('Failed to update assessment');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-indigo-50 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
            {/* Premium Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:scale-105 active:scale-95 group"
                    >
                        <span className="material-icons-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-amber-500  ">Protocol Architect v2.0</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight  leading-none">Calibrate Assessment</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleExportAssessment}
                        className="px-6 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-[10px] font-black  tracking-[0.1em] hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
                    >
                        <span className="material-icons-outlined text-sm font-bold">download</span>
                        Export Excel
                    </button>
                    <button
                        type="submit"
                        form="assessment-edit-form"
                        disabled={saving}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black  tracking-[0.2em] hover:bg-black shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-icons-outlined text-sm font-bold">{saving ? 'sync' : 'save'}</span>
                        {saving ? 'Synchronizing...' : 'Save Calibration'}
                    </button>
                </div>
            </div>

            <form id="assessment-edit-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white p-5 rounded-3xl shadow-xl shadow-gray-100 border border-gray-50 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Assessment Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-900 focus:ring-4 focus:ring-[var(--color-primary)]/10 focus:border-[var(--color-primary)] transition-all outline-none"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Time Limit (Min) - Auto-Calculated</label>
                            <input
                                type="number"
                                value={sections.reduce((acc, s) => acc + (s.time_limit || 0), 0)}
                                readOnly
                                disabled
                                className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed outline-none"
                            />
                            <p className="text-[9px] text-gray-400 mt-1">Sum of all section time limits</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                            <div>
                                <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Start Window</label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_at}
                                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">End Window (Auto-calculated)</label>
                                <input
                                    type="text"
                                    value={formData.start_at ? (() => {
                                        const start = new Date(formData.start_at);
                                        const totalMinutes = sections.reduce((acc, s) => acc + (s.time_limit || 0), 0);
                                        const end = new Date(start.getTime() + totalMinutes * 60000);
                                        return end.toLocaleString();
                                    })() : 'Set start time & sections'}
                                    readOnly
                                    disabled
                                    className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-500 cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTIONS MANAGEMENT */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-sm font-black text-gray-900  ">Assessment Sections</h2>
                        <button
                            type="button"
                            onClick={handleAddSection}
                            className="bg-slate-900 text-white text-[9px] font-black   px-4 py-2 rounded-xl hover:bg-slate-800 shadow-lg flex items-center gap-2"
                        >
                            <span className="material-icons-outlined text-sm">add</span> Add New Section
                        </button>
                    </div>

                    {sections.map((section, index) => (
                        <div key={section.id} className={`bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray overflow-hidden transition-all ${activeSectionId === section.id ? 'ring-2 ring-indigo-500/20' : 'opacity-80 hover:opacity-100'}`}>
                            {/* Section Header */}
                            <div
                                className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                                onClick={() => setActiveSectionId(section.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">{index + 1}</span>
                                    {activeSectionId === section.id ? (
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                                            className="bg-transparent text-sm font-bold text-gray-900 outline-none border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[200px]"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3 className="text-sm font-bold text-gray-900">{section.title}</h3>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Move Buttons */}
                                    <div className="flex bg-white rounded-lg border border-gray-100 overflow-hidden mr-2">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleMoveSection(index, -1); }}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-100 transition-colors"
                                            title="Move Up"
                                        >
                                            <span className="material-icons-outlined text-sm">arrow_upward</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleMoveSection(index, 1); }}
                                            disabled={index === sections.length - 1}
                                            className="p-1 hover:bg-gray-50 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Move Down"
                                        >
                                            <span className="material-icons-outlined text-sm">arrow_downward</span>
                                        </button>
                                    </div>

                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
                                        {section.max_questions_to_attempt > 0 && section.max_questions_to_attempt < section.question_ids.length
                                            ? `${section.max_questions_to_attempt}/${section.question_ids.length} Questions (Limited)`
                                            : `${section.question_ids.length} Questions`}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSection(section.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove Section"
                                    >
                                        <span className="material-icons-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section Content (Only visible if active) */}
                            {activeSectionId === section.id && (
                                <div className="p-5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Section Type</label>
                                            <select
                                                value={section.type}
                                                onChange={(e) => handleUpdateSection(section.id, 'type', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="APTITUDE">Aptitude</option>
                                                <option value="CODING">Coding</option>
                                                <option value="SUBJECTIVE">Subjective</option>
                                                <option value="COMMUNICATION">Communication</option>
                                                <option value="PERSONALITY">Personality</option>
                                                <option value="BEHAVIORAL">Behavioral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Time Limit (Min) *</label>
                                            <input
                                                type="number"
                                                value={section.time_limit}
                                                onChange={(e) => handleUpdateSection(section.id, 'time_limit', Number(e.target.value))}
                                                required
                                                min="1"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Description</label>
                                            <input
                                                type="text"
                                                value={section.description}
                                                onChange={(e) => handleUpdateSection(section.id, 'description', e.target.value)}
                                                placeholder="Section Instructions (Optional)"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Max Questions (0 for All)</label>
                                            <input
                                                type="number"
                                                value={section.max_questions_to_attempt}
                                                onChange={(e) => handleUpdateSection(section.id, 'max_questions_to_attempt', Number(e.target.value))}
                                                min="0"
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-gray-400  tracking-[0.2em] mb-1.5">Selection Algorithm</label>
                                            <select
                                                value={section.selection_algorithm}
                                                onChange={(e) => handleUpdateSection(section.id, 'selection_algorithm', e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            >
                                                <option value="RANDOM">Random</option>
                                                <option value="ROUND_ROBIN">Round Robin</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Questions in Section */}
                                    <div className="space-y-3 mb-4">
                                        {section.question_ids.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                                                <p className="text-[10px] font-bold text-gray-400   mb-3">No Questions in this Section</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowQuestionBank(true)}
                                                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-[10px] font-black  "
                                                >
                                                    <span className="material-icons-outlined text-sm">library_add</span> Select from Question Bank
                                                </button>
                                            </div>
                                        ) : (
                                            section.question_ids.map(qId => {
                                                const q = allQuestions.find(it => it.id === qId);
                                                if (!q) return null;
                                                const theme = getTypeColor(q.type);
                                                const isExpanded = expandedQuestionIds.includes(qId);
                                                return (
                                                    <div key={qId} className={`bg-white border rounded-xl group hover:border-gray-200 shadow-sm transition-all ${q.type !== section.type ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`}>
                                                        <div className="flex items-start gap-3 p-3 cursor-pointer" onClick={() => toggleQuestionExpand(qId)}>
                                                            <div className={`mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                                <span className="material-icons-outlined text-gray-400 text-sm">chevron_right</span>
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black  tracking-wide border h-fit ${theme.bg} ${theme.text} ${theme.border}`}>{q.type}</span>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{q.content.question}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-[9px] font-medium text-gray-400">{q.topic}</span>
                                                                    <span className="text-[9px] font-medium text-gray-300">•</span>
                                                                    <span className="text-[9px] font-medium text-gray-400">{q.difficulty}</span>
                                                                    {q.type !== section.type && (
                                                                        <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">
                                                                            <span className="material-icons-outlined text-[10px]">warning</span>
                                                                            Type Mismatch
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingQuestion(q);
                                                                        setShowQuestionForm(true);
                                                                    }}
                                                                    className="text-gray-300 hover:text-indigo-500 transition-colors mr-1"
                                                                    title="Edit Question"
                                                                >
                                                                    <span className="material-icons-outlined text-sm">edit</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleRemoveQuestionFromSection(section.id, qId); }}
                                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                                >
                                                                    <span className="material-icons-outlined text-sm">close</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="px-10 pb-4 pt-0 animate-in slide-in-from-top-1 duration-200">
                                                                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-2 border border-gray-100">
                                                                    <div className="font-medium text-gray-700">
                                                                        <span className="font-bold text-gray-900">Question:</span> {q.content.question}
                                                                    </div>

                                                                    {q.content.options && (
                                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                                            {Object.entries(q.content.options).map(([key, val]) => (
                                                                                <div key={key} className={`p-2 rounded border ${key === q.correct_answer?.answer ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white border-gray-100 text-gray-600'}`}>
                                                                                    <span className=" mr-1">{key}.</span> {val as string}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {q.content.initial_code && (
                                                                        <div className="mt-2">
                                                                            <p className="text-[10px] font-black text-gray-400   mb-1">Initial Code</p>
                                                                            <pre className="bg-slate-900 text-slate-50 p-2 rounded-lg font-mono text-[10px] overflow-x-auto">
                                                                                {typeof q.content.initial_code === 'string' ? q.content.initial_code : JSON.stringify(q.content.initial_code, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}

                                                                    {q.correct_answer?.explanation && (
                                                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-blue-800">
                                                                            <span className="font-bold">Explanation:</span> {q.correct_answer.explanation}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowQuestionBank(true)}
                                            className="flex-1 py-2.5 border-2 border-dashed border-gray-200 text-gray-400 text-[10px] font-black   rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex justify-center items-center gap-2"
                                        >
                                            <span className="material-icons-outlined text-base">list</span>
                                            Pick Existing Questions
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingQuestion(null);
                                                setShowQuestionForm(true);
                                            }}
                                            className="flex-1 py-2.5 bg-gray-900 text-white text-[10px] font-black   rounded-xl hover:bg-gray-800 transition-all flex justify-center items-center gap-2 shadow-lg"
                                        >
                                            <span className="material-icons-outlined text-base">create</span>
                                            Create New Question
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-[10px] font-black text-gray-400   hover:text-gray-600 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="button"
                        onClick={handleExportAssessment}
                        className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-900 text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-slate-100 shadow-sm transition-all active:scale-95"
                    >
                        Export Excel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black  tracking-[0.2em] rounded-xl hover:bg-black shadow-xl shadow-slate-100 transition-all active:scale-95"
                    >
                        {saving ? "Synchronizing..." : "Save Calibration"}
                    </button>
                </div>
            </form >

            {/* Question Bank Modal */}
            {
                showQuestionBank && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="text-sm font-black text-gray-900  tracking-tight">Select Questions</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Adding to: <span className="text-indigo-600">{sections.find(s => s.id === activeSectionId)?.title}</span></p>
                                </div>
                                <button onClick={() => setShowQuestionBank(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-gray-900 shadow-sm transition-colors">
                                    <span className="material-icons-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="p-4 border-b border-gray-100 flex gap-3 bg-gray-50/50">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-icons-outlined text-sm">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search questions..."
                                        value={bankSearch}
                                        onChange={(e) => setBankSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <select
                                    value={bankDifficulty}
                                    onChange={(e) => setBankDifficulty(e.target.value)}
                                    className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                                <select
                                    value={bankTopic}
                                    onChange={(e) => setBankTopic(e.target.value)}
                                    className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none cursor-pointer max-w-[150px]"
                                >
                                    <option value="">All Topics</option>
                                    {availableBankTopics.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                <div className="space-y-6">
                                    {['APTITUDE', 'CODING', 'SUBJECTIVE', 'COMMUNICATION', 'PERSONALITY', 'BEHAVIORAL'].map((cat) => {
                                        // FILTER: Only show questions matching the active section's type
                                        const activeSection = sections.find(s => s.id === activeSectionId);
                                        if (activeSection && activeSection.type !== cat) return null;

                                        let catQuestions = allQuestions.filter(q => q.type === cat);

                                        // Apply Filters
                                        if (bankDifficulty) {
                                            catQuestions = catQuestions.filter(q => q.difficulty === bankDifficulty);
                                        }
                                        if (bankTopic) {
                                            catQuestions = catQuestions.filter(q => q.topic === bankTopic);
                                        }
                                        if (bankSearch) {
                                            const lowerSearch = bankSearch.toLowerCase();
                                            catQuestions = catQuestions.filter(q =>
                                                q.content.question.toLowerCase().includes(lowerSearch) ||
                                                q.topic.toLowerCase().includes(lowerSearch)
                                            );
                                        }

                                        if (catQuestions.length === 0) return null;
                                        const theme = getTypeColor(cat);

                                        return (
                                            <div key={cat} className="space-y-2">
                                                <h4 className={`text-[9px] font-black  tracking-[0.3em] border-b pb-1 ${theme.text} opacity-50`}>{cat}</h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {catQuestions.map(q => {
                                                        const isSelectedInCurrent = sections.find(s => s.id === activeSectionId)?.question_ids.includes(q.id);
                                                        const isSelectedElsewhere = sections.some(s => s.id !== activeSectionId && s.question_ids.includes(q.id));
                                                        const isExpandedBank = expandedBankItemIds.includes(q.id);

                                                        return (
                                                            <div key={q.id} className={`rounded-xl border transition-all ${isSelectedInCurrent ? `${theme.bg} ${theme.border} ring-1 ${theme.ring}` : isSelectedElsewhere ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                                                <div
                                                                    className="p-3 cursor-pointer flex items-center gap-3"
                                                                    onClick={() => {
                                                                        if (isSelectedElsewhere) return;
                                                                        if (isSelectedInCurrent) {
                                                                            handleRemoveQuestionFromSection(activeSectionId, q.id);
                                                                        } else {
                                                                            handleAddQuestionToSection(q.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelectedInCurrent ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                                        {isSelectedInCurrent && <span className="material-icons-outlined text-white text-xs">check</span>}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className={`text-xs font-bold leading-snug ${isSelectedInCurrent ? 'text-gray-900' : 'text-gray-600'}`}>{q.content.question}</p>
                                                                    </div>
                                                                    {isSelectedElsewhere && <span className="text-[8px] font-bold text-gray-400  px-2 py-0.5 bg-gray-100 rounded">Used</span>}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setExpandedBankItemIds(prev =>
                                                                                prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                                                                            );
                                                                        }}
                                                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                                                    >
                                                                        <span className={`material-icons-outlined text-sm transition-transform ${isExpandedBank ? 'rotate-180' : ''}`}>expand_more</span>
                                                                    </button>
                                                                </div>

                                                                {isExpandedBank && (
                                                                    <div className="px-10 pb-3 pt-0 animate-in slide-in-from-top-1 duration-200">
                                                                        <div className="p-2.5 bg-gray-50/80 rounded-lg text-[10px] space-y-2 border border-gray-200/50">
                                                                            {q.content.options && (
                                                                                <div className="grid grid-cols-2 gap-2">
                                                                                    {Object.entries(q.content.options).map(([key, val]) => (
                                                                                        <div key={key} className={`p-1.5 rounded border ${key === q.correct_answer?.answer ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white border-gray-100 text-gray-600'}`}>
                                                                                            <span className=" mr-1">{key}.</span> {val as string}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {q.content.initial_code && (
                                                                                <div>
                                                                                    <p className="text-[9px] font-black text-gray-400   mb-1">Initial Code</p>
                                                                                    <pre className="bg-slate-900 text-slate-50 p-2 rounded font-mono overflow-x-auto">{typeof q.content.initial_code === 'string' ? q.content.initial_code : JSON.stringify(q.content.initial_code, null, 2)}</pre>
                                                                                </div>
                                                                            )}
                                                                            {q.correct_answer?.explanation && (
                                                                                <div className="p-2 bg-blue-50 border border-blue-100 rounded text-blue-800">
                                                                                    <span className="font-bold">Explanation:</span> {q.correct_answer.explanation}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setShowQuestionBank(false)}
                                    className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black   rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create/Edit Question Modal */}
            {
                showQuestionForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto custom-scrollbar p-1">
                            <QuestionForm
                                onSuccess={(savedQ) => {
                                    if (editingQuestion) {
                                        setAllQuestions(prev => prev.map(q => q.id === savedQ.id ? savedQ : q));
                                    } else {
                                        setAllQuestions(prev => [savedQ, ...prev]);
                                        handleAddQuestionToSection(savedQ.id); // Add to current section immediately
                                    }
                                    setShowQuestionForm(false);
                                    setEditingQuestion(null);
                                }}
                                onCancel={() => {
                                    setShowQuestionForm(false);
                                    setEditingQuestion(null);
                                }}
                                initialType={editingQuestion ? editingQuestion.type : (sections.find(s => s.id === activeSectionId)?.type || 'APTITUDE')}
                                lockType={!editingQuestion}
                                initialData={editingQuestion}
                            />
                        </div>
                    </div>
                )
            }

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                            <h2 className="text-2xl font-black text-gray-900  tracking-tight">📊 Bulk Import Questions</h2>
                            <p className="text-xs text-gray-600 mt-1">Import sections and questions from Excel file</p>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-blue-900  tracking-wide mb-3 flex items-center gap-2">
                                    <span>📋</span> Instructions
                                </h3>
                                <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                                    <li className="font-semibold">Download the Excel template below</li>
                                    <li>Fill in the <strong>Sections</strong> sheet with section details</li>
                                    <li>Fill in the <strong>Questions</strong> sheet with question details</li>
                                    <li>Make sure Section Titles match exactly between sheets</li>
                                    <li>Delete the example rows before uploading</li>
                                    <li>Upload your completed file using the upload area below</li>
                                </ol>
                            </div>

                            {/* Download Template Button */}
                            <button
                                onClick={handleDownloadTemplate}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-sm  tracking-wide transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                            >
                                <span>⬇️</span> Download Excel Template
                            </button>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-gray-300 hover:border-green-400 rounded-2xl p-10 text-center transition-colors bg-gray-50">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="bulk-upload-input"
                                />
                                <label htmlFor="bulk-upload-input" className="cursor-pointer block">
                                    <div className="text-6xl mb-3">📤</div>
                                    <p className="font-black text-gray-900 text-sm  tracking-wide mb-1">
                                        Click to Upload Excel File
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Supports .xlsx and .xls files
                                    </p>
                                </label>
                            </div>

                            {/* Progress */}
                            {uploadProgress && (
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                                    <p className="text-green-800 font-bold text-sm">{uploadProgress}</p>
                                </div>
                            )}

                            {/* Errors */}
                            {uploadErrors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                    <h4 className="text-red-900 font-black text-xs  mb-2">⚠️ Errors/Warnings:</h4>
                                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                                        {uploadErrors.map((err, idx) => (
                                            <li key={idx}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Tips */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                <h4 className="text-amber-900 font-black text-xs  mb-2">💡 Tips:</h4>
                                <ul className="text-xs text-amber-800 space-y-1">
                                    <li>• Section titles are case-sensitive</li>
                                    <li>• Valid types: APTITUDE, CODING, SUBJECTIVE, COMMUNICATION, PERSONALITY, BEHAVIORAL</li>
                                    <li>• For MCQ: Fill all 4 options (A, B, C, D) and specify correct answer</li>
                                    <li>• For Coding/Subjective: Leave options empty</li>
                                    <li>• The page will reload automatically after successful import</li>
                                </ul>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowBulkImport(false);
                                    setUploadProgress("");
                                    setUploadErrors([]);
                                }}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm  tracking-wide transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
