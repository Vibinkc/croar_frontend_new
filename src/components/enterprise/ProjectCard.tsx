"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Member {
    id: string;
    first_name: string;
    last_name: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    start_date: string;
    end_date: string;
    members: Member[];
}

interface ProjectCardProps {
    project: Project;
    canModerate: boolean;
    canDelete: boolean;
    onDelete: (id: string, name: string) => void;
}

export default function ProjectCard({ project, canModerate, canDelete, onDelete }: ProjectCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-100 p-1 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#7C3AED] group-hover:text-white transition-all shadow-inner">
                            <span className="material-symbols-rounded text-lg">folder_managed</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{project.status}</p>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none mt-1 uppercase truncate max-w-[140px] group-hover:text-[#7C3AED] transition-colors">{project.name}</h3>
                        </div>
                    </div>
                    
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {canModerate && (
                            <Link href={`/enterprise/projects/${project.id}`} className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#7C3AED] hover:border-[#7C3AED]/20 transition-all shadow-sm">
                                <span className="material-symbols-rounded text-base">edit</span>
                            </Link>
                        )}
                        {canDelete && (
                            <button 
                                onClick={() => onDelete(project.id, project.name)} 
                                className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm"
                            >
                                <span className="material-symbols-rounded text-base">delete</span>
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-[10px] font-bold text-slate-500 leading-snug uppercase tracking-tight line-clamp-2 h-8 opacity-70">
                    {project.description || "Operational parameters not specified."}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex -space-x-2">
                        {project.members.length > 0 ? project.members.slice(0, 3).map((m, i) => (
                            <div key={i} className="w-7 h-7 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-sm" title={`${m.first_name} ${m.last_name}`}>
                                {m.first_name[0]}
                            </div>
                        )) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Unit_Null</span>
                        )}
                        {project.members.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400 shadow-sm">
                                +{project.members.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Ends</p>
                        <p className="text-[9px] font-black text-slate-800 leading-none tabular-nums italic">{project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}</p>
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-2.5 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                <div className="flex items-center gap-1 opacity-40">
                    <span className="material-symbols-rounded text-xs">schedule</span>
                    <span className="text-[8px] font-black tracking-widest uppercase truncate">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <span className="text-[9px] font-black text-[#7C3AED] uppercase tracking-widest opacity-80 group-hover:opacity-100 group-hover:tracking-[0.2em] transition-all">Mission_Data</span>
            </div>
        </motion.div>
    );
}
