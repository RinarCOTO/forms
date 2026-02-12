'use client'

import { MinusIcon, PlusIcon, ChevronDown } from 'lucide-react'
import {
  Button,
  Group,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  type PressEvent
} from 'react-aria-components'

export interface SelectOption {
  id: string | number
  name: string
}

interface DynamicSelectGroupProps {
  label: string
  options: SelectOption[]
  values: (string | number | null)[]
  onChange: (newValues: (string | number | null)[]) => void
  placeholder?: string
}

export function DynamicSelectGroup({
  label,
  options,
  values,
  onChange,
  placeholder = 'Select an option'
}: DynamicSelectGroupProps) {

  const handleSelectChange = (index: number, newValue: string | number | null) => {
    const newValues = [...values]
    // Ensure the value is stored as a string to match ListBoxItem IDs
    newValues[index] = newValue === null ? null : String(newValue);
    onChange(newValues)
  }

  const addRow = () => {
    // Prevent adding if we already have as many rows as options
    if (values.length >= options.length) return;
    onChange([...values, null])
  }

  const removeRow = (index: number) => {
    if (values.length <= 1) {
      // If it's the last row, just reset it to null instead of removing the row completely
      onChange([null])
      return
    }
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  // Disable the "Add" button if we have used up all available options
  const isLimitReached = values.length >= options.length;

  return (
    <div className="w-full space-y-2">
      <Label className="text-sm font-medium leading-none select-none text-foreground">
        {label}
      </Label>
      <div className="space-y-3">
        {values.map((value, index) => {
          // 1. Get all values selected in OTHER rows
          const otherSelectedValues = values
            .filter((v, i) => i !== index && v !== null)
            .map(String);

          // 2. Filter options: exclude those selected in other rows
          const availableOptions = options.filter(
            (opt) => !otherSelectedValues.includes(String(opt.id))
          );

          return (
            <div 
              key={`${index}`} 
              className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <Select
                selectedKey={value === null ? null : String(value)}
                onSelectionChange={(key) => handleSelectChange(index, key)}
                className="grow"
                aria-label={`${label} row ${index + 1}`}
                placeholder={placeholder}
              >
                <Group className="dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border bg-background text-foreground shadow-xs transition-[color,box-shadow] outline-none data-focus-within:ring-[3px] md:text-sm">
                  <Button className="flex w-full grow items-center justify-between px-3 py-2 text-start outline-none hover:bg-accent/50">
                    <SelectValue className="data-[placeholder]:text-muted-foreground truncate text-foreground" />
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </Group>

                <Popover className="min-w-[--trigger-width] border bg-popover text-popover-foreground shadow-md outline-none rounded-md">
                  <ListBox className="max-h-[200px] overflow-auto p-1 outline-none">
                    {availableOptions.length > 0 ? (
                      availableOptions.map((opt) => (
                        <ListBoxItem 
                          key={String(opt.id)} 
                          id={String(opt.id)} 
                          textValue={opt.name} 
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none data-[focused]:bg-accent data-[focused]:text-accent-foreground data-[selected]:bg-accent/50"
                        >
                          {opt.name}
                        </ListBoxItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No more options available
                      </div>
                    )}
                  </ListBox>
                </Popover>
              </Select>

              <Button
                type="button"
                onPress={() => removeRow(index)}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-input bg-muted/20 hover:bg-destructive hover:text-destructive-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Remove row"
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
            </div>
          )
        })}

        <Button
          type="button"
          onPress={addRow}
          isDisabled={isLimitReached}
          className={`flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-transparent py-2.5 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring
            ${isLimitReached 
              ? 'opacity-50 cursor-not-allowed text-muted-foreground' 
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add another {label.toLowerCase()}</span>
        </Button>
      </div>
    </div>
  )
}