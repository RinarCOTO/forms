"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DynamicSelectGroup, SelectOption } from "@/components/dynamicSelectButton";

interface DeductionsTableProps {
  unitCost: number;
  totalFloorArea: number;
  selections: (string | number | null)[];
  onSelectionChange: (newValues: (string | number | null)[]) => void;
  deductionChoices: SelectOption[];
  // New props for handling comments
  comments: string; 
  onCommentsChange: (value: string) => void;
  error?: string;
}

export const DeductionsTable = ({
  unitCost,
  totalFloorArea,
  selections,
  onSelectionChange,
  deductionChoices,
  comments,
  onCommentsChange,
  error,
}: DeductionsTableProps) => {
  
  // Calculate subtotal: unit cost × total floor area
  const subtotal = unitCost * totalFloorArea;
  
  // Logic inside the component for display
  const totalPercentage = selections.reduce<number>((acc, curr) => {
    const option = deductionChoices.find((c) => String(c.id) === String(curr));
    return acc + (option?.percentage || 0);
  }, 0);

  const totalDeductionValue = (subtotal * totalPercentage) / 100;
  const netUnitCost = subtotal - totalDeductionValue;

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-base font-semibold block">DEDUCTIONS TABLE</Label>
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
              className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Add any additional notes here..."
              value={comments} // Controlled value
              onChange={(e) => onCommentsChange(e.target.value)} // Update parent
            />
          </div>

          {/* Summary Calculation Box */}
          <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-md border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Deduction %:</span>
              <span className="font-bold">{totalPercentage}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Deduction Value:</span>
              <span className="font-bold text-destructive">
                - ₱{formatCurrency(totalDeductionValue)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Cost of Deduction:</span>
              <span className="text-xl font-bold text-primary">
                ₱{formatCurrency(netUnitCost)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};