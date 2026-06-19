"use client";

import { useParams } from "next/navigation";
import JobForm from "@/components/enterprise/JobForm";

export default function EditJobPage() {
    const params = useParams();
    const jobId = params.id as string;
    return <JobForm mode="edit" jobId={jobId} />;
}
