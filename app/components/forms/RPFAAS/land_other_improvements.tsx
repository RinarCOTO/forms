import "@/app/components/forms/RPFAAS/faas_table_forms.css";

const STRUCTURAL_MATERIAL_ROWS = [
  { roof: "Reinforced Concrete", flooring: "Concrete", walls: "Concrete" },
  { roof: "Longspan Roof", flooring: "Plain Cement", walls: "Plain Cement" },
  { roof: "Tiles", flooring: "Marble", walls: "Wood" },
  { roof: "G.I. Sheets", flooring: "Wood", walls: "CHB" },
  { roof: "Aluminum", flooring: "Tiles", walls: "C.I. Sheet" },
  { roof: "Asbestos", flooring: "Others (Specify)", walls: "Build a Wall" },
  { roof: "Long Span", flooring: null, walls: "Sawali" },
  { roof: "Concrete Desk", flooring: null, walls: "Bamboo" },
  { roof: "Nipa/Anahaw/Cogon", flooring: null, walls: "Lumber/Plywood" },
  { roof: "Others (Specify)", flooring: null, walls: "Others (Specify)" },
];

const FLOOR_LEVELS = ["1st", "2nd", "3rd", "4th"];

const ADDITIONAL_ITEMS_ROWS = [
  ["value", "value", "value", "value", "value", "value", "value", "value", "percentage"],
  ["value", "value", "value", "value", "value", "value", "value", "value", "value"],
  ["value", "value", "value", "value", "value", "value", "value", "value", "value"],
];

const SectionHeader = ({ children, colSpan = 4, className = "" }) => (
  <tr>
    <td colSpan={colSpan} className={`font-bold ${className}`}>
      {children}
    </td>
  </tr>
);

const FloorAreaRow = ({ floor, label, value = "value" }) => (
  <tr>
    <td>{label}</td>
    <td>value</td>
    <td className="text-right">
      {floor}<sup>{getOrdinalSuffix(floor)}</sup> Floor Area:
    </td>
    <td>{value}</td>
  </tr>
);

const getOrdinalSuffix = (num) => {
  const suffixes = { 1: "st", 2: "nd", 3: "rd" };
  return suffixes[num] || "th";
};

const Checkbox = ({ label, checked = false }) => (
  <label className="flex items-center gap-2">
    <input type="checkbox" defaultChecked={checked} />
    {label}
  </label>
);

const CheckboxIcon = ({ checked = false }) => (
  <span className="w-4 h-4 border-2 border-black flex items-center justify-center">
    {checked && <span className="text-xs font-bold">x</span>}
  </span>
);

