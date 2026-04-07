"use client";

import React, { useState } from "react";
import { apiClient } from "@/utils/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";

interface Member {
    id: string;
    first_name: string;
    last_name: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    column: string;
    status: string;
    due_date?: string | null;
    assignee?: Member;
    employee_id?: string | null;
}

interface ProjectKanbanProps {
    projectId: string;
    columns: string[];
    tasks: Task[];
    members: Member[];
    onRefresh: () => void;
}

export default function ProjectKanban({ projectId, columns, tasks, members, onRefresh }: ProjectKanbanProps) {
    const [isAddingTask, setIsAddingTask] = useState<{ isOpen: boolean; column: string }>({ isOpen: false, column: "" });
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [newTaskData, setNewTaskData] = useState({
        title: "",
        description: "",
        employee_id: "",
        due_date: ""
    });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
        // Optional: add a drag image or custom data if needed
        e.dataTransfer.setData("text/plain", taskId);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, column: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
        if (taskId) {
            handleMoveTask(taskId, column);
        }
        setDraggedTaskId(null);
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiClient.request(`/api/v1/enterprise/projects/${projectId}/tasks`, {
                method: "POST",
                body: JSON.stringify({
                    ...newTaskData,
                    column: isAddingTask.column,
                    due_date: newTaskData.due_date || null
                })
            });
            if (res.ok) {
                onRefresh();
                setIsAddingTask({ isOpen: false, column: "" });
                setNewTaskData({ title: "", description: "", employee_id: "", due_date: "" });
            }
        } catch (e) {
            console.error("Error adding task:", e);
        }
    };

    const handleMoveTask = async (taskId: string, newColumn: string) => {
        try {
            const res = await apiClient.request(`/api/v1/enterprise/projects/tasks/${taskId}`, {
                method: "PATCH",
                body: JSON.stringify({ column: newColumn })
            });
            if (res.ok) onRefresh();
        } catch (e) {
            console.error("Error moving task:", e);
        }
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            const res = await apiClient.delete(`/api/v1/enterprise/projects/tasks/${taskToDelete}`);
            if (res.ok) onRefresh();
        } catch (e) {
            console.error("Error deleting task:", e);
        } finally {
            setIsDeleteModalOpen(false);
            setTaskToDelete(null);
        }
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px] custom-scrollbar">
            {columns.map((col) => (
                <div 
                    key={col} 
                    className="flex-shrink-0 w-72 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/50 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{col}</h3>
                            <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 shadow-sm">
                                {tasks.filter(t => t.column === col).length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsAddingTask({ isOpen: true, column: col })}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#7C3AED] hover:border-[#7C3AED] transition-all flex items-center justify-center font-black"
                        >
                            <span className="material-symbols-rounded text-lg">add</span>
                        </button>
                    </div>

                    {/* Task Cards */}
                    <div className="p-3 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar flex-1">
                        {tasks
                            .filter(t => t.column === col)
                            .map((task) => (
                                <div 
                                    key={task.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#7C3AED]/20 transition-all group active:scale-[0.98] cursor-grab ${draggedTaskId === task.id ? 'opacity-40 border-dashed border-[#7C3AED]/40' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-xs font-bold text-slate-800 leading-snug">{task.title}</h4>
                                        <button 
                                            onClick={() => {
                                                setTaskToDelete(task.id);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                        >
                                            <span className="material-symbols-rounded text-sm">delete</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                        {task.assignee ? (
                                            <div className="flex items-center gap-1.5" title={`${task.assignee.first_name} ${task.assignee.last_name}`}>
                                                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black uppercase">
                                                    {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate max-w-[60px]">
                                                    {task.assignee.first_name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 uppercase tracking-tight">
                                                <span className="material-symbols-rounded text-[14px]">person_off</span>
                                                Unassigned
                                            </div>
                                        )}
                                        {task.due_date && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-rose-500/70 uppercase tracking-tight">
                                                <span className="material-symbols-rounded text-[14px]">calendar_today</span>
                                                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Move Logic (Fallback for Drag/Drop) */}
                                    <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all overflow-x-auto no-scrollbar pt-1">
                                        {columns.filter(c => c !== col).map(c => (
                                            <button
                                                key={c}
                                                onClick={() => handleMoveTask(task.id, c)}
                                                className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[8px] font-black text-slate-400 hover:text-[#7C3AED] hover:border-[#7C3AED] hover:bg-white transition-all whitespace-nowrap"
                                            >
                                                To {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            ))}

            {/* Add Task Drawer */}
            {isAddingTask.isOpen && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
                        onClick={() => setIsAddingTask({ isOpen: false, column: "" })}
                    />
                    
                    {/* Drawer Content */}
                    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
                        <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
                            <div className="p-8 pb-32">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New Task</h3>
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 bg-indigo-50 px-2 py-0.5 rounded-full inline-block italic">
                                            Column: {isAddingTask.column}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingTask({ isOpen: false, column: "" })} 
                                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all hover:rotate-90"
                                    >
                                        <span className="material-symbols-rounded">close</span>
                                    </button>
                                </div>

                                <form onSubmit={handleAddTask} id="add-task-form" className="space-y-6">
                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title*</label>
                                        <input
                                            required
                                            value={newTaskData.title}
                                            onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm"
                                            placeholder="What needs to be done?"
                                        />
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign To</label>
                                        <div className="relative">
                                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                                            <select
                                                value={newTaskData.employee_id}
                                                onChange={(e) => setNewTaskData(prev => ({ ...prev, employee_id: e.target.value }))}
                                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:ring-0 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Assignee</option>
                                                {members.map(m => (
                                                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                                        <div className="relative">
                                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">calendar_month</span>
                                            <input
                                                type="date"
                                                value={newTaskData.due_date}
                                                onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                                                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm cursor-pointer [color-scheme:light]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                        <textarea
                                            rows={5}
                                            value={newTaskData.description}
                                            onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm resize-none italic"
                                            placeholder="Provide any additional details or context for this task..."
                                        />
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-8 bg-white border-t border-slate-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] shrink-0">
                            <button
                                type="submit"
                                form="add-task-form"
                                className="w-full bg-[#7C3AED] text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#6D28D9] shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-md flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-rounded text-lg">send</span>
                                Assign & Notify Team
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTask}
                title="Delete Task?"
                message="Are you sure you want to delete this task? All progress will be lost."
                confirmLabel="Yes, Delete"
                cancelLabel="No"
                isDestructive={true}
            />
        </div>
    );
}
