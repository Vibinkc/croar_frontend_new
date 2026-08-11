"use client";

import React, { Suspense } from "react";
import EmployeeForm from "@/components/enterprise/EmployeeForm";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/context/I18nContext";

function AddEmployeeContent() {
    const searchParams = useSearchParams();
    const candidateId = searchParams.get("candidateId") || undefined;

    return <EmployeeForm candidateId={candidateId} />;
}

export default function AddEmployeePage() {
    const { t: tr } = useI18n();
    return (
        <Suspense fallback={<div className="p-10 text-center font-bold text-slate-400 animate-pulse">{tr("general.loadingForm")}</div>}>
            <AddEmployeeContent />
        </Suspense>
    );
}
