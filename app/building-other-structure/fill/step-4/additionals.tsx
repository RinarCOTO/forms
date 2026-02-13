"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DynamicSelectGroup } from "@/components/dynamicSelectButton";

interface AdditionalsTableProps {
  choices: any[];
  selections: (string | number | null)[];
  onSelectionChange: (vals: (string | number | null)[]) => void;
  unitCost: number;
}

const AdditionalsTable = ({ choices, selections, onSelectionChange, unitCost }: AdditionalsTableProps) => {
  return (
    <div className="rounded-md border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <DynamicSelectGroup
          options={choices}
          selectedValues={selections}
          onSelectionChange={onSelectionChange}
          placeholder="Select Additional Deviation..."
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Rate / Type</TableHead>
            <TableHead className="text-right">Added Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selections.filter(s => s !== null).map((id, index) => {
            const item = choices.find((c) => String(c.id) === String(id));
            if (!item) return null;

            // Calculate value based on unit type
            const addedValue = item.unit === 'percentage' 
                ? (unitCost * (item.rate / 100)) 
                : item.rate;

            return (
              <TableRow key={`${id}-${index}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                    {item.unit === 'percentage' 
                        ? `${item.rate}% of Base` 
                        : `₱${item.rate.toLocaleString()}/sqm (Fixed)`}
                </TableCell>
                <TableCell className="text-right text-green-600 font-semibold">
                  + ₱{addedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            );
          })}
          
          {selections.filter(s => s !== null).length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                No additional structures or finishes selected.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdditionalsTable;