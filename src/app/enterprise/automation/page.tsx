"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
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
        { type: "mail", url: `${BACKEND_URL}/api/v1/enterprise/automation/mail/?job_id=${jobId}` },
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
                <span className="text-[10px] font-bold text-[#5B53E0] uppercase tracking-wider">Round {rIdx + 1}</span>
                <span className="font-bold text-[#15171C] text-[13.5px] mt-0.5">{round.name}</span>
              </div>
            ) 
          },
          style: {
            background: '#fff',
            border: '1.5px solid #5B53E0',
            borderRadius: '12px',
            boxShadow: '0 4px 14px 0 rgba(91, 83, 224, 0.08)',
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
            style: { stroke: '#E8EAED', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#E8EAED' },
          });
        }
 
        // Find automations for this round
        const roundIndex = rIdx + 1;
        const roundAutomations = allAutomations.filter(a => a.stage_index === roundIndex);
 
        roundAutomations.forEach((auto, aIdx) => {
          const autoNodeId = `auto-${auto.action_type}-${auto.id}`;
          
          let icon = "mail";
          let color = "#3b82f6";
          let bg = "#eff6ff";
          if (auto.action_type === "mail") { icon = "mark_email_unread"; color = "#5B53E0"; bg = "#ECEBFB"; }
          if (auto.action_type === "assessment") { icon = "psychology"; color = "#D97706"; bg = "#FEF3E2"; }
          if (auto.action_type === "interview") { icon = "event_available"; color = "#0E8A6E"; bg = "#E3F4EF"; }
          if (auto.action_type === "onboarding") { icon = "person_add"; color = "#8B5CF6"; bg = "#F5F3FF"; }
 
          if (!auto.is_enabled) {
            bg = "#F1F2F5";
            color = "#9AA3AF";
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
                        {auto.action_type}
                      </span>
                    </div>
                    {!auto.is_enabled && (
                      <span className="text-[8px] font-bold text-[#8A929E] tracking-tight bg-white border border-[#E8EAED] px-1 rounded">Disabled</span>
                    )}
                  </div>
                  
                  <div className="text-[13px] font-bold text-[#15171C] leading-tight mb-1 truncate w-full">
                    {auto.criteria || "Any trigger"}
                  </div>
 
                  {auto.action_type === "assessment" && (
                    <div className="text-[10px] text-[#8A929E] font-semibold flex items-center gap-1">
                      <span className="material-symbols-rounded text-[10px]">topic</span>
                      {auto.topic || "No topic"} ({auto.generated_questions?.length || 0} Qs)
                    </div>
                  )}
 
                  {auto.action_type === "interview" && (
                     <div className="text-[10px] text-[#8A929E] font-semibold flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">event</span>
                        {auto.interview_type} • {auto.time_slots?.length || 0} slots
                     </div>
                  )}
 
                  {auto.action_type === "mail" && auto.template_id && (
                    <div className="text-[10px] text-[#8A929E] font-semibold flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">description</span>
                        {"Template Action"}
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
              boxShadow: '0 4px 12px rgba(21, 23, 28, 0.04)',
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
    <div className="w-full h-full flex flex-col bg-[#FDFDFF]">
      {/* Header (sticky) */}
      <div className="sticky top-0 z-20 px-6 py-3 border-b border-[#E8EAED] flex-shrink-0 bg-[#F4F5F7]/95 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Automation Canvas</h1>
            <PageHelp title="Automation Canvas">
              <p>Build no-code recruiting workflows visually &mdash; add steps and connect them.</p>
            </PageHelp>
          </div>
          <p className="text-[12.5px] text-[#8A929E] mt-0.5">Visualize and build your automated hiring pipelines</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => selectedJobId && fetchAutomations(selectedJobId)}
            disabled={loading || !selectedJobId}
            className="flex items-center gap-2 h-9 px-4 rounded-[10px] border border-[#E8EAED] text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#15171C] transition-all font-semibold text-[13px] bg-white shadow-sm disabled:opacity-50 active:scale-95 shrink-0"
          >
            <span className={`material-symbols-rounded text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            SYNC
          </button>

          <div className="flex items-center gap-2 relative">
            <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-lg pointer-events-none">work</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-64 h-9 bg-white border border-[#E1E4E8] rounded-[10px] pl-10 pr-10 text-[13px] font-semibold text-[#374151] hover:border-[#DAD7F6] hover:bg-[#F7F8FA] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#5B53E0]/20 focus:border-[#5B53E0] transition-all shadow-sm"
            >
              <option value="">Select a Job to view flow...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <span className="material-symbols-rounded absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9AA3AF] text-lg pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-slate-50/50 relative">
        {!selectedJobId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[18px] bg-[#ECEBFB] flex items-center justify-center mb-4 border border-[#DAD7F6]">
              <span className="material-symbols-rounded text-[#5B53E0] text-3xl">account_tree</span>
            </div>
            <p className="text-[#15171C] font-extrabold text-lg">No job selected</p>
            <p className="text-[#8A929E] text-sm mt-1">Select a job from the dropdown to view its automation canvas.</p>
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#5B53E0] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#8A929E]">Loading pipelines...</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-[18px] bg-[#FEF3E2] flex items-center justify-center mb-4 border border-[#FCE1BF]">
              <span className="material-symbols-rounded text-[#D97706] text-3xl">info</span>
            </div>
            <p className="text-[#15171C] font-extrabold text-lg">No hiring stages configured</p>
            <p className="text-[#8A929E] text-sm mt-1">This job has no hiring rounds configured yet.</p>
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
              <Background color="#E8EAED" gap={24} size={2} />
              <Controls className="bg-white shadow-md border-none rounded-xl overflow-hidden" />
            </ReactFlow>

            {/* Floating Actions */}
            {canAccess("automation:moderate") && (
              <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2 pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A929E] bg-white/90 border border-[#E8EAED] px-2.5 py-1 rounded-[6px] shadow-sm pointer-events-auto">
                  Add Action
                </span>
                <div className="flex bg-white shadow-[0_12px_24px_rgba(21,23,28,0.08)] border border-[#E8EAED] rounded-[12px] p-1 gap-1 pointer-events-auto">
                  <button onClick={() => openCreateModal("mail")} className="w-10 h-10 flex items-center justify-center rounded-[9px] hover:bg-[#ECEBFB] text-[#5B53E0] transition-colors" title="Add Mail Automation">
                    <span className="material-symbols-rounded text-[20px]">mark_email_unread</span>
                  </button>
                  <button onClick={() => openCreateModal("assessment")} className="w-10 h-10 flex items-center justify-center rounded-[9px] hover:bg-[#FEF3E2] text-[#D97706] transition-colors" title="Add Assessment Automation">
                    <span className="material-symbols-rounded text-[20px]">psychology</span>
                  </button>
                  <button onClick={() => openCreateModal("interview")} className="w-10 h-10 flex items-center justify-center rounded-[9px] hover:bg-[#E3F4EF] text-[#0E8A6E] transition-colors" title="Add Interview Automation">
                    <span className="material-symbols-rounded text-[20px]">event_available</span>
                  </button>
                  <button onClick={() => openCreateModal("onboarding")} className="w-10 h-10 flex items-center justify-center rounded-[9px] hover:bg-[#F5F3FF] text-[#8B5CF6] transition-colors" title="Add Onboarding Automation">
                    <span className="material-symbols-rounded text-[20px]">person_add</span>
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