const LandOtherImprovements = () => {
  return (
    <div className="rpfaas-print">
      <h1 className="text-2xl font-bold text-center uppercase">
        Real Property Field Appraisal &amp; Assessment Sheet - Land/Other Improvements
      </h1>

      {/* Basic Information */}
      <table>
        <tbody>
          <tr className="bordered-table">
            <td>Transaction Code:</td>
            <td>
              <div className="grid grid-cols-3">
                <div>DC</div>
                <div>ARP No.</div>
              </div>
            </td>
            <td>PIN:</td>
          </tr>

          <tr>
            <td>OCT/TCT/CLOA No.</td>
            <td />
            <td>Dated:</td>
            <td />
          </tr>

          <tr>
            <td>Survey No.</td>
            <td />
            <td>Lot No.</td>
            <td />
          </tr>

          <tr>
            <td>Owner:</td>
            <td></td>
            <td />
          </tr>

          <tr>
            <td>Address:</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

          <tr>
            <td>Administration/Care of:</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

          <tr>
            <td>Address:</td>
            <td></td>
            <td></td>
          </tr>

          <SectionHeader>Location of Property</SectionHeader>

          <tr>
            <td>No/Street/Sitio:</td>
            <td>value</td>
            <td className="text-right">Municipality:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Barangay:</td>
            <td>value</td>
            <td className="text-right">Province:</td>
            <td>value</td>
          </tr>

          <SectionHeader>General Description</SectionHeader>

          <tr>
            <td>Kind of Bldg:</td>
            <td>value</td>
            <td className="text-right">Bldg. Age:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Structural Type:</td>
            <td>value</td>
            <td className="text-right">No. of Storey:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Lot Tax Declaration No.</td>
            <td>value</td>
            <td className="text-right">1<sup>st</sup> Floor Area:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Lot Owner</td>
            <td>value</td>
            <td className="text-right">2<sup>nd</sup> Floor Area:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Certificate Issued on:</td>
            <td>value</td>
            <td className="text-right">3<sup>rd</sup> Floor Area:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Certificate of Occupancy Issued on:</td>
            <td>value</td>
            <td className="text-right">4<sup>th</sup> Floor Area:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Date Constructed/Completed:</td>
            <td>value</td>
            <td className="text-right">Basement Area:</td>
            <td>value</td>
          </tr>

          <tr>
            <td>Date Occupied:</td>
            <td>value</td>
            <td className="text-right">Total Floor Area:</td>
            <td>value</td>
          </tr>

          <SectionHeader className="border-b-2">Floor Dimension</SectionHeader>

          <tr>
            <td colSpan={4}>
              Attach the building plan or sketch of floor plan. A photograph may also be
              attached if necessary.
            </td>
          </tr>
        </tbody>
      </table>

      {/* Structural Materials */}
      <table>
        <tbody>
          <SectionHeader colSpan={11} className="py-4 no-border">Structural Materials (checklists)</SectionHeader>

          <tr>
            <td className="font-bold w-50">ROOF</td>
            <td className="font-bold w-38">FLOORING</td>
            {FLOOR_LEVELS.map((level) => (
              <td key={`floor-header-${level}`} className="text-center">
                {level.replace(/\D/g, "")}<sup>{level.replace(/\d/g, "")}</sup>
              </td>
            ))}
            <td className="font-bold w-32">WALLS</td>
            {FLOOR_LEVELS.map((level) => (
              <td key={`wall-header-${level}`} className="text-center">
                {level.replace(/\D/g, "")}<sup>{level.replace(/\d/g, "")}</sup>
              </td>
            ))}
          </tr>

          {STRUCTURAL_MATERIAL_ROWS.map((row, idx) => (
            <tr key={`struct-row-${idx}`}>
              <td>
                {row.roof && <Checkbox label={row.roof} />}
              </td>
              <td>{row.flooring}</td>
              {FLOOR_LEVELS.map((_, i) => (
                <td key={`floor-x-${idx}-${i}`} className="text-center">x</td>
              ))}
              <td>{row.walls}</td>
              {FLOOR_LEVELS.map((_, i) => (
                <td key={`wall-x-${idx}-${i}`} className="text-center">x</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Additional Items */}
      <table>
        <tbody>
          <SectionHeader colSpan={9}>
            Additional Items: (Use additional sheet if necessary)
          </SectionHeader>

          <tr>
            <td>Unit Value</td>
            <td>Market Value</td>
            <td>Adj. M.V.</td>
            <td>Additional</td>
            <td>Area (sq.m)</td>
            <td>%</td>
            <td>Amount</td>
            <td>Deduction</td>
            <td />
          </tr>

          {ADDITIONAL_ITEMS_ROWS.map((cells, idx) => (
            <tr key={`additional-${idx}`}>
              {cells.map((cell, j) => (
                <td key={`additional-${idx}-${j}`}>{cell}</td>
              ))}
            </tr>
          ))}

          <tr>
            <td />
            <td />
            <td className="font-bold">value</td>
            <td colSpan={2}>Total</td>
            <td />
            <td className="font-bold">value</td>
            <td>Total</td>
            <td className="font-bold">value</td>
          </tr>
        </tbody>
      </table>

      {/* Unit Construction Cost */}
      <table>
        <tbody>
          <tr>
            <td colSpan={2} className="font-bold">Unit Construction Cost:</td>
            <td colSpan={2} className="font-bold">Cost of Deductions:</td>
          </tr>

          <tr>
            <td>Depreciation:</td>
            <td>in %</td>
            <td>Depreciation + Deduction</td>
            <td>Amount</td>
          </tr>

          <tr>
            <td>Depreciation Cost:</td>
            <td>number</td>
            <td>Market Value:</td>
            <td>Amount in numbers</td>
          </tr>
        </tbody>
      </table>

      {/* Property Assessment */}
      <table>
        <tbody>
          <SectionHeader>PROPERTY ASSESSMENT</SectionHeader>

          <tr>
            <td>Actual Use</td>
            <td>Market Value</td>
            <td>Assessment Level</td>
            <td>Estimated Value</td>
          </tr>

          <tr>
            <td>Residential</td>
            <td className="font-bold">value number</td>
            <td className="font-bold">value percentage</td>
            <td className="font-bold">value number</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures & Approval */}
      <table className="no-border">
        <tbody>
          <tr>
            <td>Amount in Words:</td>
            <td colSpan={2} className="uppercase border-b-2 border-black text-center">
              amount in words
            </td>
          </tr>

          <tr>
            <td>
              <label className="flex items-center gap-2">
                <CheckboxIcon checked />
                Taxable
              </label>
            </td>
            <td>
              <label className="flex items-center gap-2">
                <CheckboxIcon checked />
                Exempt
              </label>
            </td>
            <td>Effectivity of Assessment:</td>
            <td className="font-bold">DATE: select</td>
          </tr>

          <tr>
            <td colSpan={2}>Appraised &amp; Assessed by:</td>
            <td colSpan={2}>Recommending Approval:</td>
          </tr>

          <tr>
            <td colSpan={2} className="text-center">
              <div>NAME OF TAX MAPPER</div>
              <div>POSITION</div>
            </td>
            <td colSpan={2} className="text-center">
              <div>MUNICIPAL ASSESSOR NAME</div>
              <div>MUNICIPAL ASSESSOR</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default LandOtherImprovements;
