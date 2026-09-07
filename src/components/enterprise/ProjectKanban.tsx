"use client";

import React, { useState } from "react";
import { apiClient } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
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
    const { canAccess } = useAuth();
    const { t: tr } = useI18n();
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
        // Moving a task hits PATCH /projects/tasks/{id}, which the backend gates
        // on projects:update (not tasks:*). Match it so the UI and API agree.
        if (!canAccess("projects:update")) {
            e.preventDefault();
            return;
        }
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
                    role="button"
                    tabIndex={0}
                    className="flex-shrink-0 w-72 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            if (draggedTaskId) {
                                e.preventDefault();
                                handleMoveTask(draggedTaskId, col);
                                setDraggedTaskId(null);
                            }
                        }
                    }}
                >
                    {/* Column Header */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-white/50 rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[11px] font-black text-slate-900  ">{col}</h3>
                            <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-400 shadow-sm">
                                {tasks.filter(t => t.column === col).length}
                            </span>
                        </div>
                        {canAccess("projects:create") && (
                            <button
                                onClick={() => setIsAddingTask({ isOpen: true, column: col })}
                                className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-[#1E88E5] hover:border-[#1E88E5] transition-all flex items-center justify-center font-black"
                            >
                                <span className="material-symbols-rounded text-lg">add</span>
                            </button>
                        )}
                    </div>

                    {/* Task Cards */}
                    <div className="p-3 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar flex-1">
                        {tasks
                            .filter(t => t.column === col)
                            .map((task) => (
                                <div
                                    key={task.id}
                                    role="button"
                                    tabIndex={0}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            setDraggedTaskId((prev) => (prev === task.id ? null : task.id));
                                        }
                                    }}
                                    className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-[#1E88E5]/20 transition-all group active:scale-[0.98] cursor-grab ${draggedTaskId === task.id ? 'opacity-40 border-dashed border-[#1E88E5]/40' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-xs font-bold text-slate-800 leading-snug">{task.title}</h4>
                                        {canAccess("projects:delete") && (
                                            <button
                                                onClick={() => {
                                                    setTaskToDelete(task.id);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                            >
                                                <span className="material-symbols-rounded text-sm">delete</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                        {task.assignee ? (
                                            <div className="flex items-center gap-1.5" title={`${task.assignee.first_name} ${task.assignee.last_name}`}>
                                                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black ">
                                                    {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400  tracking-tight truncate max-w-[60px]">
                                                    {task.assignee.first_name}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-slate-300  tracking-tight">
                                                <span className="material-symbols-rounded text-[14px]">person_off</span>
                                                <span>{tr("forms.unassigned")}</span>
                                            </div>
                                        )}
                                        {task.due_date && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-rose-500/70  tracking-tight">
                                                <span className="material-symbols-rounded text-[14px]">calendar_today</span>
                                                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Move Logic (Fallback for Drag/Drop) */}
                                    {canAccess("projects:update") && (
                                        <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all overflow-x-auto no-scrollbar pt-1">
                                            {columns.filter(c => c !== col).map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => handleMoveTask(task.id, c)}
                                                    className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[8px] font-black text-slate-400 hover:text-[#1E88E5] hover:border-[#1E88E5] hover:bg-white transition-all whitespace-nowrap"
                                                >
                                                    {tr("forms.toColumn")} {c}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
                        role="button"
                        tabIndex={0}
                        aria-label={tr("common.close")}
                        className="absolute inset-0 bg-[#212121]/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsAddingTask({ isOpen: false, column: "" })}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setIsAddingTask({ isOpen: false, column: "" });
                            }
                        }}
                    />
                    
                    {/* Drawer Content */}
                    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-[#E0E0E0] flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[#E0E0E0] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[4px] bg-[#E3F2FD] text-[#1976D2] flex items-center justify-center border border-[#BBDEFB]/60 shrink-0">
                                    <span className="material-symbols-rounded text-[20px]">add_task</span>
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-bold text-[#212121] tracking-tight leading-tight">{tr("forms.addNewTask")}</h3>
                                    <p className="text-[12px] text-[#757575] mt-0.5">{tr("forms.columnLabel")} <span className="font-semibold text-[#1976D2]">{isAddingTask.column}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddingTask({ isOpen: false, column: "" })}
                                className="w-8 h-8 rounded-[4px] bg-white border border-[#E0E0E0] text-[#616161] hover:bg-[#F5F6F8] hover:text-[#424242] transition-all flex items-center justify-center shadow-sm shrink-0"
                            >
                                <span className="material-symbols-rounded text-[18px]">close</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            <form onSubmit={handleAddTask} id="add-task-form" className="space-y-5">
                                <div className="space-y-1.5">
                                    <label htmlFor="task-title" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.taskTitle")} <span className="text-rose-500">*</span></label>
                                    <input
                                        id="task-title"
                                        required
                                        value={newTaskData.title}
                                        onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] px-3.5 text-[14px] text-[#212121] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all placeholder:text-[#9E9E9E]"
                                        placeholder={tr("forms.taskTitlePlaceholder")}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="task-assignee" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.assignTo")}</label>
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[20px] pointer-events-none">person</span>
                                        <select
                                            id="task-assignee"
                                            value={newTaskData.employee_id}
                                            onChange={(e) => setNewTaskData(prev => ({ ...prev, employee_id: e.target.value }))}
                                            className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-9 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">{tr("forms.selectAssignee")}</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[20px] pointer-events-none">expand_more</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="task-due-date" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.dueDate")}</label>
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] text-[20px] pointer-events-none">calendar_month</span>
                                        <input
                                            id="task-due-date"
                                            type="date"
                                            value={newTaskData.due_date}
                                            onChange={(e) => setNewTaskData(prev => ({ ...prev, due_date: e.target.value }))}
                                            className="w-full h-10 bg-white border border-[#E0E0E0] rounded-[4px] pl-10 pr-3.5 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all cursor-pointer [color-scheme:light]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="task-description" className="text-[11.5px] font-bold text-[#757575] ml-0.5">{tr("forms.description")}</label>
                                    <textarea
                                        id="task-description"
                                        rows={5}
                                        value={newTaskData.description}
                                        onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-white border border-[#E0E0E0] rounded-[4px] p-3.5 text-[13.5px] text-[#424242] outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-[#1976D2]/15 transition-all resize-none leading-relaxed placeholder:text-[#9E9E9E]"
                                        placeholder={tr("forms.taskDescriptionPlaceholder")}
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-[#E0E0E0] bg-[#FAFAFA]/50 shrink-0">
                            <button
                                type="submit"
                                form="add-task-form"
                                className="w-full h-11 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-[4px] font-semibold text-[13.5px] shadow-[0_4px_12px_rgba(25,118,210,0.25)] transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-rounded text-[18px]">send</span>
                                {tr("forms.assignNotifyTeam")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteTask}
                title={tr("forms.deleteTaskTitle")}
                message={tr("forms.deleteTaskMessage")}
                confirmLabel={tr("forms.yesDelete")}
                cancelLabel={tr("forms.no")}
                isDestructive={true}
            />
        </div>
    );
}
