'use client'

import { MinusIcon, PlusIcon, ChevronDown } from 'lucide-react'
import {
  Button,
  Group,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
} from 'react-aria-components'

export interface SelectOption {
  id: string | number
  name: string
  percentage?: number
}

interface DynamicSelectGroupProps {
  label: string
  options: SelectOption[]
  values: (string | number | null)[]
  onChange: (newValues: (string | number | null)[]) => void
  placeholder?: string
  unitCost: number // The base value from Step 2 (e.g., 25000)
}

export function DynamicSelectGroup({
  label,
  options,
  values,
  onChange,
  placeholder = 'Select an option',
  unitCost
}: DynamicSelectGroupProps) {

  const handleSelectChange = (index: number, newValue: string | number | null) => {
    const newValues = [...values]
    newValues[index] = newValue === null ? null : String(newValue);
    onChange(newValues)
  }

  const addRow = () => {
    if (values.length >= options.length) return;
    onChange([...values, null])
  }

  const removeRow = (index: number) => {
    if (values.length <= 1) {
      onChange([null])
      return
    }
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  const isLimitReached = values.length >= options.length;

  return (
    <div className="w-full space-y-4">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="border-b px-4 py-2 text-left font-medium text-muted-foreground">Deduction</th>
              {/* This is the column you requested to update */}
              <th className="border-b px-4 py-2 text-center font-medium text-muted-foreground w-48">
                Deduction Value (% of Unit Cost)
              </th>
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
              
              // Calculation: (Unit Cost * Percentage) / 100
              const percentage = selectedOption?.percentage || 0;
              const computedAmount = (unitCost * percentage) / 100;

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
                                <span className="text-muted-foreground">{opt.percentage}%</span>
                              </div>
                            </ListBoxItem>
                          ))}
                        </ListBox>
                      </Popover>
                    </Select>
                  </td>

                  {/* COMPUTED VALUE DISPLAY */}
                  <td className="p-2 text-center">
                    {selectedOption ? (
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-destructive">
                          - ₱{computedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          ({percentage}% of ₱{unitCost.toLocaleString()})
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
        Add another deduction
      </Button>
    </div>
  )
}