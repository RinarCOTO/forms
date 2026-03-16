"use client";

interface DatePickerProps {
    value?: string;
    onChange?: (value: string) => void;
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
    return (
        <input
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="border rounded px-3 py-2"
        />
    );
}
