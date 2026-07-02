"use client";

import BuildingStructureForm from "@/app/components/forms/RPFAAS/building_structure_form";
import LandImprovementForm from "@/app/components/forms/RPFAAS/land_improvement_form";

interface Props {
  serverData: Record<string, any>;
  formType?: "building" | "land";
}

export default function ReviewFaasOverlay({ serverData, formType = "building" }: Props) {
  return (
    <div className="relative overflow-auto h-full bg-white" style={{ padding: "12px 16px" }}>
      {formType === "land" ? (
        <LandImprovementForm data={serverData} />
      ) : (
        <BuildingStructureForm serverData={serverData} />
      )}
    </div>
  );
}
