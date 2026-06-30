import type { ReactNode } from 'react';

type CheckboxProps = {
    label?: ReactNode;
    checked?: boolean;
};

export const Checkbox = ({ label, checked = false }: CheckboxProps) => (
    <label className="flex items-center gap-1.5">
        {/* Use a styled span instead of <input> — native checkboxes are unreliable in print */}
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '11px',
                height: '11px',
                minWidth: '11px',
                border: '1.5px solid #000',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0,
            }}
        >
            {checked ? 'X' : ''}
        </span>
        {label}
    </label>
);
