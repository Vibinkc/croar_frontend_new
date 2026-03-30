"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface DivisionContextType {
    selectedDivisionId: number | null;
    setSelectedDivisionId: (id: number | null) => void;
    selectedDepartmentId: number | null;
    setSelectedDepartmentId: (id: number | null) => void;
    selectedBatch: string | null;
    setSelectedBatch: (batch: string | null) => void;
}

const DivisionContext = createContext<DivisionContextType | undefined>(undefined);

export function DivisionProvider({ children }: { children: ReactNode }) {
    const [selectedDivisionId, setSelectedDivisionId] = useState<number | null>(null);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

    return (
        <DivisionContext.Provider value={{
            selectedDivisionId, setSelectedDivisionId,
            selectedDepartmentId, setSelectedDepartmentId,
            selectedBatch, setSelectedBatch
        }}>
            {children}
        </DivisionContext.Provider>
    );
}

export function useDivision() {
    const context = useContext(DivisionContext);
    if (context === undefined) {
        throw new Error("useDivision must be used within a DivisionProvider");
    }
    return context;
}
