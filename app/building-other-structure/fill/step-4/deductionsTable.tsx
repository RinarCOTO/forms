"use client";

import { Label } from "@/components/ui/label";
import { DynamicSelectGroup, SelectOption } from "@/components/dynamicSelectButton";

interface DeductionsTableProps {
  unitCost: number;
  totalFloorArea: number;
  depreciatedUnitCost: number;
  selections: (string | number | null)[];
  onSelectionChange: (newValues: (string | number | null)[]) => void;
  deductionChoices: SelectOption[];
  comments: string;
  onCommentsChange: (value: string) => void;
  error?: string;
}

export const DeductionsTable = ({
  totalFloorArea,
  depreciatedUnitCost,
  selections,
  onSelectionChange,
  deductionChoices,
  comments,
  onCommentsChange,
  error,
}: DeductionsTableProps) => {

  // Subtotal = total reproduction cost (main + all additions), passed directly as depreciatedUnitCost prop
  const subtotal = depreciatedUnitCost;

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-base font-semibold block text-foreground">DEDUCTIONS TABLE</Label>
        <div className="text-sm text-muted-foreground">
          Subtotal:{" "}
          <span className="font-mono font-medium text-foreground">
            ₱{formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {error && <p className="text-destructive text-sm mb-2">{error}</p>}

      <div className="space-y-4">
        <DynamicSelectGroup
          label="Deduction"
          options={deductionChoices}
          values={selections}
          onChange={onSelectionChange}
          unitCost={subtotal}
        />

        <div className="grid grid-row gap-4 mt-6">
          <div className="space-y-2">
            <Label>Overall Comments</Label>
            <textarea
              className="w-full min-h-25 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Add any additional notes here..."
              value={comments}
              onChange={(e) => onCommentsChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
