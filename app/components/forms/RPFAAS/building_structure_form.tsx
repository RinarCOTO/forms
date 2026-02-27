"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import FaasFooter from "./faas-footer";
import { SectionHeader } from "./components/SectionHeader";
import { Checkbox } from "./components/Checkbox";
import { useRPFAASData } from "./hooks/useRPFAASData";
import { STRUCTURAL_MATERIAL_ROWS, FLOOR_LEVELS } from "./constants/structuralMaterials";
import type { RoofMaterials } from "@/app/types/rpfaas";
import { DEDUCTION_CHOICES, ADDITIONAL_PERCENT_CHOICES, ADDITIONAL_FLAT_RATE_CHOICES } from "@/config/form-options";

const BuildingStructureForm = () => {
    const {
        ownerName,
        adminCareOfName,
        ownerAddressBarangay,
        ownerAddressMunicipality,
        ownerAddressProvince,
        adminBarangayName,
        adminMunicipalityName,
        adminProvinceName,
        locationStreet,
        locationMunicipality,
        locationBarangay,
        locationProvince,
        typeOfBuilding,
        structuralType,
        buildingPermitNo,
        cct,
        completionIssuedOn,
        dateConstructed,
        dateOccupied,
        buildingAge,
        numberOfStoreys,
        floorAreas,
        totalFloorArea,
        landOwner,
        landTdArpNo,
        landArea,
        roofMaterials,
        roofMaterialsOtherText,
        flooringGrid,
        wallsGrid,
        selectedDeductions,
        deductionComments,
        additionalPercentageChoice,
        additionalPercentageValue,
        additionalPercentageAreas,
        additionalFlatRateChoice,
        additionalFlatRateValue,
        additionalFlatRateAreas,
        unitCost,
        baseCost,
        standardDeductionTotal,
        netUnitCost,
        marketValue,
        assessmentLevel,
        assessedValue,
        amountInWords,
    } = useRPFAASData();

    // Get the deductions with their percentages and calculated values
    const getSelectedDeductionsWithData = () => {
        return selectedDeductions.map(deductionId => {
            const deduction = DEDUCTION_CHOICES.find(d => d.id === deductionId);
            if (deduction) {
                const deductionValue = (baseCost * deduction.percentage) / 100;
                return { 
                    ...deduction, 
                    calculatedValue: deductionValue 
                };
            }
            return { id: deductionId, name: deductionId, percentage: 0, calculatedValue: 0 };
        });
    };

    // Get the selected additional percentage items with their data and calculated values
    const getSelectedAdditionalPercentageItemsWithData = () => {
        if (!additionalPercentageChoice) return [];
        
        const selectedIds = additionalPercentageChoice.split(",").filter(Boolean);
        return selectedIds.map((itemId, index) => {
            const item = ADDITIONAL_PERCENT_CHOICES.find(c => c.id === itemId);
            const area = additionalPercentageAreas[index] || 0;
            if (item) {
                const calculatedValue = (unitCost * item.percentage / 100) * area;
                return {
                    ...item,
                    area,
                    calculatedValue
                };
            }
            return { id: itemId, name: itemId, percentage: 0, area, calculatedValue: 0 };
        });
    };

    // Get the selected additional flat rate items with their data and calculated values
    const getSelectedAdditionalFlatRateItemsWithData = () => {
        if (!additionalFlatRateChoice) return [];
        
        const selectedIds = additionalFlatRateChoice.split(",").filter(Boolean);
        return selectedIds.map((itemId, index) => {
            const item = ADDITIONAL_FLAT_RATE_CHOICES.find(c => c.id === itemId);
            const area = additionalFlatRateAreas[index] || 0;
            if (item) {
                const calculatedValue = item.pricePerSqm * area;
                return {
                    ...item,
                    area,
                    calculatedValue
                };
            }
            return { id: itemId, name: itemId, pricePerSqm: 0, area, calculatedValue: 0 };
        });
    };

    const formatCurrency = (value: number) =>
        value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    // Debug: Log the data to console to see what's being loaded
    console.log('RPFAAS Data Debug:', {
        ownerName,
        adminCareOfName,
        typeOfBuilding,
        structuralType,
        buildingPermitNo,
        totalFloorArea,
        landOwner,
        landTdArpNo,
        landArea
    });

    // Debug deductions specifically
    console.log('Deductions Debug:', {
        selectedDeductions,
        deductionComments,
        assessmentLevel,
        p4DataRaw: typeof window !== 'undefined' ? localStorage.getItem("p4") : null,
        selectedDeductionsWithData: getSelectedDeductionsWithData(),
        availableDeductions: DEDUCTION_CHOICES
    });

    return (
        <div className="rpfaas-print" style={{ backgroundColor: 'white' }}>
            <h1 className="text-2xl font-bold text-center uppercase">
                Real Property Field Appraisal &amp; Assessment Sheet - Building &amp; Other structures
            </h1>

            {/* Basic Information */}
            <table>
                <colgroup>
                    <col style={{ width: '33%' }} />
                    <col style={{ width: '33%' }} />
                    <col style={{ width: '33%' }} />
                </colgroup>
                <tbody>
                    <tr className="bordered-table">
                        <td>Transaction Code:</td>
                        <td>
                            <div className="grid grid-cols-3">
                                <div className="text-center font-bold">DC</div>
                                <div className="border-x border-black text-center">ARP No.</div>
                            </div>
                        </td>
                        <td>PIN:</td>
                    </tr>

                    <tr>
                        <td>OCT/TCT/CLOA No.</td>
                        <td></td>
                        <td>Dated:</td>
                    </tr>

                    <tr className="border-b-2">
                        <td>Survey No.</td>
                        <td></td>
                        <td>Lot No.</td>
                    </tr>
                    <tr className="bordered-table" data-field="owner_name">
                        <td>Owner:</td>
                        <td colSpan={3} className="font-bold uppercase">{ownerName || '—'}</td>
                    </tr>

                    <tr data-field="owner_address">
                        <td>Address:</td>
                        <td colSpan={3}>
                            {[ownerAddressBarangay, ownerAddressMunicipality, ownerAddressProvince].filter(Boolean).join(", ") || '—'}
                        </td>
                    </tr>

                    <tr data-field="admin_care_of">
                        <td>Administration/Care of:</td>
                        <td className="capitalize" colSpan={3}>{adminCareOfName || '—'}</td>
                    </tr>

                    <tr className="border-b-2">
                        <td>Address:</td>
                        <td colSpan={3}>
                             {[adminBarangayName, adminMunicipalityName, adminProvinceName].filter(Boolean).join(", ") || '—'}
                        </td>
                    </tr>

                    <SectionHeader>LOCATION OF PROPERTY</SectionHeader>
                    <tr className="border-t-2" data-field="location_municipality">
                        <td>No/Street/Sitio:</td>
                        <td>
                            <div className="grid grid-cols-2">
                                <div className="font-bold">{locationStreet || '—'}</div>
                                <div className="border-l text-right">Municipality:</div>
                            </div>
                        </td>
                        <td className="font-bold">{locationMunicipality || '—'}</td>
                    </tr>

                    <tr className="border-b-2 border-black" data-field="location_barangay location_province">
                        <td>Barangay:</td>
                        <td>
                            <div className="grid grid-cols-2">
                                <div className="font-bold">{locationBarangay || '—'}</div>
                                <div className="border-l text-right">Province:</div>
                            </div>
                        </td>
                        <td className="font-bold">{locationProvince || '—'}</td>
                    </tr>

                    {/* REST OF THE FORM REMAINS UNCHANGED */}
                    <SectionHeader>
                        <div className="grid grid-cols-3"> 
                            <div className="col-span-2">
                                GENERAL DESCRIPTION
                            </div>
                            <div className="text-center border-l">
                                LAND REFERENCE
                            </div>
                        </div>
                    </SectionHeader>

                    <tr className="border-t-2" data-field="type_of_building building_age">
                        <td>Type of Bldg:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{typeOfBuilding || '—'}</div>
                                <div className="flex items-center px-1 font-medium floor-area-print whitespace-nowrap">Bldg. Age:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{buildingAge ? `${buildingAge} years` : '—'}</div>
                            </div>
                        </td>
                    </tr>

                    <tr className="py-auto my-auto" data-field="structure_type number_of_storeys land_owner">
                        <td>Structural Type:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{structuralType || '—'}</div>
                                <div className="flex items-center px-1 font-medium floor-area-print whitespace-nowrap">No. of Storey:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{numberOfStoreys || '—'}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center  rpfaas-print-small font-bold col-span-1">Land Owner:</div>
                                <div className="flex items-center col-span-2 pl-2 text-[10px] print:text-[8px] rpfaas-print-small">{landOwner || '—'}</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="building_permit_no td_arp_no">
                        <td>Building Permit No.</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{buildingPermitNo || '—'}</div>
                                <div className="flex items-center px-1 font-medium floor-area-print whitespace-nowrap">1<sup>st</sup> Floor Area:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{floorAreas[0] || '—'}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center text-[10px] print:text-[8px] rpfaas-print-small font-bold col-span-1">TD/ARP No.:</div>
                                <div className="flex items-center col-span-2 pl-2 text-[10px] print:text-[8px] rpfaas-print-small">{landTdArpNo || '—'}</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="cct land_area">
                        <td>Condominium Certificate of Title (CCT):</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{cct || '—'}</div>
                                <div className="flex items-center px-1 font-medium floor-area-print whitespace-nowrap">2<sup>nd</sup> Floor Area:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{floorAreas[1] || '—'}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center text-[10px] print:text-[8px] rpfaas-print-small font-bold col-span-1">Area:</div>
                                <div className="flex items-center col-span-2 pl-2 text-[10px] print:text-[8px] rpfaas-print-small">{landArea || '—'}<span> sqm</span></div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="completion_issued_on">
                        <td>Certificate of Completion Issued on:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{completionIssuedOn || '—'}</div>
                                <div className="flex items-center px-1 font-medium  floor-area-print whitespace-nowrap">3<sup>rd</sup> Floor Area:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{floorAreas[2] || '—'}</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="date_constructed">
                        <td>Date Constructed/Completed:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{dateConstructed || '—'}</div>
                                <div className="flex items-center px-1 font-medium floor-area-print whitespace-nowrap">4<sup>th</sup> Floor Area:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{floorAreas[3] || '—'}</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="date_occupied total_floor_area">
                        <td className="font-bold">Date Occupied:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="font-bold flex items-center">{dateOccupied || '—'}</div>
                                <div className="flex items-center px-1 font-bold rpfaas-print-small whitespace-nowrap">Total:</div>
                                <div className="flex items-center px-2 font-bold rpfaas-print-small whitespace-nowrap">{totalFloorArea || '—'} sqm</div>
                            </div>
                        </td>
                    </tr>

                    <SectionHeader className="border-b-2 space-x-3" data-field="unit_cost">
                        <span>Unit Construction Cost:</span>
                        <span>₱{formatCurrency(unitCost)}</span>
                    </SectionHeader>

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
                    <SectionHeader colSpan={11} className="py-4 section-divider" data-field="roofing_material flooring_material wall_material">Structural Materials (checklists)</SectionHeader>
                    <tr>
                        <td className="font-bold w-50">ROOF</td>
                        <td className="font-bold w-38">FLOORING</td>
                        {FLOOR_LEVELS.map((level) => (
                            <td key={`floor-header-${level}`} className="text-center  rpfaas-print-small">
                                {level.replace(/\D/g, "")}<sup>{level.replace(/\d/g, "")}</sup>
                            </td>
                        ))}
                        <td className="font-bold w-32">WALLS</td>
                        {FLOOR_LEVELS.map((level) => (
                            <td key={`wall-header-${level}`} className="text-center rpfaas-print-small">
                                {level.replace(/\D/g, "")}<sup>{level.replace(/\d/g, "")}</sup>
                            </td>
                        ))}
                    </tr>
                    {STRUCTURAL_MATERIAL_ROWS.map((row, idx) => {
                        const roofMapping: { [key: string]: keyof typeof roofMaterials } = {
                            "Reinforced Concrete": "reinforcedConcrete",
                            "Longspan Roof": "longspanRoof",
                            "Tiles": "tiles",
                            "G.I. Sheets": "giSheets",
                            "Aluminum": "aluminum",
                            "Others (Specify)": "others",
                        };
                        const roofKey = row.roof ? roofMapping[row.roof] : undefined;
                        const isRoofChecked = roofKey ? roofMaterials[roofKey] : false;
                        
                        let roofLabel = row.roof;
                        if (row.roof === "Others (Specify)" && roofMaterials.others && roofMaterialsOtherText) {
                            roofLabel = `Others: ${roofMaterialsOtherText}`;
                        }

                        return (
                            <tr key={`struct-row-${idx}`}>
                                <td>
                                    {row.roof && <Checkbox label={roofLabel} checked={isRoofChecked} />}
                                </td>
                                <td>{row.flooring}</td>
                                {FLOOR_LEVELS.map((_, i) => (
                                    <td key={`floor-x-${idx}-${i}`} className="text-center rpfaas-print-small">
                                        {flooringGrid[idx]?.[i] ? "X" : ""}
                                    </td>
                                ))}
                                <td>{row.walls}</td>
                                {FLOOR_LEVELS.map((_, i) => (
                                    <td key={`wall-x-${idx}-${i}`} className="text-center rpfaas-print-small">
                                        {wallsGrid[idx]?.[i] ? "X" : ""}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="flex flex-row gap-6" data-field="market_value">
                <div>Base Cost: ₱{formatCurrency(baseCost)}</div>
                <div>Less Deductions: ₱{formatCurrency(standardDeductionTotal)}</div>
                <div className="font-bold">Market Value: ₱{formatCurrency(marketValue)}</div>
            </div>
            {/* Additional Items */}
            <table>
                <tbody>
                    <SectionHeader colSpan={7} data-field="selected_deductions">Deductions: (Use additional sheet if necessary)</SectionHeader>
                    <tr className="bg-gray-100">
                        <td>
                            <div className="grid grid-cols-2">
                                <div className="col-span-1 border-r font-semibold">Deduction Type</div>
                                <div className="col-span-1 pl-2 font-semibold">Percentage</div>
                            </div>
                        </td>
                        <td className="font-semibold text-center">Comments</td>
                        <td>
                            <div className="grid grid-cols-4">
                                <div className="col-span-1 font-semibold">Floor Area</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Unit Cost</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Deduction</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Amount</div>
                            </div>
                        </td>
                    </tr>
                    {getSelectedDeductionsWithData().map((deduction, index) => (
                        <tr key={deduction.id}>
                            <td>
                                <div className="grid grid-cols-2">
                                    <div className="col-span-1 border-r">{deduction.name}</div>
                                    <div className="col-span-1 pl-2">{deduction.percentage}%</div>
                                </div>
                            </td>
                            {index === 0 && (
                                <td rowSpan={getSelectedDeductionsWithData().length + 1}>
                                    {deductionComments}
                                </td>
                            )}
                            <td>
                                <div className="grid grid-cols-4">
                                    <div className="col-span-1">{totalFloorArea || '—'} sqm</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(unitCost)}</div>
                                    <div className="col-span-1 border-l pl-2">{deduction.percentage}%</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(deduction.calculatedValue)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {getSelectedDeductionsWithData().length === 0 && (
                        <tr>
                            <td>
                                <div className="grid grid-cols-2">
                                    <div className="col-span-1 border-r">No deductions selected</div>
                                    <div className="col-span-1 pl-2">—</div>
                                </div>
                            </td>
                            <td>
                                {deductionComments || '—'}
                            </td>
                            <td>
                                <div className="grid grid-cols-4">
                                    <div className="col-span-1">{totalFloorArea || '—'} sqm</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(unitCost)}</div>
                                    <div className="col-span-1 border-l pl-2">—</div>
                                    <div className="col-span-1 border-l pl-2">₱0.00</div>
                                </div>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>
                            <div className="grid grid-cols-2">
                                <div className="col-span-1 border-r font-bold">TOTAL</div>
                                <div className="col-span-1 pl-2 font-bold">
                                    {getSelectedDeductionsWithData().reduce((sum, d) => sum + d.percentage, 0)}%
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className="grid grid-cols-4">
                                <div className="col-span-1">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2 font-bold">₱{formatCurrency(standardDeductionTotal)}</div>
                            </div>
                        </td>
                    </tr>
                    <tr className="no-border">
                        <td className="font-bold">Unit Construction:</td>
						<td></td>
						<td>
							<div className="grid grid-cols-4">
								<div className="col-span-2 font-bold text-center border-r border-black">Cost of Deduction:</div>
								<div className="col-span-2 font-bold text-right">Total</div>
							</div>
						</td>
                        {/* <td className="font-bold text-right">Cost of Deduction:</td>
                        <td className="font-bold text-right">TOTAL</td> */}
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <SectionHeader colSpan={2}>Additional Items:</SectionHeader>
                    <tr className="bg-gray-100">
                        <td className="font-semibold">Description</td>
                        <td>
                            <div className="grid grid-cols-4">
                                <div className="col-span-1 font-semibold">Area (sqm)</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Percentage/Unit Cost</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Rate</div>
                                <div className="col-span-1 border-l pl-2 font-semibold">Amount</div>
                            </div>
                        </td>
                    </tr>
                    {/* Percentage-based Additional Items */}
                    {getSelectedAdditionalPercentageItemsWithData().map((item, index) => (
                        <tr key={`percentage-${item.id}`}>
                            <td>{item.name}</td>
                            <td>
                                <div className="grid grid-cols-4">
                                    <div className="col-span-1">{item.area} sqm</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(unitCost)}</div>
                                    <div className="col-span-1 border-l pl-2">{item.percentage}%</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(item.calculatedValue)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {/* Flat Rate Additional Items */}
                    {getSelectedAdditionalFlatRateItemsWithData().map((item, index) => (
                        <tr key={`flatrate-${item.id}`}>
                            <td>{item.name}</td>
                            <td>
                                <div className="grid grid-cols-4">
                                    <div className="col-span-1">{item.area} sqm</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(item.pricePerSqm)}</div>
                                    <div className="col-span-1 border-l pl-2">per sqm</div>
                                    <div className="col-span-1 border-l pl-2">₱{formatCurrency(item.calculatedValue)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {/* Show message if no additional items selected */}
                    {getSelectedAdditionalPercentageItemsWithData().length === 0 && getSelectedAdditionalFlatRateItemsWithData().length === 0 && (
                        <tr>
                            <td>No additional items selected</td>
                            <td>
                                <div className="grid grid-cols-4">
                                    <div className="col-span-1">—</div>
                                    <div className="col-span-1 border-l pl-2">—</div>
                                    <div className="col-span-1 border-l pl-2">—</div>
                                    <div className="col-span-1 border-l pl-2">₱0.00</div>
                                </div>
                            </td>
                        </tr>
                    )}
                    {/* Total row for additional items */}
                    <tr className="bg-gray-50">
                        <td className="font-bold">TOTAL ADD. ITEMS</td>
                        <td>
                            <div className="grid grid-cols-4">
                                <div className="col-span-1 font-bold">
                                    {[...getSelectedAdditionalPercentageItemsWithData(), ...getSelectedAdditionalFlatRateItemsWithData()]
                                        .reduce((sum, item) => sum + item.area, 0)} sqm
                                </div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2 font-bold">
                                    ₱{formatCurrency([
                                        ...getSelectedAdditionalPercentageItemsWithData(), 
                                        ...getSelectedAdditionalFlatRateItemsWithData()
                                    ].reduce((sum, item) => sum + item.calculatedValue, 0))}
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>Depreciation</td>
                        <td>
                            <div className="grid grid-cols-4">
                                <div className="col-span-1">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                                <div className="col-span-1 border-l pl-2">—</div>
                            </div>
                        </td>
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

                    <tr data-field="actual_use market_value assessment_level assessed_value">
                        <td className="font-bold">Residential</td>
                        <td className="font-bold">₱{formatCurrency(marketValue)}</td>
                        <td className="font-bold">{assessmentLevel}</td>
                        <td className="font-bold">₱{formatCurrency(assessedValue)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Unit Construction Cost */}
            <table>
                <tbody>
                    <tr>
                        <td colSpan={2} className="font-bold">Unit Construction Cost: ₱{formatCurrency(unitCost)}</td>
                        <td colSpan={2} className="font-bold">Cost of Deductions: ₱{formatCurrency(standardDeductionTotal)}</td>
                    </tr>

                    <tr>
                        <td>Depreciation:</td>
                        <td>in %</td>
                        <td>Depreciation + Deduction</td>
                        <td>Amount</td>
                    </tr>

                    <tr>
                        <td>Net Unit Cost:</td>
                        <td>₱{formatCurrency(netUnitCost)}</td>
                        <td>Market Value:</td>
                        <td>₱{formatCurrency(marketValue)}</td>
                    </tr>
                </tbody>
            </table>

            <FaasFooter amountInWords={amountInWords} />
        </div>
    );
};

export default BuildingStructureForm;