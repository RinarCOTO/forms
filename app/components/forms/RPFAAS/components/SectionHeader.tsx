import type { ReactNode } from 'react';

type SectionHeaderProps = {
    children: ReactNode;
    colSpan?: number;
    className?: string;
};

export const SectionHeader = ({
    children,
    colSpan = 3,
    className = ""
}: SectionHeaderProps) => (
    <tr>
        <td colSpan={colSpan} className={`font-bold ${className}`}>
            {children}
        </td>
    </tr>
);
