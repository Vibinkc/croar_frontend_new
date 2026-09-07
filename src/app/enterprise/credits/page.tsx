"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { Badge, Button, Card, CardHeader, Input, PageHeader, StatCard, StatGrid, jetbrainsMono } from "@/components/ds";

type CategoryUsage = { credits: number; count: number };
type Summary = {
  balance: number;
  total_granted: number;
  total_used: number;
  by_category: Record<string, CategoryUsage>;
};
type Tx = {
  id: string;
  kind: string;
  category: string | null;
  action: string | null;
  units: number;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string | null;
};
type Costs = { costs: Record<string, Record<string, number>>; initial_free_credits: number };

// The four meters, in display order, with a friendly label + icon + accent.
const METERS: { key: string; label: string; icon: string; gradient: string; glow: string }[] = [
  { key: "sourcing", label: "Profile Sourcing", icon: "travel_explore", gradient: "linear-gradient(135deg,#1976D2,#8b7cf6)", glow: "rgba(25,118,210,0.28)" },
  { key: "ai", label: "AI Usage", icon: "auto_awesome", gradient: "linear-gradient(135deg,#0ea5e9,#22d3ee)", glow: "rgba(14,165,233,0.28)" },
  { key: "assessment", label: "Assessments", icon: "quiz", gradient: "linear-gradient(135deg,#FB8C00,#f97316)", glow: "rgba(245,158,11,0.26)" },
  { key: "interview", label: "Interviews", icon: "co_present", gradient: "linear-gradient(135deg,#43A047,#66BB6A)", glow: "rgba(67,160,71,0.26)" },
];

const CATEGORY_LABEL: Record<string, string> = {
  sourcing: "Profile Sourcing",
  ai: "AI Usage",
  assessment: "Assessments",
  interview: "Interviews",
};

