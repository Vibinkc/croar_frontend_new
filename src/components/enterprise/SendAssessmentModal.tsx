"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import SendTemplateModal from "./SendTemplateModal";

interface AssessmentTemplate {
    id: string;
    name: string;
    type: string;
    topic: string;
    question_count: number;
    email_template_id?: string;
    email_template_name?: string;
}

interface SendAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationIds: string[];
    token: string;
}

export default function SendAssessmentModal({ isOpen, onClose, applicationIds, token }: SendAssessmentModalProps) {
    const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && token) {
            fetchTemplates();
        }
    }, [isOpen, token]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplateId(data[0].id);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!selectedTemplateId) return;
        setIsSending(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/assessment-templates/bulk-send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    application_ids: applicationIds,
                    template_id: selectedTemplateId
                })
            });

            if (res.ok) {
                alert("Assessment sent successfully!");
                onClose();
            } else {
                alert("Failed to send assessment.");
            }
        } catch (e) {
            console.error(e);
            alert("Error sending assessment.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <SendTemplateModal<AssessmentTemplate>
            onClose={onClose}
            headerIcon="psychology"
            headerLabel={"SEND ASSESSMENT"}
            infoText={
                <>
                    Sending assessment to <span className="text-indigo-600">{applicationIds.length} candidate(s)</span>.
                    They will receive an email with the test link.
                </>
            }
            selectLabel="Select Assessment Template"
            listId="assessment-template-list"
            isLoading={isLoading}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            renderTemplateBody={(template) => (
                <>
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm">{template.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400   mt-0.5">
                                {template.type} • {template.topic}
                            </p>
                        </div>
                        {selectedTemplateId === template.id && (
                            <span className="material-icons text-indigo-600 text-sm">check_circle</span>
                        )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-2 py-0.5 rounded">
                            <span className="material-icons text-[12px]">list</span>
                            {template.question_count}{" Qs"}
                        </div>
                        {template.email_template_name && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/5 border border-[#7C3AED]/10 px-2 py-0.5 rounded">
                                <span className="material-icons text-[12px]">email</span>
                                {""}{template.email_template_name}
                            </div>
                        )}
                    </div>
                </>
            )}
            isSending={isSending}
            onSend={handleSend}
            sendingLabel={"SENDING..."}
            sendIcon="send"
            sendLabel={"SEND NOW"}
        />
    );
}
