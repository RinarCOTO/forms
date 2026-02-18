"use client";

import React, { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { SelectOption } from "./additionalTable"; 

interface TotalDeductionTableProps {
  label?: string;
  unitCost: number;
  totalFloorArea: number;
  deductionSelections: (string | number | null)[];
  deductionOptions: SelectOption[];
  addPercentSelections: (string | number | null)[];
  addPercentAreas: number[];
  addPercentOptions: SelectOption[];
  addFlatSelections: (string | number | null)[];
  addFlatAreas: number[];
  addFlatOptions: SelectOption[];
}

interface CalculatedRow extends SelectOption {
  amount: number;
  appliedArea: number;
  rowType: "Standard" | "Add. Percent" | "Add. Flat";
  isDeduction: boolean; // Helper to style rows
}

export default function TotalDeductionTable({
  label = "Market Value Summary",
  unitCost,
  totalFloorArea,
  deductionSelections,
  deductionOptions,
  addPercentSelections,
  addPercentAreas,
  addPercentOptions,
  addFlatSelections,
  addFlatAreas,
  addFlatOptions,
}: TotalDeductionTableProps) {
  
  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const {
    standardRows,
    percentRows,
    flatRows,
    totalDeductions,
    totalAdditions,
    finalMarketValue,
    baseCost
  } = useMemo(() => {
    const sRows: CalculatedRow[] = [];
    const pRows: CalculatedRow[] = [];
    const fRows: CalculatedRow[] = [];

    let deductionSum = 0;
    let additionSum = 0;

    // 1. Standard Deductions (SUBTRACT)
    deductionSelections.forEach((id) => {
      if (!id) return;
      const opt = deductionOptions.find((o) => String(o.id) === String(id));
      if (!opt) return;

      // Standard usually applies to whole floor area
      let amount = 0;
      if (opt.percentage) {
        amount = (unitCost * (opt.percentage / 100)) * totalFloorArea;
      } else if (opt.pricePerSqm) {
        amount = opt.pricePerSqm * totalFloorArea;
      }
      deductionSum += amount;
      sRows.push({ ...opt, amount, appliedArea: totalFloorArea, rowType: "Standard", isDeduction: true });
    });

    // 2. Additional Percent Deviations (ADD)
    addPercentSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = addPercentOptions.find((o) => String(o.id) === String(id));
      if (!opt) return;

      const area = addPercentAreas[idx] || 0;
      const amount = ((unitCost * (opt.percentage || 0)) / 100) * area;
      
      additionSum += amount;
      pRows.push({ ...opt, amount, appliedArea: area, rowType: "Add. Percent", isDeduction: false });
    });

    // 3. Additional Flat Rate Deviations (ADD)
    addFlatSelections.forEach((id, idx) => {
      if (!id) return;
      const opt = addFlatOptions.find((o) => String(o.id) === String(id));
      if (!opt) return;

      const area = addFlatAreas[idx] || 0;
      const amount = (opt.pricePerSqm || 0) * area;

      additionSum += amount;
      fRows.push({ ...opt, amount, appliedArea: area, rowType: "Add. Flat", isDeduction: false });
    });

    const base = unitCost * totalFloorArea;
    // FORMULA: Base - Deductions + Additions
    const final = base - deductionSum + additionSum;

    return {
      standardRows: sRows,
      percentRows: pRows,
      flatRows: fRows,
      totalDeductions: deductionSum,
      totalAdditions: additionSum,
      baseCost: base,
      finalMarketValue: final,
    };
  }, [
    unitCost, totalFloorArea, deductionSelections, deductionOptions, 
    addPercentSelections, addPercentAreas, addPercentOptions, 
    addFlatSelections, addFlatAreas, addFlatOptions
  ]);

  // Helper to render rows
  const renderRows = (rows: CalculatedRow[]) => {
    return rows.map((row, i) => (
      <tr key={`${row.rowType}-${i}`} className="hover:bg-muted/10">
        <td className="px-4 py-2 text-muted-foreground">{row.rowType}</td>
        <td className="px-4 py-2 font-medium">
          {row.name}
          <span className="text-xs text-muted-foreground ml-1">
            {row.percentage ? `(${row.percentage}%)` : `(₱${row.pricePerSqm}/sqm)`}
          </span>
        </td>
        <td className="px-4 py-2 text-center">{row.appliedArea} sqm</td>
        <td className={`px-4 py-2 text-right font-medium ${row.isDeduction ? 'text-destructive' : 'text-emerald-600'}`}>
          {row.isDeduction ? '-' : '+'}₱{formatCurrency(row.amount)}
        </td>
      </tr>
    ));
  };

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm mt-8 border-l-4 border-l-primary">
      <h3 className="text-lg font-bold mb-4">{label}</h3>

      <div className="overflow-hidden rounded-md border border-border mb-4">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-center">Applied Area</th>
              <th className="px-4 py-2 text-right">Value Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {standardRows.length === 0 && percentRows.length === 0 && flatRows.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No items applied.</td></tr>
            )}
            {renderRows(standardRows)}
            {renderRows(percentRows)}
            {renderRows(flatRows)}
          </tbody>
        </table>
      </div>

      {/* SUMMARY CALCULATION BOX */}
      <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-md border">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Base Construction Cost:</span>
          <span>₱{formatCurrency(baseCost)}</span>
        </div>
        
        {totalDeductions > 0 && (
          <div className="flex justify-between items-center text-sm text-destructive">
            <span>Total Deductions:</span>
            <span>- ₱{formatCurrency(totalDeductions)}</span>
          </div>
        )}

        {totalAdditions > 0 && (
          <div className="flex justify-between items-center text-sm text-emerald-600">
            <span>Total Additions:</span>
            <span>+ ₱{formatCurrency(totalAdditions)}</span>
          </div>
        )}

        <Separator className="my-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total Market Value:</span>
          <span className="text-2xl font-bold text-primary">
            ₱{formatCurrency(finalMarketValue)}
          </span>
        </div>
      </div>
    </section>
  );
}