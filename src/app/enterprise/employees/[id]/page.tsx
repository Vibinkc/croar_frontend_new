"use client";

import React from "react";
import EmployeeForm from "@/components/enterprise/EmployeeForm";
import { useParams } from "next/navigation";

export default function EditEmployeePage() {
    const params = useParams();
    const id = params.id as string;

    return <EmployeeForm employeeId={id} />;
}
