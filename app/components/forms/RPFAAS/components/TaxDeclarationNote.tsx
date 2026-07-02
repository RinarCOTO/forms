const TAX_DECLARATION_NOTE =
  "This declaration is for real property taxation purposes only and the valuation indicated herein are based on the schedule of unit market values prepared for the purpose and duly enacted into an ordinance by the Sangguniang Panlalawigan under Ordinance no. 150 dated December 20, 2012. It does not and cannot by itself alone confer any ownership or legal title to the property.";

export function TaxDeclarationNote() {
  return (
    <div className="flex gap-2 mt-24 print:mt-2">
      <div className="font-bold shrink-0 tax-dec-note">NOTE:</div>
      <div>{TAX_DECLARATION_NOTE}</div>
    </div>
  );
}
