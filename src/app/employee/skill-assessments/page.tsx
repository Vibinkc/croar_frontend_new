"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meApi, type SkillAssessmentSummary } from "@/utils/payroll/api";
import { PageHeader, StatCard, StatGrid, Card, CardHeader, Badge, Button, EmptyState, jetbrainsMono } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

const TYPE_TONE: Record<string, "indigo" | "teal" | "warning"> = { APTITUDE: "indigo", CODING: "teal", BOTH: "warning" };

export default function EmployeeSkillAssessmentsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const typeLabel = (ty: string) =>
    ["APTITUDE", "CODING", "BOTH"].includes(ty) ? t(`employee.assessType_${ty}`) : ty;
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
        title={t("employee.skillAssessmentsTitle")}
        subtitle={t("employee.skillAssessmentsSubtitle")}
        help={<p>{t("employee.skillAssessmentsHelp")}</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <StatGrid>
        <StatCard label={t("employee.assigned")} value={loading ? "—" : rows.length} icon="quiz" gradient="linear-gradient(135deg,#42A5F5,#1976D2)" glow="rgba(25,118,210,0.28)" />
        <StatCard label={t("employee.toDo")} value={loading ? "—" : pending} icon="pending_actions" gradient="linear-gradient(135deg,#FFB74D,#EF6C00)" glow="rgba(239,108,0,0.25)" />
        <StatCard label={t("employee.completed")} value={loading ? "—" : done} icon="task_alt" gradient="linear-gradient(135deg,#66BB6A,#2E7D32)" glow="rgba(46,125,50,0.25)" />
        <StatCard label={t("employee.totalQuestions")} value={loading ? "—" : rows.reduce((s, r) => s + (r.question_count || 0), 0)} icon="help" gradient="linear-gradient(135deg,#42A5F5,#1565C0)" glow="rgba(21,101,192,0.25)" />
      </StatGrid>

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={t("employee.yourAssessments")} subtitle={t("employee.assignedByOrg")} />
        {loading ? (
          <div className="px-6 pb-6 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-[4px] bg-[#F5F6F8] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="quiz" title={t("employee.noAssessments")} description={t("employee.noAssessmentsDesc")} />
        ) : (
          <div className="divide-y divide-[#EEEEEE]">
            {rows.map((r) => {
              const isDone = r.status === "COMPLETED";
              return (
                <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#E3F2FD] text-[#1976D2]">
                      <span className="material-symbols-rounded text-[22px]">quiz</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-[#212121]">{r.name}</p>
                        <Badge tone={TYPE_TONE[r.type] || "neutral"}>{typeLabel(r.type)}</Badge>
                      </div>
                      <p className={`truncate text-[12px] text-[#757575] mt-0.5 ${jetbrainsMono.className}`}>{t("employee.assessMeta", { topic: r.topic, count: r.question_count, duration: r.duration })}</p>
                    </div>
                  </div>
                  {isDone ? (
                    <Badge tone="success" dot>{t("employee.completed")}</Badge>
                  ) : (
                    <Button size="sm" icon="play_arrow" onClick={() => router.push(`/employee/skill-assessments/${r.id}`)}>{t("employee.start")}</Button>
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
