"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type MultiSelectProps = {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
};

export default function MultiSelect({ options, value, onChange, placeholder = "please select" }: MultiSelectProps) {
  const toggle = (opt: string, checked: boolean) => {
    if (checked) {
      if (!value.includes(opt)) onChange([...value, opt]);
      return;
    }
    onChange(value.filter((v: string) => v !== opt));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rpfaas-fill-input w-full text-left">
          {value.length > 0 ? value.join(", ") : placeholder}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          {options.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt}
              checked={value.includes(opt)}
              onCheckedChange={(checked: any) => {
                toggle(opt, Boolean(checked));
              }}
            >
              {opt}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
