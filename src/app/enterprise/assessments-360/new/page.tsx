"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import { Button, Card, CardHeader, Input, Field, Badge, PageHeader, jetbrainsMono } from "@/components/ds";

interface Template {
    id: string;
    name: string;
    description: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation?: string;
}

export default function X360NewCycle() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tplError, setTplError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        template_id: "",
        ratee_ids: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tplRes, empRes] = await Promise.all([
                    apiClient.get("/api/v1/enterprise/x360/templates"),
                    apiClient.get("/api/v1/enterprise/employees/")
                ]);

                if (tplRes.ok) {
                    const data = await tplRes.json();
                    setTemplates(Array.isArray(data) ? data : []);
                } else {
                    setTplError(
                        tplRes.status === 403
                            ? tr("assess360.noPermissionTemplates")
                            : tr("assess360.loadFailedRetry")
                    );
                }
                if (empRes.ok) {
                    const data = await empRes.json();
                    setEmployees(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error(error);
                setTplError(tr("assess360.loadFailedConnection"));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post("/api/v1/enterprise/x360/cycles", formData);
            if (res.ok) {
                router.push("/enterprise/assessments-360");
            } else {
                alert(tr("assess360.failedStartCycle"));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRatee = (id: string) => {
        setFormData(prev => ({
            ...prev,
            ratee_ids: prev.ratee_ids.includes(id)
                ? prev.ratee_ids.filter(rid => rid !== id)
                : [...prev.ratee_ids, id]
        }));
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24 text-[13px] text-[#8A929E] font-medium">{tr("assess360.loadingDots")}</div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-5 md:px-7 py-6 space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title={tr("assess360.startNewCycle")}
                subtitle={tr("assess360.newCycleSubtitle")}
                onBack={() => router.push('/enterprise/assessments-360')}
                help={tr("assess360.newCycleHelp")}
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Cycle Configuration */}
                <div className="lg:col-span-5 space-y-6">
                    <Card>
                        <CardHeader title={tr("assess360.cycleConfiguration")} subtitle={tr("assess360.cycleConfigSubtitle")} />

                        <div className="space-y-4">
                            <Field label={tr("assess360.cycleName")} htmlFor="x360-cycle-name" required>
                                <Input
                                    id="x360-cycle-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder={tr("assess360.cycleNamePlaceholder")}
                                    required
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label={tr("assess360.startDate")} htmlFor="x360-start-date" required>
                                    <Input
                                        id="x360-start-date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                        required
                                    />
                                </Field>
                                <Field label={tr("assess360.endDate")} htmlFor="x360-end-date" required>
                                    <Input
                                        id="x360-end-date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                        required
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="pt-5 mt-5 border-t border-[#E8EAED]">
                            <label htmlFor="x360-template-list" className="block text-[12.5px] font-semibold text-[#374151] mb-3">{tr("assess360.selectTemplate")}</label>

                            {/* Empty / error state — templates are scoped to the current organization,
                                so a workspace with none (or a failed load) would otherwise show a blank area. */}
                            {templates.length === 0 ? (
                                <div className="rounded-[12px] border border-dashed border-[#D9DCE1] bg-[#F9FAFB] px-4 py-8 text-center">
                                    <span className="material-symbols-rounded text-[26px] text-[#9AA3AF]">description</span>
                                    <p className="mt-2 text-[13px] font-bold text-[#15171C]">
                                        {tplError ? tr("assess360.loadFailed") : tr("assess360.noTemplatesWorkspace")}
                                    </p>
                                    <p className="mt-0.5 text-[12px] text-[#8A929E] max-w-xs mx-auto">
                                        {tplError
                                            ? tplError
                                            : tr("assess360.templatesOrgHint")}
                                    </p>
                                    {!tplError && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon="add"
                                            className="mt-3.5"
                                            onClick={() => router.push("/enterprise/assessments-360/templates/new")}
                                        >
                                            {tr("assess360.createTemplate")}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                            <div id="x360-template-list" className="space-y-2.5">
                                {templates.map(tpl => {
                                    const handleSelectTemplate = () => setFormData(prev => ({
                                        ...prev,
                                        template_id: prev.template_id === tpl.id ? "" : tpl.id
                                    }));
                                    const selected = formData.template_id === tpl.id;
                                    return (
                                    <div
                                        key={tpl.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={handleSelectTemplate}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { handleSelectTemplate(); } }}
                                        className={`p-3.5 border rounded-[10px] cursor-pointer transition-all flex items-center justify-between gap-3 ${selected ? 'border-[#5B53E0] bg-[#ECEBFB]/50' : 'border-[#E1E4E8] bg-white hover:border-[#9AA3AF]'}`}
                                    >
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-[#15171C] text-[13px] truncate leading-tight mb-0.5">{tpl.name}</h4>
                                            <p className="text-[12px] text-[#8A929E] line-clamp-1">{tpl.description || tr("assess360.activeFramework")}</p>
                                        </div>
                                        {selected && (
                                            <span className="w-5 h-5 rounded-full bg-[#5B53E0] text-white flex items-center justify-center shrink-0">
                                                <span className="material-symbols-rounded text-[14px]">check</span>
                                            </span>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            icon="rocket_launch"
                            disabled={submitting || !formData.template_id || formData.ratee_ids.length === 0}
                            className="mt-6"
                        >
                            {submitting ? tr("assess360.transmitting") : tr("assess360.launchCycle")}
                        </Button>
                    </Card>
                </div>

                {/* Target Employees */}
                <div className="lg:col-span-7">
                    <Card>
                        <CardHeader
                            title={tr("assess360.selectTargetEmployees")}
                            subtitle={tr("assess360.selectTargetSubtitle")}
                            action={<Badge tone="indigo" className={jetbrainsMono.className}>{formData.ratee_ids.length} {tr("assess360.selected")}</Badge>}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1 custom-scrollbar">
                            {employees.map(emp => {
                                const selected = formData.ratee_ids.includes(emp.id);
                                return (
                                <div
                                    key={emp.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleRatee(emp.id)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { toggleRatee(emp.id); } }}
                                    className={`p-3 border rounded-[10px] cursor-pointer transition-all flex items-center gap-3 ${selected ? 'border-[#5B53E0] bg-[#ECEBFB]/50' : 'border-[#E1E4E8] bg-white hover:border-[#9AA3AF]'}`}
                                >
                                    <div className={`shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center font-extrabold text-[12px] uppercase transition-all ${selected ? 'bg-[#5B53E0] text-white' : 'bg-[#ECEBFB] text-[#5B53E0] border border-[#DAD7F6]/60'}`}>
                                        {selected ? (
                                            <span className="material-symbols-rounded text-[18px]">check</span>
                                        ) : (
                                            emp.first_name?.[0]
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-[#15171C] truncate leading-tight mb-0.5">{emp.first_name} {emp.last_name}</p>
                                        <p className="text-[12px] text-[#8A929E] truncate">{emp.designation || tr("assess360.specialist")}</p>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
}
