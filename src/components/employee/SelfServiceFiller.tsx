"use client";

import { useMemo, useState } from "react";
import type { SelfServiceAnswer, SelfServiceQuestion } from "@/utils/payroll/api";
import { useI18n } from "@/context/I18nContext";

/**
 * Modal that renders a set of self-service questions (RATING / TEXT / MCQ) and
 * collects answers. Used by the employee-workspace 360 Feedback and Surveys
 * pages — the same generic filler for both. RATING and MCQ answers are required
 * before submit; TEXT is optional.
 */
export default function SelfServiceFiller({
  title,
  subtitle,
  questions,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  questions: SelfServiceQuestion[];
  busy: boolean;
  onCancel: () => void;
  onSubmit: (answers: SelfServiceAnswer[]) => void;
}) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<string, { value?: number; text?: string }>>({});

  const setVal = (qid: string, patch: { value?: number; text?: string }) =>
    setAnswers((a) => ({ ...a, [qid]: { ...a[qid], ...patch } }));

  const requiredUnanswered = useMemo(
    () =>
      questions.filter((q) => {
        const a = answers[q.id];
        if (q.type === "RATING") return a?.value == null;
        if (q.type === "MCQ") return !a?.text;
        return false; // TEXT is optional
      }).length,
    [questions, answers]
  );

  const build = (): SelfServiceAnswer[] =>
    questions.map((q) => ({
      question_id: q.id,
      answer_value: q.type === "RATING" ? answers[q.id]?.value ?? null : null,
      answer_text: q.type !== "RATING" ? answers[q.id]?.text ?? null : null,
    }));

  const ratingRange = (q: SelfServiceQuestion): number[] => {
    const lo = q.scale_min ?? 1;
    const hi = q.scale_max ?? 5;
    const out: number[] = [];
    for (let n = lo; n <= hi; n++) out.push(n);
    return out.length ? out : [1, 2, 3, 4, 5];
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#15171C]/40 p-4 backdrop-blur-sm">
      <div className="my-auto flex w-full max-w-2xl flex-col rounded-2xl border border-slate-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-[16px] font-black text-slate-900">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-[12px] font-medium text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label={t("employee.close")}
          >
            <span className="material-symbols-rounded text-[22px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] flex-1 overflow-y-auto px-6 py-5">
          {questions.length === 0 ? (
            <p className="text-[13px] text-slate-400">{t("employee.noQuestionsConfigured")}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {questions.map((q, idx) => (
                <div key={q.id}>
                  <div className="mb-2 flex items-start gap-2">
                    <span className="mt-0.5 text-[12px] font-black text-[#5B53E0]">{idx + 1}.</span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-slate-800">{q.text}</p>
                      {q.category && (
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                          {q.category}
                        </p>
                      )}
                    </div>
                  </div>

                  {q.type === "RATING" && (
                    <div className="flex flex-wrap gap-2 pl-6">
                      {ratingRange(q).map((n) => {
                        const active = answers[q.id]?.value === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setVal(q.id, { value: n })}
                            className={`h-10 w-10 rounded-xl border text-[14px] font-black transition-all ${
                              active
                                ? "border-[#5B53E0] bg-[#5B53E0] text-white shadow-[0_4px_12px_rgba(91,83,224,0.28)]"
                                : "border-slate-200 bg-white text-slate-500 hover:border-[#5B53E0] hover:text-[#5B53E0]"
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "MCQ" && (
                    <div className="flex flex-col gap-2 pl-6">
                      {(q.options || []).map((opt) => {
                        const active = answers[q.id]?.text === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setVal(q.id, { text: opt })}
                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all ${
                              active
                                ? "border-[#5B53E0] bg-[#5B53E0]/5 text-[#5B53E0]"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[#5B53E0]/40"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                active ? "border-[#5B53E0]" : "border-slate-300"
                              }`}
                            >
                              {active && <span className="h-2 w-2 rounded-full bg-[#5B53E0]" />}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.type === "TEXT" && (
                    <div className="pl-6">
                      <textarea
                        rows={3}
                        value={answers[q.id]?.text ?? ""}
                        onChange={(e) => setVal(q.id, { text: e.target.value })}
                        placeholder={t("employee.yourAnswerPlaceholder")}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-[13.5px] text-slate-700 outline-none transition-all focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/15"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <span className="text-[12px] font-medium text-slate-400">
            {requiredUnanswered > 0 ? t("employee.requiredQuestionsLeft", { count: requiredUnanswered }) : t("employee.allSet")}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-bold text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {t("employee.cancel")}
            </button>
            <button
              type="button"
              onClick={() => onSubmit(build())}
              disabled={busy || requiredUnanswered > 0 || questions.length === 0}
              className="rounded-lg bg-[#5B53E0] px-5 py-2 text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(91,83,224,0.28)] transition-colors hover:bg-[#4A42C8] disabled:opacity-50"
            >
              {busy ? t("employee.submitting") : t("employee.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
