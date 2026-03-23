"use client";

import { useMemo, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MinusIcon, PlusIcon, ChevronDown } from "lucide-react";
import { Button, Group, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button as ShadButton } from "@/components/ui/button";
import { SelectOption as BaseSelectOption } from "@/components/dynamicSelectButton";

export interface SelectOption extends BaseSelectOption {
  pricePerSqm?: number;
}

interface DeductionsTableProps {
  selections: (string | number | null)[];
  onSelectionChange: (newValues: (string | number | null)[]) => void;
  quantities: number[];
  onQuantitiesChange: (newQuantities: number[]) => void;
  deductionChoices: SelectOption[];
  error?: string;
}

interface TotalImprovementsProps {
  label?: string;
  unitCost: number;
  totalArea: number;
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
  isDeduction: boolean;
}

export default function TotalImprovements({
  label = "Market Value Summary",
  unitCost,
  totalArea,
  deductionSelections,
  deductionOptions,
  addPercentSelections,
  addPercentAreas,
  addPercentOptions,
  addFlatSelections,
  addFlatAreas,
  addFlatOptions,
}: TotalImprovementsProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { standardRows, percentRows, flatRows, totalDeductions, totalAdditions, finalMarketValue, baseCost } =
    useMemo(() => {
      const sRows: CalculatedRow[] = [];
      const pRows: CalculatedRow[] = [];
      const fRows: CalculatedRow[] = [];
      let deductionSum = 0;
      let additionSum = 0;

      deductionSelections.forEach((id) => {
        if (!id) return;
        const opt = deductionOptions.find((o) => String(o.id) === String(id));
        if (!opt) return;
        let amount = 0;
        if (opt.percentage) amount = (unitCost * (opt.percentage / 100)) * totalArea;
        else if (opt.pricePerSqm) amount = opt.pricePerSqm * totalArea;
        deductionSum += amount;
        sRows.push({ ...opt, amount, appliedArea: totalArea, rowType: "Standard", isDeduction: true });
      });

      addPercentSelections.forEach((id, idx) => {
        if (!id) return;
        const opt = addPercentOptions.find((o) => String(o.id) === String(id));
        if (!opt) return;
        const area = addPercentAreas[idx] || 0;
        const amount = ((unitCost * (opt.percentage || 0)) / 100) * area;
        additionSum += amount;
        pRows.push({ ...opt, amount, appliedArea: area, rowType: "Add. Percent", isDeduction: false });
      });

      addFlatSelections.forEach((id, idx) => {
        if (!id) return;
        const opt = addFlatOptions.find((o) => String(o.id) === String(id));
        if (!opt) return;
        const area = addFlatAreas[idx] || 0;
        const amount = (opt.pricePerSqm || 0) * area;
        additionSum += amount;
        fRows.push({ ...opt, amount, appliedArea: area, rowType: "Add. Flat", isDeduction: false });
      });

      const base = unitCost * totalArea;
      return {
        standardRows: sRows,
        percentRows: pRows,
        flatRows: fRows,
        totalDeductions: deductionSum,
        totalAdditions: additionSum,
        baseCost: base,
        finalMarketValue: base - deductionSum + additionSum,
      };
    }, [unitCost, totalArea, deductionSelections, deductionOptions, addPercentSelections, addPercentAreas, addPercentOptions, addFlatSelections, addFlatAreas, addFlatOptions]);

  const renderRows = (rows: CalculatedRow[], showArea = true) =>
    rows.map((row, i) => (
      <tr key={`${row.rowType}-${i}`} className="hover:bg-(--chart-2)/10">
        <td className="px-4 py-2 font-medium">
          {row.name}
          <span className="text-xs text-muted-foreground ml-1">
            {row.percentage ? `(${row.percentage}%)` : `(₱${row.pricePerSqm}/sqm)`}
          </span>
        </td>
        {showArea && <td className="px-4 py-2 text-center">{row.appliedArea} sqm</td>}
        <td className={`px-4 py-2 text-right font-medium ${row.isDeduction ? "text-destructive" : "text-emerald-600"}`}>
          {row.isDeduction ? "-" : "+"}₱{formatCurrency(row.amount)}
        </td>
      </tr>
    ));

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm mt-8 border-l-4 border-l-primary">
      <h3 className="text-lg font-bold mb-4">{label}</h3>

      <div className="mb-1 font-semibold text-base text-muted-foreground">Deductions</div>
      <div className="overflow-hidden rounded-md border border-border mb-4">
        <table className="w-full text-sm">
          <thead className="bg-primary/10">
            <tr>
              <th className="px-4 py-2 text-left text-gray-800 font-bold">Description</th>
              <th className="px-4 py-2 text-center text-gray-800 font-bold">Applied Area</th>
              <th className="px-4 py-2 text-right text-gray-800 font-bold">Value Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {standardRows.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No deductions applied.</td></tr>
            )}
            {renderRows(standardRows)}
          </tbody>
        </table>
      </div>

      <div className="mb-1 font-semibold text-base text-muted-foreground">Additionals</div>
      <div className="overflow-hidden rounded-md border border-border mb-4">
        <table className="w-full text-sm">
          <thead className="bg-primary/10">
            <tr>
              <th className="px-4 py-2 text-left text-gray-800 font-bold">Description</th>
              <th className="px-4 py-2 text-right text-gray-800 font-bold">Value Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {percentRows.length === 0 && flatRows.length === 0 && (
              <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No additionals applied.</td></tr>
            )}
            {renderRows(percentRows, false)}
            {renderRows(flatRows, false)}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-md border">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Base Cost:</span>
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
          <span className="text-lg font-bold">Market Value:</span>
          <span className="text-2xl font-bold text-primary">₱{(Math.round(finalMarketValue / 10) * 10).toLocaleString()}</span>
        </div>
      </div>
    </section>
  );
}

