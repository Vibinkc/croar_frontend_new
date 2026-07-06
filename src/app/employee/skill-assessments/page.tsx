"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meApi, type SkillAssessmentSummary } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Badge, Button, EmptyState, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";

const TYPE_LABEL: Record<string, string> = {
  APTITUDE: "Aptitude",
  CODING: "Coding",
  BOTH: "Aptitude + Coding",
};
const TYPE_TONE: Record<string, "indigo" | "teal" | "warning"> = { APTITUDE: "indigo", CODING: "teal", BOTH: "warning" };

export default function EmployeeSkillAssessmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SkillAssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await meApi.mySkillAssessments());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  const pending = rows.filter((r) => r.status !== "COMPLETED").length;
  const done = rows.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title="Skill Assessments"
        subtitle="Timed tests assigned to you — complete them to benchmark your skills"
        help={<p>Your organization assigns aptitude & coding assessments here. Each is timed; once you start, finish in one sitting.</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label="Assigned" value={loading ? "—" : rows.length} icon="quiz" gradient="linear-gradient(135deg,#8B7DFF,#5B53E0)" glow="rgba(91,83,224,0.28)" />
        <StatCard label="To do" value={loading ? "—" : pending} icon="pending_actions" gradient="linear-gradient(135deg,#F6B65C,#D97706)" glow="rgba(217,119,6,0.25)" />
        <StatCard label="Completed" value={loading ? "—" : done} icon="task_alt" gradient="linear-gradient(135deg,#34D399,#0E8A6E)" glow="rgba(14,138,110,0.25)" />
        <StatCard label="Total questions" value={loading ? "—" : rows.reduce((s, r) => s + (r.question_count || 0), 0)} icon="help" gradient="linear-gradient(135deg,#6E8BEA,#3559C7)" glow="rgba(53,89,199,0.25)" />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title="Your assessments" subtitle="Assigned by your organization" />
        {loading ? (
          <div className="px-6 pb-6 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-[12px] bg-[#F4F5F7] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="quiz" title="No assessments assigned" description="When your organization assigns a skill assessment, it will appear here." />
        ) : (
          <div className="divide-y divide-[#F0F0F1]">
            {rows.map((r) => {
              const isDone = r.status === "COMPLETED";
              return (
                <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#ECEBFB] text-[#5B53E0]">
                      <span className="material-symbols-rounded text-[22px]">quiz</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-[#15171C]">{r.name}</p>
                        <Badge tone={TYPE_TONE[r.type] || "neutral"}>{TYPE_LABEL[r.type] || r.type}</Badge>
                      </div>
                      <p className={`truncate text-[12px] text-[#8A929E] mt-0.5 ${jetbrainsMono.className}`}>{r.topic} · {r.question_count} Qs · {r.duration}m</p>
                    </div>
                  </div>
                  {isDone ? (
                    <Badge tone="success" dot>Completed</Badge>
                  ) : (
                    <Button size="sm" icon="play_arrow" onClick={() => router.push(`/employee/skill-assessments/${r.id}`)}>Start</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
