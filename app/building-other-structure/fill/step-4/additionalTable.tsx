'use client'

import { MinusIcon, PlusIcon, ChevronDown } from 'lucide-react'
import React from 'react';
import {
  Button,
  Group,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components'

// Ensure this is exported so other components can use it
export interface SelectOption {
  id: string | number
  name: string
  percentage?: number
  pricePerSqm?: number
}

interface AdditionalTableProps {
  label: string
  options: SelectOption[]
  values: (string | number | null)[]
  onChange: (newValues: (string | number | null)[]) => void
  // NEW: Controlled state for areas
  areas: number[] 
  onAreasChange: (newAreas: number[]) => void
  placeholder?: string
  unitCost?: number
}

export function AdditionalTable({
  label,
  options,
  values,
  onChange,
  areas,            // Received from parent
  onAreasChange,    // Received from parent
  placeholder = 'Select an option',
  unitCost = 0
}: AdditionalTableProps) {

  const handleSelectChange = (index: number, newValue: string | number | null) => {
    const newValues = [...values]
    newValues[index] = newValue === null ? null : String(newValue);
    onChange(newValues)
  }

  const addRow = () => {
    if (values.length >= options.length) return;
    onChange([...values, null]);
    onAreasChange([...areas, 0]); // Add corresponding area
  }

  const removeRow = (index: number) => {
    if (values.length <= 1) {
      onChange([null]);
      onAreasChange([0]);
      return;
    }
    const newValues = values.filter((_, i) => i !== index);
    const newAreas = areas.filter((_, i) => i !== index);
    onChange(newValues);
    onAreasChange(newAreas);
  }

  const isLimitReached = values.length >= options.length;

  return (
    <section className='bg-card rounded-lg border p-6 shadow-sm mb-6'>
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="border-b px-4 py-2 text-left font-medium text-muted-foreground">{label}</th>
              <th className="border-b px-4 py-2 text-left font-medium text-muted-foreground">Area (sqm)</th>
              <th className="border-b px-4 py-2 text-center font-medium text-muted-foreground w-48">Unit Value</th>
              <th className="border-b px-4 py-2 text-center font-medium text-muted-foreground w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {values.map((value, index) => {
              const otherSelectedValues = values
                .filter((v, i) => i !== index && v !== null)
                .map(String);

              const availableOptions = options.filter(
                (opt) => !otherSelectedValues.includes(String(opt.id))
              );

              const selectedOption = options.find(opt => String(opt.id) === String(value));
              
              const percentage = selectedOption?.percentage || 0;
              const flatRate = selectedOption?.pricePerSqm || 0;
              const computedValue = percentage > 0 
                ? (unitCost * percentage) / 100 
                : flatRate;
              
              const areaValue = areas[index] || 0;
              const deductionCost = computedValue * areaValue;

              return (
                <tr key={index} className="hover:bg-muted/20 transition-colors">
                  <td className="p-2">
                    <Select
                      selectedKey={value === null ? null : String(value)}
                      onSelectionChange={(key) => handleSelectChange(index, key)}
                      aria-label={`Deduction ${index + 1}`}
                      placeholder={placeholder}
                      className="w-full"
                    >
                      <Group className="relative flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                        <Button className="flex w-full items-center justify-between outline-none">
                          <SelectValue className="truncate" />
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </Group>
                      <Popover className="min-w-[--trigger-width] border bg-popover text-popover-foreground shadow-md rounded-md z-50">
                        <ListBox className="max-h-[200px] overflow-auto p-1 outline-none">
                          {availableOptions.map((opt) => (
                            <ListBoxItem 
                              key={String(opt.id)} 
                              id={String(opt.id)} 
                              textValue={opt.name} 
                              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 outline-none data-[focused]:bg-accent data-[focused]:text-accent-foreground"
                            >
                              <div className="flex justify-between w-full">
                                <span>{opt.name}</span>
                                <span className="text-muted-foreground">
                                  {opt.percentage ? `${opt.percentage}%` : opt.pricePerSqm ? `₱${opt.pricePerSqm}/sqm` : ''}
                                </span>
                              </div>
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Popover>
                    </Select>
                  </td>

                  {/* AREA INPUT FIELD */}
                  <td className="p-2 text-center">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="w-24 rounded-md border border-input bg-background px-2 py-1 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0"
                        value={areas[index] === 0 ? '' : areas[index]} // Avoid showing 0 if you prefer empty
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const newAreas = [...areas];
                          newAreas[index] = isNaN(val) ? 0 : val;
                          onAreasChange(newAreas);
                        }}
                      />
                      <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">sqm</span>
                    </div>
                  </td>

                  <td className="p-2 text-center">
                    {selectedOption ? (
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-destructive">
                           ₱{deductionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="p-2 text-center">
                    <Button
                      type="button"
                      onPress={() => removeRow(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              )
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
        Add another item
      </Button>
    </div>
    </section>
  )
}