// ─── DeductionsTable ──────────────────────────────────────────────────────────

export const DeductionsTable = ({
  selections,
  onSelectionChange,
  quantities,
  onQuantitiesChange,
  deductionChoices,
  error,
}: DeductionsTableProps) => {
  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  const addRow = () => {
    if (selections.length >= deductionChoices.length && deductionChoices.length > 0) return;
    onSelectionChange([...selections, null]);
    onQuantitiesChange([...quantities, 0]);
  };

  const confirmRemove = () => {
    if (pendingRemoveIndex === null) return;
    const index = pendingRemoveIndex;
    setPendingRemoveIndex(null);
    if (selections.length <= 1) {
      onSelectionChange([null]);
      onQuantitiesChange([0]);
      return;
    }
    onSelectionChange(selections.filter((_, i) => i !== index));
    onQuantitiesChange(quantities.filter((_, i) => i !== index));
  };

  const handleSelect = (index: number, key: string | number | null) => {
    const next = [...selections];
    next[index] = key === null ? null : String(key);
    onSelectionChange(next);
  };

  const hasUnfilledRow = selections.some((s, i) => !s || !(quantities[i] > 0));
  const isLimitReached = hasUnfilledRow || (deductionChoices.length > 0 && selections.length >= deductionChoices.length);

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Label className="text-base font-semibold block">Other Improvements</Label>
      </div>

      {error && <p className="text-destructive text-sm mb-2">{error}</p>}

      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-primary/10">
              <tr>
                <th className="border-b border-primary/10 px-4 py-2 text-left text-gray-800 font-bold">Kind</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-36">Total Number</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-40">Unit Value</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-44">Base Market Value</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {selections.map((value, index) => {
                const otherSelected = selections
                  .filter((v, i) => i !== index && v !== null)
                  .map(String);
                const availableOptions = deductionChoices.filter(
                  (opt) => !otherSelected.includes(String(opt.id))
                );
                const selectedOpt = deductionChoices.find(
                  (opt) => String(opt.id) === String(value)
                );
                const unitValue = selectedOpt?.pricePerSqm ?? 0;
                const qty = quantities[index] || 0;
                const baseMarketValue = unitValue * qty;

                return (
                  <tr key={index} className="hover:bg-(--chart-2)/10 transition-colors">
                    {/* Col 1: Kind */}
                    <td className="p-2">
                      <Select
                        selectedKey={value === null ? null : String(value)}
                        onSelectionChange={(key) => handleSelect(index, key)}
                        aria-label={`Kind ${index + 1}`}
                        placeholder="Select kind"
                        className="w-full"
                      >
                        <Group className="relative flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                          <Button className="flex w-full items-center justify-between outline-none">
                            <SelectValue className="truncate" />
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </Group>
                        <Popover className="min-w-[--trigger-width] border bg-popover text-popover-foreground shadow-md rounded-md z-50">
                          <ListBox className="p-1 outline-none">
                            {availableOptions.map((opt) => (
                              <ListBoxItem
                                key={String(opt.id)}
                                id={String(opt.id)}
                                textValue={opt.name}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none data-[focused]:bg-accent data-[focused]:text-accent-foreground"
                              >
                                <div className="flex justify-between w-full">
                                  <span>{opt.name}</span>
                                  <span className="text-muted-foreground ml-4">
                                    {opt.percentage ? `${opt.percentage}%` : opt.pricePerSqm ? `₱${opt.pricePerSqm}/sqm` : ""}
                                  </span>
                                </div>
                              </ListBoxItem>
                            ))}
                          </ListBox>
                        </Popover>
                      </Select>
                    </td>

                    {/* Col 2: Total Number */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!selectedOpt || deductionChoices.length === 0}
                        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-right focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="0"
                        value={qty === 0 ? "" : qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const next = [...quantities];
                          next[index] = isNaN(val) ? 0 : val;
                          onQuantitiesChange(next);
                        }}
                      />
                    </td>

                    {/* Col 3: Unit Value */}
                    <td className="p-2 text-center font-mono text-sm">
                      {selectedOpt ? `₱${formatCurrency(unitValue)}` : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Col 4: Base Market Value */}
                    <td className="p-2 text-center font-mono font-semibold text-sm">
                      {selectedOpt && qty > 0
                        ? `₱${formatCurrency(baseMarketValue)}`
                        : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Action */}
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        onPress={() => setPendingRemoveIndex(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[oklch(0.5800_0.2200_27)]/15 hover:text-[oklch(0.5800_0.2200_27)] transition-colors"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button
          type="button"
          onPress={addRow}
          isDisabled={isLimitReached}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Add another improvement
        </Button>
      </div>

      <Dialog open={pendingRemoveIndex !== null} onOpenChange={(open) => { if (!open) setPendingRemoveIndex(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove Improvement</DialogTitle>
            <DialogDescription>Are you sure you want to remove this improvement? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <ShadButton variant="outline" onClick={() => setPendingRemoveIndex(null)}>Cancel</ShadButton>
            <ShadButton variant="destructive" onClick={confirmRemove}>Remove</ShadButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

// ─── AdjustmentTable ──────────────────────────────────────────────────────────

interface AdjustmentTableProps {
  options: SelectOption[];
  values: (string | number | null)[];
  onChange: (newValues: (string | number | null)[]) => void;
  baseMarketValue: number;
  isTitled?: boolean;
  onMarketValueChange?: (value: number) => void;
}

export const AdjustmentTable = ({
  options,
  values,
  onChange,
  baseMarketValue,
  isTitled = false,
  onMarketValueChange,
}: AdjustmentTableProps) => {
  const totalPercent = values.reduce<number>((acc, id) => {
    if (!id) return acc;
    const opt = options.find((o) => String(o.id) === String(id));
    return acc + Math.abs(opt?.percentage ?? 0);
  }, 0);

  const titleBonus = isTitled ? 35 : 0;
  const effectiveRate = 100 + titleBonus - totalPercent;
  const marketValue = Math.round(((baseMarketValue * effectiveRate) / 100) / 10) * 10;

  useEffect(() => {
    onMarketValueChange?.(marketValue);
  }, [marketValue, onMarketValueChange]);

  const handleSelect = (index: number, key: string | number | null) => {
    const next = [...values];
    next[index] = key === null ? null : String(key);
    onChange(next);
  };

  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(null);

  const addRow = () => {
    if (options.length > 0 && values.length >= options.length) return;
    onChange([...values, null]);
  };

  const confirmRemove = () => {
    if (pendingRemoveIndex === null) return;
    const index = pendingRemoveIndex;
    setPendingRemoveIndex(null);
    if (values.length <= 1) { onChange([null]); return; }
    onChange(values.filter((_, i) => i !== index));
  };

  const hasUnfilledRow = values.some((v) => !v);
  const isLimitReached = hasUnfilledRow || (options.length > 0 && values.length >= options.length);

  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm">
      <Label className="text-base font-semibold block mb-4">Adjustment</Label>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-primary/10">
              <tr>
                <th className="border-b border-primary/10 px-4 py-2 text-left text-gray-800 font-bold">Adjustment Factor</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-40">% Adjustment</th>
                <th className="border-b border-primary/10 px-4 py-2 text-center text-gray-800 font-bold w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {values.map((value, index) => {
                const otherSelected = values
                  .filter((v, i) => i !== index && v !== null)
                  .map(String);
                const availableOptions = options.filter(
                  (opt) => !otherSelected.includes(String(opt.id))
                );
                const selectedOpt = options.find((o) => String(o.id) === String(value));

                return (
                  <tr key={index} className="hover:bg-(--chart-2)/10 transition-colors">
                    <td className="p-2">
                      <Select
                        selectedKey={value === null ? null : String(value)}
                        onSelectionChange={(key) => handleSelect(index, key)}
                        aria-label={`Adjustment factor ${index + 1}`}
                        placeholder="Select factor"
                        className="w-full"
                      >
                        <Group className="relative flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                          <Button className="flex w-full items-center justify-between outline-none">
                            <SelectValue className="truncate">
                              {({ selectedText }) => <span>{selectedText}</span>}
                            </SelectValue>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </Group>
                        <Popover className="min-w-[--trigger-width] border bg-popover text-popover-foreground shadow-md rounded-md z-50">
                          <ListBox className="p-1 outline-none">
                            {availableOptions.map((opt) => (
                              <ListBoxItem
                                key={String(opt.id)}
                                id={String(opt.id)}
                                textValue={opt.name}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none data-[focused]:bg-accent data-[focused]:text-accent-foreground"
                              >
                                <div className="flex justify-between w-full">
                                  <span>{opt.name}</span>
                                  {opt.percentage !== undefined && (
                                    <span className="text-muted-foreground ml-4">{opt.percentage}%</span>
                                  )}
                                </div>
                              </ListBoxItem>
                            ))}
                          </ListBox>
                        </Popover>
                      </Select>
                    </td>

                    <td className="p-2 text-center font-mono text-sm">
                      {selectedOpt?.percentage !== undefined
                        ? `${selectedOpt.percentage}%`
                        : <span className="text-muted-foreground">—</span>}
                    </td>

                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        onPress={() => setPendingRemoveIndex(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[oklch(0.5800_0.2200_27)]/15 hover:text-[oklch(0.5800_0.2200_27)] transition-colors"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button
          type="button"
          onPress={addRow}
          isDisabled={isLimitReached}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Add another adjustment
        </Button>

        <Dialog open={pendingRemoveIndex !== null} onOpenChange={(open) => { if (!open) setPendingRemoveIndex(null); }}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Remove Adjustment</DialogTitle>
              <DialogDescription>Are you sure you want to remove this adjustment? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <ShadButton variant="outline" onClick={() => setPendingRemoveIndex(null)}>Cancel</ShadButton>
              <ShadButton variant="destructive" onClick={confirmRemove}>Remove</ShadButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Summary rows */}
        <div className="flex flex-col gap-2 p-4 bg-primary/10 rounded-md border border-primary/20 mt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Adjustment <span className="font-mono">
                (100%{isTitled ? ` + 35%` : ""}{totalPercent > 0 ? ` − ${totalPercent}%` : ""})
              </span>:
            </span>
            <span className="font-mono font-medium text-destructive">
              {effectiveRate}%
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between items-center">
            <span className="font-bold">Market Value:</span>
            <span className="text-xl font-bold text-primary">₱{marketValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