function fmt(n: number) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function CreditsPage() {
  const { canAccess } = useAuth();
  const isAdmin = canAccess ? canAccess("organization:moderate") : false;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [costs, setCosts] = useState<Costs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantAmt, setGrantAmt] = useState("");
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, hRes, cRes] = await Promise.all([
        apiClient.get("/api/v1/enterprise/credits/summary"),
        apiClient.get("/api/v1/enterprise/credits/history?limit=50"),
        apiClient.get("/api/v1/enterprise/credits/costs"),
      ]);
      if (!sRes.ok) throw new Error("Failed to load credit balance");
      setSummary(await sRes.json());
      setHistory(hRes.ok ? await hRes.json() : []);
      setCosts(cRes.ok ? await cRes.json() : null);
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

  const grant = async () => {
    const amount = parseFloat(grantAmt);
    if (!amount || amount <= 0) return;
    setGranting(true);
    try {
      const res = await apiClient.post("/api/v1/enterprise/credits/grant", { amount, description: "Manual top-up" });
      if (res.ok) {
        setGrantAmt("");
        await load();
      }
    } finally {
      setGranting(false);
    }
  };

  const totalUsed = summary?.total_used ?? 0;
  const usagePct = summary && summary.total_granted > 0 ? Math.min(100, (totalUsed / summary.total_granted) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Credits"
        subtitle="Track and manage the credits consumed across sourcing, AI, assessments and interviews."
      />

      {error && (
        <Card className="mt-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Balance + usage bar */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col justify-between overflow-hidden" style={{ background: "linear-gradient(135deg,#111827,#1f2937)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Available balance</p>
              <p className={`mt-1 text-4xl font-bold text-white ${jetbrainsMono.className}`}>
                {loading ? "—" : fmt(summary?.balance ?? 0)}
                <span className="ml-2 text-base font-medium text-white/50">credits</span>
              </p>
            </div>
            <span className="material-symbols-rounded text-white/80" style={{ fontSize: 40 }}>account_balance_wallet</span>
          </div>
          <div className="mt-6">
            <div className="mb-1 flex justify-between text-xs text-white/60">
              <span>{fmt(totalUsed)} used</span>
              <span>{fmt(summary?.total_granted ?? 0)} granted</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-400" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
        </Card>

        {/* Admin top-up */}
        <Card>
          <CardHeader title="Add credits" subtitle={isAdmin ? "Top up the wallet" : "Admins can top up"} />
          <div className="mt-3 flex flex-col gap-2">
            <Input
              type="number"
              placeholder="e.g. 500"
              value={grantAmt}
              onChange={(e) => setGrantAmt(e.target.value)}
              disabled={!isAdmin || granting}
            />
            <Button onClick={grant} disabled={!isAdmin || granting || !grantAmt} fullWidth>
              {granting ? "Adding…" : "Add credits"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Per-meter usage */}
      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Usage by area</h2>
      <StatGrid>
        {METERS.map((m) => {
          const u = summary?.by_category?.[m.key] ?? { credits: 0, count: 0 };
          return (
            <StatCard
              key={m.key}
              label={m.label}
              value={`${fmt(u.credits)} cr`}
              icon={m.icon}
              gradient={m.gradient}
              glow={m.glow}
            />
          );
        })}
      </StatGrid>
      <p className="mt-2 text-xs text-gray-400">
        {METERS.map((m) => `${(summary?.by_category?.[m.key]?.count ?? 0)} ${m.label.toLowerCase()}`).join(" · ")}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cost table */}
        <Card className="lg:col-span-1">
          <CardHeader title="How credits are charged" />
          <div className="mt-3 space-y-3 text-sm">
            <CostRow label="Profile sourcing" detail="per profile sourced" value={costs?.costs?.sourcing?.profile ?? 1} />
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <div>
                <p className="font-medium text-gray-800">AI usage</p>
                <p className="text-xs text-gray-400">by actual token burn</p>
              </div>
              <span className={`text-right text-[13px] font-semibold text-indigo-600 ${jetbrainsMono.className}`}>
                {fmt(costs?.costs?.ai?.input_per_1k ?? 0.2)} <span className="text-gray-400 font-normal">in</span> · {fmt(costs?.costs?.ai?.output_per_1k ?? 1)} <span className="text-gray-400 font-normal">out</span>
                <span className="block text-[10px] text-gray-400 font-normal">cr / 1K tokens</span>
              </span>
            </div>
            <CostRow label="Assessment" detail="per completed attempt" value={costs?.costs?.assessment?.attempt ?? 3} />
            <CostRow label="Interview" detail="per AI interview session" value={costs?.costs?.interview?.session ?? 5} />
          </div>
        </Card>

        {/* History */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle={`${history.length} entries`} />
          <div className="mt-3 max-h-[420px] overflow-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
            ) : history.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No activity yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left text-xs uppercase text-gray-400">
                    <th className="py-2 pr-2 font-medium">When</th>
                    <th className="py-2 pr-2 font-medium">Activity</th>
                    <th className="py-2 pr-2 text-right font-medium">Credits</th>
                    <th className="py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-2 whitespace-nowrap text-gray-500">
                        {t.created_at ? new Date(t.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="py-2 pr-2">
                        {t.kind === "grant" ? (
                          <Badge tone="success" dot>Top-up</Badge>
                        ) : (
                          <span className="text-gray-700">
                            {CATEGORY_LABEL[t.category ?? ""] ?? t.category ?? "—"}
                            {t.description ? <span className="ml-1 text-gray-400">· {t.description}</span> : null}
                          </span>
                        )}
                      </td>
                      <td className={`py-2 pr-2 text-right ${jetbrainsMono.className} ${t.amount < 0 ? "text-gray-800" : "text-emerald-600"}`}>
                        {t.amount < 0 ? "" : "+"}{fmt(t.amount)}
                      </td>
                      <td className={`py-2 text-right text-gray-500 ${jetbrainsMono.className}`}>{fmt(t.balance_after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CostRow({ label, detail, value }: { label: string; detail: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{detail}</p>
      </div>
      <span className={`text-sm font-semibold text-indigo-600 ${jetbrainsMono.className}`}>{fmt(value)} cr</span>
    </div>
  );
}
