import type { ReactNode } from 'react';

type SectionHeaderProps = {
    children: ReactNode;
    colSpan?: number;
    className?: string;
    "data-field"?: string;
};

export const SectionHeader = ({
    children,
    colSpan = 3,
    className = "",
    "data-field": dataField,
}: SectionHeaderProps) => (
    <tr data-field={dataField}>
        <td colSpan={colSpan} className={`font-bold sectionHeader ${className}`}>
            {children}
        </td>
    </tr>
);
