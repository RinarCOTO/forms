
import { Separator } from "@/components/ui/separator";
import { DynamicSelectGroup, SelectOption } from "@/components/dynamicSelectButton";

type TotalDeductionTableProps = {
  totalPercentage: number;
  totalDeductionValue: number;
  netUnitCost: number;
  formatCurrency: (value: number) => string;
};

export default function TotalDeductionTable({ totalPercentage, totalDeductionValue, netUnitCost, formatCurrency }: TotalDeductionTableProps) {
  return (
    <section className="bg-card rounded-lg border p-6 shadow-sm">
    <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-md border">
        <label htmlFor="total-deductions-summary">Total Deductions Summary</label>
    </div>
    <div className="">

    </div>
    </section>

  );
}

