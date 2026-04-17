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
} from "reactflow";
import "reactflow/dist/style.css";
import AutomationNodeModal from "./AutomationNodeModal";

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
  // specific metadata could be here
  template_id?: string;
  is_immediate?: boolean;
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
        { type: "mail", url: `${BACKEND_URL}/api/v1/enterprise/automation/mail?job_id=${jobId}` },
        { type: "assessment", url: `${BACKEND_URL}/api/v1/enterprise/assessment/?job_id=${jobId}` },
        { type: "interview", url: `${BACKEND_URL}/api/v1/enterprise/interview-automation/?job_id=${jobId}` },
        { type: "onboarding", url: `${BACKEND_URL}/api/v1/enterprise/onboarding-automation/?job_id=${jobId}` },
      ];

      const responses = await Promise.all(
        endpoints.map(ep => fetch(ep.url, { headers: authHeaders }).then(r => r.ok ? r.json() : []).catch(() => []))
      );

      let allAutomations: any[] = [];
      endpoints.forEach((ep, idx) => {
        const data = responses[idx];
        if (Array.isArray(data)) {
          allAutomations = [
            ...allAutomations,
            ...data
              .filter((d: any) => !d.job_requirement_id || String(d.job_requirement_id) === String(jobId))
              .map((d: any) => ({ ...d, action_type: ep.type as any })),
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
                <span className="text-[10px] uppercase font-bold text-[#7C3AED]">Round {rIdx + 1}</span>
                <span className="font-bold text-slate-800">{round.name}</span>
              </div>
            ) 
          },
          style: {
            background: '#fff',
            border: '2px solid #7C3AED',
            borderRadius: '12px',
            boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.1)',
            width: 180,
          },
          sourcePosition: 'right' as any,
          targetPosition: 'left' as any,
        });

        // Connect to previous round
        if (rIdx > 0) {
          newEdges.push({
            id: `edge-round-${rIdx}-to-${rIdx + 1}`,
            source: `round-${rIdx}`,
            target: roundNodeId,
            type: 'smoothstep',
            style: { stroke: '#cbd5e1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' },
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
          if (auto.action_type === "mail") { icon = "mark_email_unread"; color = "#6366f1"; bg = "#eef2ff"; }
          if (auto.action_type === "assessment") { icon = "psychology"; color = "#f59e0b"; bg = "#fffbeb"; }
          if (auto.action_type === "interview") { icon = "event_available"; color = "#10b981"; bg = "#ecfdf5"; }
          if (auto.action_type === "onboarding") { icon = "person_add"; color = "#a855f7"; bg = "#faf5ff"; }

          if (!auto.is_enabled) {
            bg = "#f8fafc";
            color = "#94a3b8";
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
                      <span className="material-symbols-rounded text-base" style={{ color }}>{icon}</span>
                      <span className="text-[9px] uppercase font-black tracking-wider" style={{ color }}>
                        {auto.action_type}
                      </span>
                    </div>
                    {!auto.is_enabled && (
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight bg-slate-100 px-1 rounded">Disabled</span>
                    )}
                  </div>
                  
                  <div className="text-[11px] font-bold text-slate-800 leading-tight mb-1 truncate w-full">
                    {auto.criteria || "Any trigger"}
                  </div>

                  {auto.action_type === "assessment" && (
                    <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                      <span className="material-symbols-rounded text-[10px]">topic</span>
                      {auto.topic || "No topic"} ({auto.generated_questions?.length || 0} Qs)
                    </div>
                  )}

                  {auto.action_type === "interview" && (
                     <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">event</span>
                        {auto.interview_type} • {auto.time_slots?.length || 0} slots
                     </div>
                  )}

                  {auto.action_type === "mail" && auto.template_id && (
                    <div className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                        <span className="material-symbols-rounded text-[10px]">description</span>
                        Template Action
                    </div>
                  )}
                </div>
              ) 
            },
            style: {
              background: bg,
              border: `1px solid ${color}40`,
              borderRadius: '8px',
              width: 190,
              opacity: auto.is_enabled ? 1 : 0.6,
              cursor: 'pointer',
            },
            sourcePosition: 'bottom' as any,
            targetPosition: 'top' as any,
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
      const type = parts[1];
      const id = node.id.replace(`auto-${type}-`, "");
      
      setActiveNodeType(type as any);
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
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 bg-white shadow-sm z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-[#7C3AED] text-xl">account_tree</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Automation Canvas</h1>
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
              Visualize and build your automated hiring pipelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => selectedJobId && fetchAutomations(selectedJobId)}
            disabled={loading || !selectedJobId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-[11px] bg-white shadow-sm disabled:opacity-50"
          >
            <span className={`material-symbols-rounded text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            SYNC
          </button>

          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-slate-400 text-base">work</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-56 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] shadow-sm"
            >
              <option value="">Select a Job to view flow...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-slate-50/50 relative">
        {!selectedJobId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#7C3AED]/5 flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-[#7C3AED] text-4xl">account_tree</span>
            </div>
            <p className="text-slate-700 font-bold text-lg">No job selected</p>
            <p className="text-slate-400 text-sm mt-1">Select a job from the dropdown to view its automation canvas.</p>
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Loading pipelines...</p>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-slate-500 font-bold">This job has no hiring rounds configured.</p>
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
              <Background color="#cbd5e1" gap={24} size={2} />
              <Controls className="bg-white shadow-md border-none rounded-xl overflow-hidden" />
            </ReactFlow>

            {/* Floating Actions */}
            {canAccess("automation:moderate") && (
              <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2 pointer-events-none">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-auto shadow-sm">
                  Add Action Node
                </span>
                <div className="flex bg-white shadow-xl border border-slate-100 rounded-xl p-1 gap-1 pointer-events-auto">
                  <button onClick={() => openCreateModal("mail")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-indigo-500 transition-colors" title="Add Mail Automation">
                    <span className="material-symbols-rounded text-[20px]">mark_email_unread</span>
                  </button>
                  <button onClick={() => openCreateModal("assessment")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-amber-50 text-amber-500 transition-colors" title="Add Assessment Automation">
                    <span className="material-symbols-rounded text-[20px]">psychology</span>
                  </button>
                  <button onClick={() => openCreateModal("interview")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors" title="Add Interview Automation">
                    <span className="material-symbols-rounded text-[20px]">event_available</span>
                  </button>
                  <button onClick={() => openCreateModal("onboarding")} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-500 transition-colors" title="Add Onboarding Automation">
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
              initialData={initialData}
            />
          </>
        )}
      </div>
    </div>
  );
}
