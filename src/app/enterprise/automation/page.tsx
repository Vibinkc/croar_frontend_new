"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { BACKEND_URL } from "@/utils/api";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import AutomationNodeModal from "./AutomationNodeModal";
import { PageHelp } from "@/components/ds";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface WorkflowStage {
  name: string;
  stage?: number;
  order?: number;
}

interface Job {
  id: string;
  title: string;
  workflow_stages?: WorkflowStage[] | null;
}

interface Automation {
  id: string;
  job_requirement_id: string;
  stage_index: number;
  stage_name: string | null;
  criteria: string;
  is_enabled: boolean;
  type: "mail" | "assessment" | "interview" | "onboarding";
  action_type?: "mail" | "assessment" | "interview" | "onboarding";
  template_id?: string;
  is_immediate?: boolean;
  topic?: string;
  generated_questions?: Record<string, unknown>[];
  interview_type?: string;
  time_slots?: string[];
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function AutomationCanvasPage() {
  const { token, canAccess } = useAuth();
    const { t: tr } = useI18n();
  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [automations, setAutomations] = useState<Automation[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNodeType, setActiveNodeType] = useState<"mail" | "assessment" | "interview" | "onboarding">("mail");
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialData = useMemo(() => {
    if (!editingId) return null;
    return automations.find(a => a.id === editingId) || null;
  }, [editingId, automations]);

  // Fetch jobs on mount
  useEffect(() => {
    if (!token) return;
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/jobs/`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          const jobList = Array.isArray(data) ? data : [];
          setJobs(jobList);
          if (jobList.length > 0) {
            setSelectedJobId(jobList[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load jobs:", e);
      }
    };
    fetchJobs();
  }, [token, authHeaders]);

  // Fetch automations when a job is selected
  const fetchAutomations = useCallback(async (jobId: string) => {
    if (!token || !jobId) return;
    setLoading(true);
    try {
      const endpoints = [
        { type: "mail", url: `${BACKEND_URL}/api/v1/enterprise/automation/mail?job_id=${jobId}` },
        { type: "assessment", url: `${BACKEND_URL}/api/v1/enterprise/assessment/?job_id=${jobId}` },
        { type: "interview", url: `${BACKEND_URL}/api/v1/enterprise/interview-automation/?job_id=${jobId}` },
        { type: "onboarding", url: `${BACKEND_URL}/api/v1/enterprise/onboarding-automation/?job_id=${jobId}` },
      ];

      const responses = await Promise.all(
        endpoints.map(ep => fetch(ep.url, { headers: authHeaders }).then(r => r.ok ? r.json() : []).catch(() => []))
      );

      let allAutomations: (Automation & { action_type: string })[] = [];
      endpoints.forEach((ep, idx) => {
        const data = responses[idx];
        if (Array.isArray(data)) {
          allAutomations = [
            ...allAutomations,
            ...data
              .filter((d: Automation) => !d.job_requirement_id || String(d.job_requirement_id) === String(jobId))
              .map((d: Automation) => ({ ...d, action_type: ep.type as "mail" | "assessment" | "interview" | "onboarding" })),
          ];
        }
      });

      const job = jobs.find(j => j.id === jobId);
      const rounds: WorkflowStage[] = job?.workflow_stages ?? [];
      
      if (rounds.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      const HORIZONTAL_SPACING = 350;
      const VERTICAL_SPACING = 150;

      rounds.forEach((round, rIdx) => {
        const roundNodeId = `round-${rIdx + 1}`;
        
        // Create Round Node (Horizontal Flow)
        newNodes.push({
          id: roundNodeId,
          type: 'default',
          position: { x: rIdx * HORIZONTAL_SPACING, y: 100 },
          data: { 
            label: (
              <div className="flex flex-col items-center p-2">
                <span className="text-[10px] font-bold text-[#1976D2] uppercase tracking-wider">{tr("automation.round")} {rIdx + 1}</span>
                <span className="font-bold text-[#212121] text-[13.5px] mt-0.5">{round.name}</span>
              </div>
            ) 
          },
          style: {
            background: '#fff',
            border: '1.5px solid #1976D2',
            borderRadius: '12px',
            boxShadow: '0 4px 14px 0 rgba(25,118,210, 0.08)',
            width: 180,
          },
          sourcePosition: 'right' as Position,
          targetPosition: 'left' as Position,
        });
 
        // Connect to previous round
        if (rIdx > 0) {
          newEdges.push({
            id: `edge-round-${rIdx}-to-${rIdx + 1}`,
            source: `round-${rIdx}`,
            target: roundNodeId,
            type: 'smoothstep',
            style: { stroke: '#E0E0E0', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#E0E0E0' },
          });
        }
 
        // Find automations for this round
        const roundIndex = rIdx + 1;
        const roundAutomations = allAutomations.filter(a => a.stage_index === roundIndex);
 
        roundAutomations.forEach((auto, aIdx) => {
          const autoNodeId = `auto-${auto.action_type}-${auto.id}`;
          
          let icon = "mail";
          let color = "#1E88E5";
          let bg = "#eff6ff";
          if (auto.action_type === "mail") { icon = "mark_email_unread"; color = "#1976D2"; bg = "#E3F2FD"; }
          if (auto.action_type === "assessment") { icon = "psychology"; color = "#EF6C00"; bg = "#FFF3E0"; }
          if (auto.action_type === "interview") { icon = "event_available"; color = "#2E7D32"; bg = "#E8F5E9"; }
          if (auto.action_type === "onboarding") { icon = "person_add"; color = "#42A5F5"; bg = "#F3F9FE"; }
 
          if (!auto.is_enabled) {
            bg = "#EEEEEE";
            color = "#9E9E9E";
          }
 
          newNodes.push({
            id: autoNodeId,
            type: 'default',
            position: { x: rIdx * HORIZONTAL_SPACING, y: 100 + ((aIdx + 1) * VERTICAL_SPACING) },
            data: { 
              label: (
                <div className="flex flex-col items-start text-left p-1">
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-rounded text-base animate-pulse" style={{ color }}>{icon}</span>
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider" style={{ color }}>
                        {tr("automation.node" + auto.action_type.charAt(0).toUpperCase() + auto.action_type.slice(1))}
                      </span>
                    </div>
                    {!auto.is_enabled && (
                      <span className="text-[8px] font-bold text-[#757575] tracking-tight bg-white border border-[#E0E0E0] px-1 rounded">{tr("automation.disabled")}</span>
                    )}
                  </div>
                  
                  <div className="text-[13px] font-bold text-[#212121] leading-tight mb-1 truncate w-full">
                    {auto.criteria || tr("automation.anyTrigger")}
                  </div>
 
                  {auto.action_type === "assessment" && (
                    <div className="text-[10px] text-[#757575] font-semibold flex items-center gap-1">
                      <span className="material-symbols-rounded text-[10px]">topic</span>
                      {auto.topic || tr("automation.noTopic")} {tr("automation.qsCount", { count: auto.generated_questions?.length || 0 })}
                    </div>
                  )}
 
                  {auto.action_type === "interview" && (
                     <div className="text-[10px] text-[#757575] font-semibold flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">event</span>
                        {auto.interview_type} • {tr("automation.slotsSuffix", { count: auto.time_slots?.length || 0 })}
                     </div>
                  )}
 
                  {auto.action_type === "mail" && auto.template_id && (
                    <div className="text-[10px] text-[#757575] font-semibold flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">description</span>
                        {tr("automation.templateAction")}
                    </div>
                  )}
                </div>
              ) 
            },
            style: {
              background: bg,
              border: `1px solid ${color}35`,
              borderRadius: '12px',
              width: 190,
              opacity: auto.is_enabled ? 1 : 0.6,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0, 0.04)',
            },
            sourcePosition: 'bottom' as Position,
            targetPosition: 'top' as Position,
          });
 
          newEdges.push({
            id: `edge-${roundNodeId}-${autoNodeId}`,
            source: roundNodeId,
            target: autoNodeId,
            type: 'smoothstep',
            animated: auto.is_enabled,
            style: { stroke: color, strokeWidth: 1.5, strokeDasharray: '4' },
            sourceHandle: 'bottom',
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setAutomations(allAutomations);

    } finally {
      setLoading(false);
    }
  }, [token, authHeaders, jobs, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith("auto-") && canAccess("automation:moderate")) {
      // Correct ID extraction: skip "auto-" and the next segment (type)
      const parts = node.id.split("-");
      const type = parts[1] as "mail" | "assessment" | "interview" | "onboarding";
      const id = node.id.replace(`auto-${type}-`, "");
      
      setActiveNodeType(type);
      setEditingId(id);
      setIsModalOpen(true);
    }
  }, [canAccess]);

  const openCreateModal = (type: "mail" | "assessment" | "interview" | "onboarding") => {
    setEditingId(null);
    setActiveNodeType(type);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchAutomations(selectedJobId);
    } else {
      setNodes([]);
      setEdges([]);
      setAutomations([]);
    }
  }, [selectedJobId, fetchAutomations, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col bg-[#FDFEFF]">
      {/* Header (sticky) */}
      <div className="sticky top-0 z-20 px-6 py-3 border-b border-[#E0E0E0] flex-shrink-0 bg-[#F5F6F8]/95 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#212121] leading-tight">{tr("automation.canvasTitle")}</h1>
            <PageHelp title={tr("automation.canvasTitle")}>
              <p>{tr("automation.canvasHelp")}</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#757575] mt-0.5">{tr("automation.canvasSubtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => selectedJobId && fetchAutomations(selectedJobId)}
            disabled={loading || !selectedJobId}
            className="flex items-center gap-2 h-9 px-4 rounded-[4px] border border-[#E0E0E0] text-[#4F4F4F] hover:bg-[#FAFAFA] hover:text-[#212121] transition-all font-semibold text-[13px] bg-white shadow-sm disabled:opacity-50 active:scale-95 shrink-0"
          >
            <span className={`material-symbols-rounded text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {tr("automation.sync")}
          </button>

          <div className="flex items-center gap-2 relative">
            <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-lg pointer-events-none">work</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-64 h-9 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-10 text-[13px] font-semibold text-[#424242] hover:border-[#BBDEFB] hover:bg-[#FAFAFA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2] transition-all shadow-sm"
            >
              <option value="">{tr("automation.selectJobFlow")}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <span className="material-symbols-rounded absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-lg pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-slate-50/50 relative">
        {!selectedJobId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[4px] bg-[#E3F2FD] flex items-center justify-center mb-4 border border-[#BBDEFB]">
              <span className="material-symbols-rounded text-[#1976D2] text-3xl">account_tree</span>
            </div>
            <p className="text-[#212121] font-extrabold text-lg">{tr("automation.noJobSelected")}</p>
            <p className="text-[#757575] text-sm mt-1">{tr("automation.selectJobToViewCanvas")}</p>
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#1976D2] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#757575]">{tr("automation.loadingPipelines")}</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[4px] bg-[#FFF3E0] flex items-center justify-center mb-4 border border-[#FFE0B2]">
              <span className="material-symbols-rounded text-[#EF6C00] text-3xl">info</span>
            </div>
            <p className="text-[#212121] font-extrabold text-lg">{tr("automation.noStages")}</p>
            <p className="text-[#757575] text-sm mt-1">{tr("automation.noHiringRoundsYet")}</p>
          </div>
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              fitView
              minZoom={0.2}
              className="bg-slate-50"
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background color="#E0E0E0" gap={24} size={2} />
              <Controls className="bg-white shadow-md border-none rounded-xl overflow-hidden" />
            </ReactFlow>

            {/* Floating Actions */}
            {canAccess("automation:moderate") && (
              <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#757575] bg-white/90 border border-[#E0E0E0] px-2.5 py-1 rounded-[3px] shadow-sm pointer-events-auto">
                  {tr("automation.addAction")}
                </span>
                <div className="flex bg-white shadow-[0_12px_24px_rgba(0,0,0,0.08)] border border-[#E0E0E0] rounded-[4px] p-1 gap-1 pointer-events-auto">
                  <button onClick={() => openCreateModal("mail")} className="h-10 pl-2 pr-3 flex items-center gap-1.5 rounded-[4px] hover:bg-[#E3F2FD] text-[#1976D2] transition-colors" title={tr("automation.addMailAutomation")}>
                    <span className="material-symbols-rounded text-[20px]">mark_email_unread</span>
                    <span className="text-[12.5px] font-semibold">{tr("automation.nodeMail")}</span>
                  </button>
                  <button onClick={() => openCreateModal("assessment")} className="h-10 pl-2 pr-3 flex items-center gap-1.5 rounded-[4px] hover:bg-[#FFF3E0] text-[#EF6C00] transition-colors" title={tr("automation.addAssessmentAutomation")}>
                    <span className="material-symbols-rounded text-[20px]">psychology</span>
                    <span className="text-[12.5px] font-semibold">{tr("automation.nodeAssessment")}</span>
                  </button>
                  <button onClick={() => openCreateModal("interview")} className="h-10 pl-2 pr-3 flex items-center gap-1.5 rounded-[4px] hover:bg-[#E8F5E9] text-[#2E7D32] transition-colors" title={tr("automation.addInterviewAutomation")}>
                    <span className="material-symbols-rounded text-[20px]">event_available</span>
                    <span className="text-[12.5px] font-semibold">{tr("automation.nodeInterview")}</span>
                  </button>
                  <button onClick={() => openCreateModal("onboarding")} className="h-10 pl-2 pr-3 flex items-center gap-1.5 rounded-[4px] hover:bg-[#F3F9FE] text-[#42A5F5] transition-colors" title={tr("automation.addOnboardingAutomation")}>
                    <span className="material-symbols-rounded text-[20px]">person_add</span>
                    <span className="text-[12.5px] font-semibold">{tr("automation.nodeOnboarding")}</span>
                  </button>
                </div>
              </div>
            )}

            <AutomationNodeModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={() => fetchAutomations(selectedJobId)}
              jobId={selectedJobId}
              jobs={jobs}
              type={activeNodeType}
              editingId={editingId}
              initialData={initialData as React.ComponentProps<typeof AutomationNodeModal>["initialData"]}
            />
          </>
        )}
      </div>
    </div>
  );
}
