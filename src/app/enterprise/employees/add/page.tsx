"use client";

import React, { Suspense } from "react";
import EmployeeForm from "@/components/enterprise/EmployeeForm";
import { useSearchParams } from "next/navigation";

function AddEmployeeContent() {
    const searchParams = useSearchParams();
    const candidateId = searchParams.get("candidateId") || undefined;

    return <EmployeeForm candidateId={candidateId} />;
}

export default function AddEmployeePage() {
    return (
        <Suspense fallback={<div className="p-10 text-center font-bold text-slate-400 animate-pulse">Loading form...</div>}>
            <AddEmployeeContent />
        </Suspense>
    );
}
