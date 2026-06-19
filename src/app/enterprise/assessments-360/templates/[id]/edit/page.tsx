import { use } from "react";
import X360TemplateForm from "@/components/enterprise/X360TemplateForm";

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <X360TemplateForm mode="edit" templateId={id} />;
}
