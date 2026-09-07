"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { apiClient } from "@/utils/api";
import {
    Check,
    CheckCircle2,
    Globe,
    Rocket,
    Users,
    UserCheck,
} from "lucide-react";
import { Button, Card, CardHeader, Input, Field, Badge, PageHeader, jetbrainsMono } from "@/components/ds";

interface Template {
    id: string;
    title: string;
    description: string;
    survey_type: { name: string };
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    designation: string;
}

export default function LaunchSurvey() {
    const { token } = useAuth();
    const { t: tr } = useI18n();
    const router = useRouter();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        template_id: "",
        name: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        target_group: "ALL" as "ALL" | "CUSTOM",
        employee_ids: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tplRes, empRes] = await Promise.all([
                    apiClient.get('/api/v1/enterprise/surveys/templates'),
                    apiClient.get('/api/v1/enterprise/employees/')
                ]);
                if (tplRes.ok) setTemplates(await tplRes.json());
                if (empRes.ok) setEmployees(await empRes.json());
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleEmployee = (id: string) => {
        setFormData(prev => {
            const ids = prev.employee_ids.includes(id)
                ? prev.employee_ids.filter(e => e !== id)
                : [...prev.employee_ids, id];
            return { ...prev, employee_ids: ids };
        });
    };

    const handleLaunch = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiClient.post('/api/v1/enterprise/surveys/launch', formData);
            if (res.ok) {
                alert(tr("surveysExt.launchSuccess"));
                router.push('/enterprise/surveys');
            } else {
                const error = await res.json();
                alert(tr("surveysExt.launchFailed", { error: error.message || tr("surveysExt.unknownError") }));
            }
        } catch (error) {
            console.error(error);
            alert(tr("surveysExt.launchError"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="px-4 sm:px-5 md:px-7 py-16 text-center">
            <div className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#757575]">
                <span className="w-4 h-4 rounded-full border-2 border-[#E0E0E0] border-t-[#1976D2] animate-spin" />
                {tr("surveysExt.syncingPersonnel")}
            </div>
        </div>
    );

    return (
        <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full space-y-6 animate-in fade-in duration-500">
            {/* Page header */}
            <PageHeader
                title={tr("surveysExt.launchCampaignTitle")}
                subtitle={tr("surveysExt.launchCampaignSubtitle")}
                onBack={() => router.push('/enterprise/surveys')}
                help={tr("surveysExt.launchCampaignHelp")}
            />

            <form onSubmit={handleLaunch} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left column: campaign details */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <Card padding="lg" className="space-y-6">
                        <CardHeader title={tr("surveysExt.campaignDetailsTitle")} subtitle={tr("surveysExt.campaignDetailsSubtitle")} />

                        <Field label={tr("surveysExt.campaignName")} htmlFor="survey-campaign-name" required>
                            <Input
                                id="survey-campaign-name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder={tr("surveysExt.campaignNamePlaceholder")}
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label={tr("surveysExt.startDate")} htmlFor="survey-start-date" required>
                                <Input
                                    id="survey-start-date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                    required
                                />
                            </Field>
                            <Field label={tr("surveysExt.endDate")} htmlFor="survey-end-date" required>
                                <Input
                                    id="survey-end-date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                    required
                                />
                            </Field>
                        </div>

                        <div>
                            <label htmlFor="survey-framework-list" className="block text-[12.5px] font-semibold text-[#424242] mb-2">{tr("surveysExt.selectedFramework")}</label>
                            <div id="survey-framework-list" className="space-y-2">
                                {templates.map(tpl => {
                                    const active = formData.template_id === tpl.id;
                                    return (
                                        <div
                                            key={tpl.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setFormData({...formData, template_id: tpl.id})}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setFormData({...formData, template_id: tpl.id});
                                                }
                                            }}
                                            className={`p-3.5 border rounded-[4px] cursor-pointer transition-colors flex items-center justify-between gap-3 ${active ? 'border-[#1976D2] bg-[#F5F4FE]' : 'border-[#E0E0E0] bg-white hover:border-[#E0E0E0]'}`}
                                        >
                                            <div className="min-w-0">
                                                <Badge tone="indigo" className="mb-1.5">{tpl.survey_type.name}</Badge>
                                                <h4 className="font-bold text-[#212121] text-[13.5px] truncate leading-tight">{tpl.title}</h4>
                                            </div>
                                            {active && <CheckCircle2 className="w-5 h-5 text-[#1976D2] shrink-0" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            disabled={submitting || !formData.template_id || (formData.target_group === 'CUSTOM' && formData.employee_ids.length === 0)}
                        >
                            <Rocket className="w-4 h-4" />
                            {submitting ? tr("surveysExt.launching") : tr("surveysExt.deploySurvey")}
                        </Button>
                    </Card>
                </div>

                {/* Right column: audience configuration */}
                <Card padding="lg" className="lg:col-span-7 xl:col-span-8 h-full flex flex-col relative overflow-hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E0E0E0] pb-5 mb-5">
                        <div>
                            <h3 className="text-[15px] font-bold text-[#212121]">{tr("surveysExt.configureAudience")}</h3>
                            <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("surveysExt.configureAudienceDesc")}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, target_group: 'ALL'})}
                                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[4px] text-[12.5px] font-semibold transition-colors ${formData.target_group === 'ALL' ? 'bg-[#1976D2] text-white shadow-[0_4px_12px_rgba(25,118,210,0.28)]' : 'bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8]'}`}
                            >
                                <Users className="w-3.5 h-3.5" /> {tr("surveysExt.entireOrganization")}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, target_group: 'CUSTOM'})}
                                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[4px] text-[12.5px] font-semibold transition-colors ${formData.target_group === 'CUSTOM' ? 'bg-[#212121] text-white shadow-sm' : 'bg-white border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F6F8]'}`}
                            >
                                <UserCheck className="w-3.5 h-3.5" /> {tr("surveysExt.customSelection")}
                            </button>
                        </div>
                    </div>

                    {formData.target_group === 'CUSTOM' && formData.employee_ids.length > 0 && (
                        <div className="mb-4">
                            <Badge tone="indigo">
                                <span className={jetbrainsMono.className}>{formData.employee_ids.length}</span> {tr("surveysExt.selected")}
                            </Badge>
                        </div>
                    )}

                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto pr-1 custom-scrollbar transition-opacity ${formData.target_group === 'ALL' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        {employees.map(emp => {
                            const active = formData.employee_ids.includes(emp.id);
                            return (
                                <div
                                    key={emp.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleEmployee(emp.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            toggleEmployee(emp.id);
                                        }
                                    }}
                                    className={`p-3 border rounded-[4px] cursor-pointer transition-colors flex items-center gap-3 ${active ? 'border-[#1976D2] bg-[#F5F4FE]' : 'border-[#E0E0E0] bg-white hover:border-[#E0E0E0]'}`}
                                >
                                    <div className={`w-9 h-9 rounded-[4px] flex items-center justify-center font-extrabold text-[12px] transition-colors border shrink-0 ${active ? 'bg-[#1976D2] text-white border-[#1976D2]' : 'bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]/60'}`}>
                                        {active ? <Check className="w-4 h-4 stroke-[2.5]" /> : emp.first_name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-[#212121] truncate leading-tight">{emp.first_name} {emp.last_name}</p>
                                        <p className="text-[11.5px] text-[#757575] truncate">{emp.designation || tr("surveysExt.specialist")}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {formData.target_group === "ALL" && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center p-8 text-center pointer-events-none">
                            <div className="bg-white p-8 rounded-[4px] shadow-[0_12px_40px_rgba(25,118,210,0.18)] border border-[#E0E0E0] animate-in zoom-in duration-300 max-w-sm">
                                <div className="w-16 h-16 rounded-[4px] flex items-center justify-center mx-auto mb-5 text-white" style={{ background: "linear-gradient(135deg,#42A5F5,#1976D2)", boxShadow: "0 8px 24px rgba(25,118,210,0.3)" }}>
                                    <Globe className="w-8 h-8" />
                                </div>
                                <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-[#212121] mb-2">{tr("surveysExt.organizationWide")}</h3>
                                <p className="text-[13px] text-[#757575] leading-relaxed">
                                    {tr("surveysExt.dispatchPre")} <span className="text-[#1976D2] font-bold"><span className={jetbrainsMono.className}>{employees.length}</span> {tr("surveysExt.employeesWord")}</span> {tr("surveysExt.dispatchPost")}
                                </p>
                            </div>
                        </div>
                    )}
                </Card>
            </form>
        </div>
    );
}
