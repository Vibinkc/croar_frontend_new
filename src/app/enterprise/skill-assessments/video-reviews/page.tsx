"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient, BACKEND_URL } from "@/utils/api";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ds";

type Answer = { question: string; video_url: string | null };
type Review = {
  attempt_id: string;
  application_id: string;
  candidate_name: string | null;
  candidate_email: string | null;
  topic: string | null;
  submitted_at: string | null;
  answers: Answer[];
};

export default function VideoReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/v1/enterprise/assessment/attempts/pending-review");
      setItems(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submitReview = async (attemptId: string) => {
    const raw = scores[attemptId];
    const score = Math.max(0, Math.min(100, parseInt(raw || "", 10)));
    if (Number.isNaN(score)) return;
    setSaving(attemptId);
    try {
      const res = await apiClient.post(`/api/v1/enterprise/assessment/attempts/${attemptId}/review`, { score });
      if (res.ok) await load();
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Video Assessment Reviews"
        subtitle="Watch candidates' recorded answers and score them. A score of 60 or more advances the candidate."
      />
      {loading ? (
        <p className="mt-8 text-center text-sm text-gray-400">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="reviews" title="Nothing to review" description="Completed video assessments awaiting a score will appear here." />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {items.map((it) => (
            <Card key={it.attempt_id}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EEF0F4] pb-4">
                <div>
                  <p className="text-[15px] font-bold text-[#15171C]">{it.candidate_name || it.candidate_email || "Candidate"}</p>
                  <p className="text-[12.5px] text-[#8A929E]">{it.candidate_email} · {it.topic}</p>
                </div>
                <Badge tone="warning" dot>Pending review</Badge>
              </div>

              <div className="mt-4 grid gap-5">
                {it.answers.map((a, i) => (
                  <div key={i} className="grid gap-2">
                    <p className="text-[13.5px] font-semibold text-[#374151]"><span className="text-[#8A929E]">Q{i + 1}.</span> {a.question}</p>
                    {a.video_url ? (
                      <video src={`${BACKEND_URL}${a.video_url}`} controls className="w-full max-w-md rounded-xl border border-[#E8EAED] bg-black" />
                    ) : (
                      <p className="text-xs italic text-rose-400">No video submitted for this question.</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EEF0F4] pt-4">
                <label className="text-[12.5px] font-semibold text-[#374151]">Score (0–100)</label>
                <input
                  type="number" min={0} max={100}
                  value={scores[it.attempt_id] ?? ""}
                  onChange={(e) => setScores((s) => ({ ...s, [it.attempt_id]: e.target.value }))}
                  className="h-10 w-24 rounded-lg border border-[#E1E4E8] px-3 text-sm font-semibold text-[#374151] focus:border-[#5B53E0] focus:ring-2 focus:ring-[#5B53E0]/20"
                />
                <Button onClick={() => submitReview(it.attempt_id)} disabled={saving === it.attempt_id || !scores[it.attempt_id]}>
                  {saving === it.attempt_id ? "Saving…" : "Submit score"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
