"use client";

import { use } from "react";
import SurveyTemplateForm from "@/components/enterprise/SurveyTemplateForm";

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <SurveyTemplateForm mode="edit" templateId={id} />;
}
