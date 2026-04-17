"use client";

import React from "react";
import Link from "next/link";
import { format } from "date-fns";

interface TaskCardProps {
    task: any;
    getStatusColor: (status: string) => string;
}

export default function TaskCard({ task, getStatusColor }: TaskCardProps) {
    return (
        <div className="group bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/enterprise/projects/${task.project_id}`}>
                    <span className="material-symbols-rounded p-1.5 bg-indigo-50 text-[#7C3AED] rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors text-base">open_in_new</span>
                </Link>
            </div>
            
            <div className="flex flex-col h-full space-y-3">
                <div className="space-y-1">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] font-black text-[#7C3AED] uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                            {task.project?.name || "Unlinked"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${getStatusColor(task.column)} shadow-sm`}>
                            {task.column}
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight group-hover:text-[#7C3AED] transition-colors uppercase tracking-tight truncate">{task.title}</h3>
                </div>

                <p className="text-slate-500 text-[10px] font-medium line-clamp-2 italic leading-relaxed opacity-70">
                    {task.description || "No description provided."}
                </p>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm">
                            {task.assignee ? task.assignee.first_name.charAt(0) : "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-700 leading-none">
                                {task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : "Unassigned"}
                            </span>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Assignee</span>
                        </div>
                    </div>

                    {task.due_date && (
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-rose-400 uppercase tracking-widest leading-none mb-0.5">Due_Date</span>
                            <span className="text-[9px] font-bold text-slate-700 tabular-nums">
                                {format(new Date(task.due_date), "MMM d, yy")}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
