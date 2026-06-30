"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "./Checkbox";

type TaxDecFooterProps = {
    taxable?: boolean;
    exempt?: boolean;
    effectivityOfAssessment?: string;
    amountInWords?: string;
    approvedDate?: string;
};

export const TaxDecFooter = ({
    taxable = false,
    exempt = false,
    effectivityOfAssessment,
    amountInWords,
    approvedDate,
}: TaxDecFooterProps) => {
    const [provincialAssessorName, setProvincialAssessorName] = useState("");

    const formatApprovedDate = (value?: string) => {
        if (!value) return "";
        const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        const month = date.getMonth() + 1;
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    useEffect(() => {
        fetch("/api/users/by-role?role=provincial_assessor")
            .then((res) => res.json())
            .then((data) => {
                if (data.users?.[0]?.full_name) {
                    setProvincialAssessorName(data.users[0].full_name);
                }
            });
    }, []);

    return (
        <div className="mt-4">
            {/* Amount in Words */}
            <div className="w-full flex gap-12 mb-2">
                <div>Amount in Words:</div>
                <div className="uppercase border-b border-black flex-1 text-center">
                    {amountInWords ? `${amountInWords} Pesos` : ""}
                </div>
            </div>

            {/* Taxable / Exempt / Effectivity */}
            <div className="grid grid-cols-4 items-center mb-4">
                <Checkbox label="Taxable" checked={taxable} />
                <Checkbox label="Exempt" checked={exempt} />
                <div>Effectivity of Assessment:</div>
                <div className="border-b border-black">
                    {effectivityOfAssessment ?? ""}
                </div>
            </div>

            {/* Signatures */}
            <div className="mt-6">Approved by:</div>
            <div className="grid grid-cols-2 mt-6">
                <div className="text-center">
                    <span className="inline-block border-b border-black w-40 mx-auto font-bold">
                        {provincialAssessorName || "Name of Provincial Assessor"}
                    </span>
                </div>
                <div className="text-center">
                    <span className="inline-block border-b border-black w-40 mx-auto font-bold">
                        {formatApprovedDate(approvedDate) || "\u00a0"}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 text-center mt-2">
                <div>Provincial Assessor</div>
                <div>Date Approved</div>
            </div>
        </div>
    );
};
