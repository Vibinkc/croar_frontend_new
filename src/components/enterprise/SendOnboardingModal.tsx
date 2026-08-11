"use client";

import React, { useState, useEffect } from "react";
import { BACKEND_URL } from "@/utils/api";
import SendTemplateModal from "./SendTemplateModal";
import { useI18n } from "@/context/I18nContext";

interface OnboardingTemplate {
    id: string;
    name: string;
    description?: string;
}

interface SendOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationIds: string[];
    token: string;
}

export default function SendOnboardingModal({ isOpen, onClose, applicationIds, token }: SendOnboardingModalProps) {
    const { t: tr } = useI18n();
    const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
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
            const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/templates/`, {
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
        let successCount = 0;
        try {
            // Check if there's a bulk endpoint, otherwise loop
            for (const id of applicationIds) {
                const res = await fetch(`${BACKEND_URL}/api/v1/enterprise/onboarding/initiate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        application_id: id,
                        template_id: selectedTemplateId
                    })
                });
                if (res.ok) successCount++;
            }
            alert(tr("sharedUi.onboardingInitiatedSuccess", { count: successCount }));
            onClose();
            // Refresh parent state if needed (user might need to refresh manually or we can trigger a refresh)
            window.location.reload();
        } catch (e) {
            console.error(e);
            alert(tr("sharedUi.errorInitiatingOnboarding"));
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <SendTemplateModal<OnboardingTemplate>
            onClose={onClose}
            headerIcon="person_add"
            headerLabel={tr("sharedUi.initiateOnboarding")}
            infoText={
                <>
                    {tr("sharedUi.initiatingOnboardingFor")} <span className="text-indigo-600">{tr("sharedUi.nCandidates", { count: applicationIds.length })}</span>.
                    {" "}{tr("sharedUi.selectTemplateToUse")}
                </>
            }
            selectLabel={tr("sharedUi.selectOnboardingTemplate")}
            listId="onboarding-template-list"
            isLoading={isLoading}
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={setSelectedTemplateId}
            renderTemplateBody={(template) => (
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-800 text-sm">{template.name}</h4>
                        {template.description && (
                            <p className="text-[10px] font-bold text-slate-400   mt-0.5">
                                {template.description}
                            </p>
                        )}
                    </div>
                    {selectedTemplateId === template.id && (
                        <span className="material-icons text-indigo-600 text-sm">check_circle</span>
                    )}
                </div>
            )}
            isSending={isSending}
            onSend={handleSend}
            sendingLabel={tr("sharedUi.initiating")}
            sendIcon="bolt"
            sendLabel={tr("sharedUi.initiateNow")}
        />
    );
}
