"use client";

import { useCallback, useEffect, useState } from "react";
import { meApi, type My360Assignment, type SelfServiceAnswer } from "@/utils/payroll/api";
import { useDialog } from "@/components/payroll/DialogProvider";
import SelfServiceFiller from "@/components/employee/SelfServiceFiller";
import { PageHeader, Card, CardHeader, Button, Badge, EmptyState } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";
import { useI18n } from "@/context/I18nContext";

export default function EmployeeFeedbackPage() {
  const { alert } = useDialog();
  const { t } = useI18n();
  const relationLabel = (rel: string) =>
    ["SELF", "MANAGER", "PEER", "SUBORDINATE"].includes(rel) ? t(`employee.relation_${rel}`) : rel;
  const [rows, setRows] = useState<My360Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<My360Assignment | null>(null);
  const [questions, setQuestions] = useState<Awaited<ReturnType<typeof meApi.my360Assignment>>["questions"]>([]);
  const [opening, setOpening] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await meApi.my360Assignments());
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

  async function open(row: My360Assignment) {
    setOpening(true);
    try {
      const detail = await meApi.my360Assignment(row.id);
      setQuestions(detail.questions);
      setActive(row);
    } catch (e) {
      await alert({ message: (e as Error).message, tone: "danger" });
    } finally {
      setOpening(false);
    }
  }

  async function submit(answers: SelfServiceAnswer[]) {
    if (!active) return;
    setSubmitting(true);
    try {
      await meApi.submit360(active.id, answers);
      setActive(null);
      await alert({ title: t("employee.thankYou"), message: t("employee.feedbackSubmitted") });
      await load();
    } catch (e) {
      await alert({ message: (e as Error).message, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  if (isNoEmployeeLink(error)) return <div className="px-4 sm:px-5 md:px-7 pb-10 max-w-[1320px] mx-auto w-full"><NotLinkedNotice /></div>;

  return (
    <div className="px-4 sm:px-5 md:px-7 pb-10 space-y-6 max-w-[1320px] mx-auto w-full animate-in fade-in duration-500">
      <PageHeader
        title={t("employee.feedbackTitle")}
        subtitle={t("employee.feedbackSubtitle")}
        help={<p>{t("employee.feedbackHelp")}</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[4px] border border-[#FFCDD2] bg-[#FFEBEE] px-4 py-3 text-[13px] font-medium text-[#C62828]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title={t("employee.pendingFeedback")} subtitle={t("employee.pendingFeedbackSubtitle")}
          action={<Badge tone="indigo">{rows.length}</Badge>} />
        {loading ? (
          <div className="px-6 pb-6 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-[4px] bg-[#F5F6F8] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="task_alt" title={t("employee.allCaughtUp")} description={t("employee.noFeedbackDesc")} />
        ) : (
          <div className="divide-y divide-[#EEEEEE]">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#E3F2FD] text-[#1976D2]">
                    <span className="material-symbols-rounded text-[22px]">rate_review</span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[#212121]">{r.relation === "SELF" ? t("employee.yourSelfAssessment") : t("employee.reviewName", { name: r.ratee_name })}</p>
                    <p className="truncate text-[12px] text-[#757575]">{relationLabel(r.relation)} · {r.cycle_name}</p>
                  </div>
                </div>
                <Button size="sm" icon="edit_note" disabled={opening} onClick={() => open(r)}>{t("employee.giveFeedback")}</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {active && (
        <SelfServiceFiller
          title={active.relation === "SELF" ? t("employee.yourSelfAssessment") : t("employee.feedbackName", { name: active.ratee_name })}
          subtitle={`${relationLabel(active.relation)} · ${active.cycle_name}`}
          questions={questions}
          busy={submitting}
          onCancel={() => setActive(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
