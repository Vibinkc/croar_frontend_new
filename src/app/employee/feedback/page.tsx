"use client";

import { useCallback, useEffect, useState } from "react";
import { meApi, type My360Assignment, type SelfServiceAnswer } from "@/utils/payroll/api";
import { useDialog } from "@/components/payroll/DialogProvider";
import SelfServiceFiller from "@/components/employee/SelfServiceFiller";
import { PageHeader, Card, CardHeader, Button, Badge, EmptyState } from "@/components/ds";
import NotLinkedNotice, { isNoEmployeeLink } from "@/components/employee/NotLinkedNotice";

const RELATION_LABEL: Record<string, string> = {
  SELF: "Self-assessment",
  MANAGER: "Manager review",
  PEER: "Peer review",
  SUBORDINATE: "Upward review",
};

export default function EmployeeFeedbackPage() {
  const { alert } = useDialog();
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
      await alert({ title: "Thank you", message: "Your feedback has been submitted." });
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
        title="360 Feedback"
        subtitle="Assessments requesting your feedback — your responses are confidential"
        help={<p>You&apos;ve been asked to give feedback as part of a 360 review cycle. Your individual responses are confidential.</p>}
      />

      {error && (
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#FBD5D5] bg-[#FDECEC] px-4 py-3 text-[13px] font-medium text-[#C0383C]">
          <span className="material-symbols-rounded text-[18px]">error</span> {error}
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <CardHeader className="px-6 pt-6" title="Pending feedback" subtitle="Reviews awaiting your input"
          action={<Badge tone="indigo">{rows.length}</Badge>} />
        {loading ? (
          <div className="px-6 pb-6 space-y-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-[12px] bg-[#F4F5F7] animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState tone="muted" icon="task_alt" title="You're all caught up" description="No feedback requests are pending. New ones appear here when a review cycle starts." />
        ) : (
          <div className="divide-y divide-[#F0F0F1]">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#ECEBFB] text-[#5B53E0]">
                    <span className="material-symbols-rounded text-[22px]">rate_review</span>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[#15171C]">{r.relation === "SELF" ? "Your self-assessment" : `Review: ${r.ratee_name}`}</p>
                    <p className="truncate text-[12px] text-[#8A929E]">{RELATION_LABEL[r.relation] || r.relation} · {r.cycle_name}</p>
                  </div>
                </div>
                <Button size="sm" icon="edit_note" disabled={opening} onClick={() => open(r)}>Give Feedback</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {active && (
        <SelfServiceFiller
          title={active.relation === "SELF" ? "Your self-assessment" : `Feedback: ${active.ratee_name}`}
          subtitle={`${RELATION_LABEL[active.relation] || active.relation} · ${active.cycle_name}`}
          questions={questions}
          busy={submitting}
          onCancel={() => setActive(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
