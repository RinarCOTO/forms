import type { ReactNode } from 'react';

type CheckboxProps = {
    label?: ReactNode;
    checked?: boolean;
};

export const Checkbox = ({ label, checked = false }: CheckboxProps) => (
    <label className="flex items-center gap-2">
        <input type="checkbox" checked={checked} readOnly />
        {label}
    </label>
);
