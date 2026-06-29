"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SimulationChat from "@/app/enterprise/components/SimulationChat";
import { BACKEND_URL } from "@/utils/api";
import { Button, Card, Input, Field, Badge, CroarLogo, jetbrainsMono } from "@/components/ds";

interface Assessment {
    id: string;
    ratee_name: string;
    relation: string;
}

interface Survey {
    id: string;
    instance_name: string;
    template_title: string;
    token: string;
}

interface SimulationAssignment {
    id: string;
    scenario_id: string;
    title: string;
    description: string;
    character: string;
}

interface Employee {
    id: string;
    first_name: string;
}

export default function UnifiedEmployeePortal() {
    const router = useRouter();
    const [step, setStep] = useState<'login' | 'list'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [credentials, setCredentials] = useState({
        employee_id: "",
        email: ""
    });

    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [simulationAssignments, setSimulationAssignments] = useState<SimulationAssignment[]>([]);
    const [employee, setEmployee] = useState<Employee | null>(null);

    // Simulation Session State
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");

        const trimmedId = credentials.employee_id.trim();
        const trimmedEmail = credentials.email.trim();

        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/surveys/portal/login?employee_id=${trimmedId}&email=${trimmedEmail}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setEmployee(data.employee);
                setAssessments(data.x360_assignments || []);
                setSurveys(data.survey_invites || []);
                setSimulationAssignments(data.simulation_assignments || []);
                setStep('list');
            } else {
                setError(data.detail || "Invalid ID or Email. Please check and try again.");
            }
        } catch (err) {
            setError("Connection error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const startSimulation = async (scenarioId: string, assignmentId: string) => {
        if (!employee) return;  // only reachable after login (employee is set); guards the null type
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/simulations/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    scenario_id: scenarioId,
                    employee_id: employee.id,
                    assignment_id: assignmentId
                })
            });
            const data = await res.json();
            if (res.ok) {
                setActiveSessionId(data.id);
                setActiveAssignmentId(assignmentId);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const totalTasks = assessments.length + surveys.length + simulationAssignments.length;

    if (activeSessionId) {
        return (
            <div className="fixed inset-0 bg-white z-[100] animate-in fade-in duration-500 overflow-hidden">
                <SimulationChat
                    sessionId={activeSessionId}
                    onClose={() => {
                        setActiveSessionId(null);
                        // Refresh data after completion
                        handleLogin();
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-start py-12 sm:py-16 px-4 sm:px-5 md:px-7 selection:bg-[#ECEBFB] overflow-x-hidden">
            <div className={`w-full transition-all duration-700 ease-in-out ${step === 'login' ? 'max-w-[460px]' : 'max-w-[1200px]'}`}>
                {step === 'login' ? (
                    <Card padding="lg" className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                        <header className="text-center mb-9">
                            <div className="flex justify-center mb-6">
                                <CroarLogo />
                            </div>
                            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Employee Experience Hub</h1>
                            <p className="text-[13.5px] text-[#8A929E] mt-1.5">Growth, Feedback &amp; Behavioral Training</p>
                        </header>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <Field label="Employee UUID / ID" htmlFor="portal-employee-id" required>
                                <Input
                                    id="portal-employee-id"
                                    icon="badge"
                                    placeholder="Enter your unique ID..."
                                    value={credentials.employee_id}
                                    onChange={(e) => setCredentials({...credentials, employee_id: e.target.value})}
                                    required
                                />
                            </Field>

                            <Field label="Corporate Email" htmlFor="portal-corporate-email" required>
                                <Input
                                    id="portal-corporate-email"
                                    type="email"
                                    icon="mail"
                                    placeholder="yourname@company.com"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                    required
                                />
                            </Field>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-[#FDECEC] text-[#C0383C] rounded-[10px] text-[12.5px] font-medium border border-[#F6D5D5]">
                                    <span className="material-symbols-rounded text-[18px] mt-px">error</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                fullWidth
                                disabled={loading}
                                trailingIcon={loading ? undefined : "arrow_forward"}
                                className="mt-1"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Logging in...
                                    </span>
                                ) : (
                                    "Enter Hub"
                                )}
                            </Button>
                        </form>

                        <footer className="mt-8 text-center text-[12px] text-[#8A929E]">
                            Secure entry point for employee growth.
                        </footer>
                    </Card>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#E8EAED]">
                            <div className="min-w-0">
                                <h1 className="text-[22px] md:text-[26px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">
                                    Welcome back, {employee?.first_name}
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge tone="indigo" dot>
                                        <span className={`${jetbrainsMono.className} font-semibold`}>{totalTasks}</span>
                                        &nbsp;active task{totalTasks === 1 ? '' : 's'}
                                    </Badge>
                                    <span className="text-[12.5px] text-[#8A929E]">in your pipeline</span>
                                </div>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon="logout"
                                onClick={() => setStep('login')}
                            >
                                Close Session
                            </Button>
                        </header>

                        {totalTasks === 0 ? (
                            <Card padding="lg" className="py-20 text-center">
                                <div className="w-16 h-16 bg-[#E6F4EA] text-[#15803D] rounded-[14px] flex items-center justify-center mx-auto mb-5">
                                    <span className="material-symbols-rounded text-[34px]">task_alt</span>
                                </div>
                                <h3 className="text-[17px] font-bold text-[#15171C]">All caught up</h3>
                                <p className="text-[13.5px] text-[#8A929E] mt-1">You have no active tasks currently.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* 360 Section */}
                                <section className="space-y-3.5">
                                    <div className="flex items-center gap-2 px-0.5">
                                        <span className="material-symbols-rounded text-[20px] text-[#5B53E0]">group</span>
                                        <h3 className="text-[13px] font-bold text-[#15171C]">360° Feedback</h3>
                                        <Badge tone="indigo" className="ml-auto">
                                            <span className={jetbrainsMono.className}>{assessments.length}</span>
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {assessments.length > 0 ? assessments.map((ass) => (
                                            <Card key={ass.id} padding="sm" interactive className="group flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-11 h-11 bg-[#ECEBFB] text-[#5B53E0] rounded-[11px] flex items-center justify-center font-bold text-[16px] shrink-0">
                                                        {ass.ratee_name?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[14px] font-semibold text-[#15171C] leading-tight truncate">Review {ass.ratee_name}</h4>
                                                        <p className="text-[12px] text-[#8A929E] mt-0.5 truncate">{ass.relation}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => router.push(`/enterprise/assessments-360/${ass.id}`)}
                                                    className="shrink-0 w-9 px-0"
                                                    aria-label={`Review ${ass.ratee_name}`}
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">arrow_forward</span>
                                                </Button>
                                            </Card>
                                        )) : (
                                            <div className="py-10 bg-[#F7F8FA] rounded-[14px] border border-dashed border-[#E1E4E8] flex flex-col items-center justify-center gap-2 text-[#8A929E]">
                                                <span className="material-symbols-rounded text-[26px] opacity-50">history_edu</span>
                                                <p className="text-[12px] font-medium">No pending reviews</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Surveys Section */}
                                <section className="space-y-3.5">
                                    <div className="flex items-center gap-2 px-0.5">
                                        <span className="material-symbols-rounded text-[20px] text-[#0E8A6E]">analytics</span>
                                        <h3 className="text-[13px] font-bold text-[#15171C]">Culture Surveys</h3>
                                        <Badge tone="teal" className="ml-auto">
                                            <span className={jetbrainsMono.className}>{surveys.length}</span>
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {surveys.length > 0 ? surveys.map((srv) => (
                                            <Card key={srv.id} padding="sm" interactive className="group flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-11 h-11 bg-[#E3F4EF] text-[#0E8A6E] rounded-[11px] flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-rounded text-[20px]">assignment</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-[14px] font-semibold text-[#15171C] leading-tight truncate">{srv.instance_name}</h4>
                                                        <p className="text-[12px] text-[#8A929E] mt-0.5 truncate">{srv.template_title}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => router.push(`/enterprise/surveys/fill/${srv.token}`)}
                                                    className="shrink-0 w-9 px-0"
                                                    aria-label={`Fill ${srv.instance_name}`}
                                                >
                                                    <span className="material-symbols-rounded text-[18px]">edit_note</span>
                                                </Button>
                                            </Card>
                                        )) : (
                                            <div className="py-10 bg-[#F7F8FA] rounded-[14px] border border-dashed border-[#E1E4E8] flex flex-col items-center justify-center gap-2 text-[#8A929E]">
                                                <span className="material-symbols-rounded text-[26px] opacity-50">poll</span>
                                                <p className="text-[12px] font-medium">All pulse checks completed</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* AI Lab Section */}
                                <section className="space-y-3.5">
                                    <div className="flex items-center gap-2 px-0.5">
                                        <span className="material-symbols-rounded text-[20px] text-[#D97706]">neurology</span>
                                        <h3 className="text-[13px] font-bold text-[#15171C]">AI Practice Lab</h3>
                                        <Badge tone="warning" className="ml-auto">
                                            <span className={jetbrainsMono.className}>{simulationAssignments.length}</span>
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {simulationAssignments.length > 0 ? simulationAssignments.map((sim) => (
                                            <Card key={sim.id} padding="sm" interactive className="group flex flex-col gap-3.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="w-11 h-11 bg-[#FEF3E2] text-[#D97706] rounded-[11px] flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-rounded text-[20px]">psychology</span>
                                                    </div>
                                                    <Badge tone="neutral">Practice</Badge>
                                                </div>
                                                <div>
                                                    <h4 className="text-[14px] font-semibold text-[#15171C] leading-tight">{sim.title}</h4>
                                                    <p className="text-[12.5px] text-[#8A929E] mt-1 leading-relaxed line-clamp-2">{sim.description}</p>
                                                </div>
                                                <div className="pt-3 border-t border-[#E8EAED] flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="material-symbols-rounded text-[#D97706] text-[16px] shrink-0">record_voice_over</span>
                                                        <span className="text-[12px] text-[#8A929E] truncate">{sim.character}</span>
                                                    </div>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        trailingIcon="play_arrow"
                                                        onClick={() => startSimulation(sim.scenario_id, sim.id)}
                                                        className="shrink-0"
                                                    >
                                                        Start Practice
                                                    </Button>
                                                </div>
                                            </Card>
                                        )) : (
                                            <div className="py-10 bg-[#F7F8FA] rounded-[14px] border border-dashed border-[#E1E4E8] flex flex-col items-center justify-center gap-2 text-[#8A929E]">
                                                <span className="material-symbols-rounded text-[26px] opacity-50">lock_open</span>
                                                <p className="text-[12px] font-medium">No lab sessions assigned</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Portal Footer */}
            <div className={`mt-10 text-[11px] font-medium text-[#8A929E] tracking-[0.2em] uppercase transition-opacity duration-700 ${step === 'login' ? 'opacity-0' : 'opacity-100'}`}>
                Employee Portal
            </div>
        </div>
    );
}
