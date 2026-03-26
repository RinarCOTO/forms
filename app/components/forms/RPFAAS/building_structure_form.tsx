"use client";

import "@/app/components/forms/RPFAAS/faas_table_forms.css";
import FaasFooter from "./faas-footer";
import { SectionHeader } from "./components/SectionHeader";
import { Checkbox } from "./components/Checkbox";
import { useRPFAASData } from "./hooks/useRPFAASData";
import { STRUCTURAL_MATERIAL_ROWS } from "./constants/structuralMaterials";
import type { RoofMaterials } from "@/app/types/rpfaas";
import { DEDUCTION_CHOICES, ADDITIONAL_PERCENT_CHOICES, ADDITIONAL_FLAT_RATE_CHOICES } from "@/config/form-options";

const BuildingStructureForm = ({ serverData }: { serverData?: Record<string, any> }) => {
    const {
        transactionCode,
        arpNo,
        octTctCloaNo,
        pin,
        surveyNo,
        lotNo,
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
        deductionAmounts,
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
        taxStatus,
        actualUse,
        assessmentLevel,
        assessedValue,
        amountInWords,
        effectivityOfAssessment,
        appraisedById,
        municipalReviewerId,
        provincialReviewerId,
        memoranda,
        isLoaded,
    } = useRPFAASData(serverData);

    const storeys = parseInt(String(numberOfStoreys)) || 0;
    const ordSuffix = (n: number) => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    const displayLevels = Math.max(4, storeys);
    const levelColPct = `${Math.floor(20 / displayLevels)}%`;

    // Get the deductions with their percentages and calculated values
    const getSelectedDeductionsWithData = () => {
        return selectedDeductions.map(deductionId => {
            const deduction = DEDUCTION_CHOICES.find(d => d.id === deductionId);
            if (deduction) {
                // Prefer stored amount from step 4; fall back to recomputation for old records
                const storedAmount = deductionAmounts[deductionId];
                const calculatedValue = storedAmount !== undefined
                    ? storedAmount
                    : (baseCost * deduction.percentage) / 100;
                return { ...deduction, calculatedValue };
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
        <div className="rpfaas-print print:mt-2 flex flex-col min-h-full" style={{ backgroundColor: 'white' }} data-print-ready={isLoaded ? "true" : undefined}>
            <h1 className="text-2xl font-bold text-center uppercase">
                Real Property Field Appraisal &amp; Assessment Sheet - Building &amp; Other structures
            </h1>

            {/* Basic Information */}
            {/* prettier-ignore */}
            <table>
                <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '28%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '28%' }} />
                </colgroup>
                <tbody>
                    <tr className="text-right">
                        <td colSpan={4} className="pr-4">
                            Transaction Code:{" "}
                            <span className="font-bold">{transactionCode || ''}</span>
                        </td>
                    </tr>

                    <tr>
                        <td>ARP No.:</td>
                        <td className="font-bold font-mono">{arpNo || ''}</td>
                        <td>PIN:</td>
                        <td className="font-bold">{pin || ''}</td>
                    </tr>

                    <tr>
                        <td>OCT/TCT/CLOA No.</td>
                        <td className="font-bold">{octTctCloaNo || ''}</td>
                        <td>Dated:</td>
                        <td></td>
                    </tr>

                    <tr className="border-b-2">
                        <td>Survey No.</td>
                        <td className="font-bold">{surveyNo || ''}</td>
                        <td>Lot No.</td>
                        <td className="font-bold">{lotNo || ''}</td>
                    </tr>
                    <tr className="bordered-table" data-field="owner_name">
                        <td>Owner:</td>
                        <td colSpan={3} className="font-bold uppercase">{ownerName || ''}</td>
                    </tr>

                    <tr data-field="owner_address">
                        <td>Address:</td>
                        <td colSpan={3}>
                            {[ownerAddressBarangay, ownerAddressMunicipality, ownerAddressProvince].filter(Boolean).join(", ") || ''}
                        </td>
                    </tr>

                    <tr data-field="admin_care_of">
                        <td>Administration/Care of:</td>
                        <td className="capitalize" colSpan={3}>{adminCareOfName || ''}</td>
                    </tr>

                    <tr className="border-b-2">
                        <td>Address:</td>
                        <td colSpan={3}>
                             {[adminBarangayName, adminMunicipalityName, adminProvinceName].filter(Boolean).join(", ") || ''}
                        </td>
                    </tr>
                </tbody>
            </table>

            <table>
                <colgroup>
                    <col style={{ width: '33%' }} />
                    <col style={{ width: '33%' }} />
                    <col style={{ width: '33%' }} />
                </colgroup>
                <tbody>
                    <SectionHeader>LOCATION OF PROPERTY</SectionHeader>
                    <tr className="border-t-2" data-field="location_municipality">
                        <td>No/Street/Sitio:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-2 divide-x divide-black items-stretch h-full">
                                <div className="font-bold self-stretch flex items-center">{locationStreet || ''}</div>
                                <div className="text-right self-stretch flex items-center justify-end ">Municipality:</div>
                            </div>
                        </td>
                        <td className="font-bold capitalize">{locationMunicipality || ''}</td>
                    </tr>

                    <tr className="border-b-2 border-black" data-field="location_barangay location_province">
                        <td>Barangay:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-2 divide-x divide-black items-stretch h-full">
                                <div className="font-bold self-stretch flex items-center">{locationBarangay || ''}</div>
                                <div className="text-right self-stretch flex items-center justify-end">Province:</div>
                            </div>
                        </td>
                        <td className="font-bold">{locationProvince || ''}</td>
                    </tr>

                    {/* REST OF THE FORM REMAINS UNCHANGED */}
                    <SectionHeader className="p-0!">
                        <div className="flex">
                            <div className="flex-2 px-2 py-1 form-table-header">
                                GENERAL DESCRIPTION
                            </div>
                            <div className="flex-1 text-center border-l border-black px-1 py-1">
                                LAND REFERENCE
                            </div>
                        </div>
                    </SectionHeader>

                    <tr className="border-t-2" data-field="type_of_building building_age">
                        <td >Type of Bldg:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{typeOfBuilding ? typeOfBuilding.split(" - ")[0] : ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">Bldg. Age:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{buildingAge ? `${buildingAge} years` : ''}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center self-stretch rpfaas-print-small-1 font-bold col-span-1">Land Owner:</div>
                                <div className="flex items-center self-stretch col-span-2 rpfaas-print-small">{landOwner || ''}</div>
                            </div>
                        </td>
                    </tr>

                    <tr className="py-auto my-auto" data-field="structure_type number_of_storeys td_arp_no">
                        <td>Structural Type:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{structuralType || ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">No. of Storey:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{numberOfStoreys || ''}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center self-stretch rpfaas-print-small-1 font-bold col-span-1">TD/ARP No.:</div>
                                <div className="flex items-center self-stretch col-span-2 rpfaas-print-small">{landTdArpNo || ''}</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="building_permit_no land_area">
                        <td>Building Permit No.</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{buildingPermitNo || ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">1<sup>{ordSuffix(1)}</sup> Floor Area:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{storeys >= 1 ? floorAreas[0] || '' : ''}</div>
                            </div>
                        </td>
                        <td className="land-reference">
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="flex items-center self-stretch rpfaas-print-small-1 font-bold col-span-1">Area:</div>
                                <div className="flex items-center self-stretch col-span-2 rpfaas-print-small">{landArea || ''} sqm</div>
                            </div>
                        </td>
                    </tr>

                    <tr data-field="cct">
                        <td>Condominium Certificate of Title (CCT):</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{cct || ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">2<sup>{ordSuffix(2)}</sup> Floor Area:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{storeys >= 2 ? floorAreas[1] || '' : ''}</div>
                            </div>
                        </td>
                        <td className="land-reference"></td>
                    </tr>

                    <tr data-field="completion_issued_on">
                        <td>Certificate of Completion Issued on:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{completionIssuedOn ? completionIssuedOn.slice(0, 4) : ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">3<sup>{ordSuffix(3)}</sup> Floor Area:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{storeys >= 3 ? floorAreas[2] || '' : ''}</div>
                            </div>
                        </td>
                        <td className="land-reference"></td>
                    </tr>

                    <tr data-field="date_constructed">
                        <td>Date Constructed/Completed:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{dateConstructed ? dateConstructed.slice(0, 4) : ''}</div>
                                <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">{storeys >= 4 ? <>4<sup>{ordSuffix(4)}</sup> Floor Area:</> : null}</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{storeys >= 4 ? floorAreas[3] || '' : ''}</div>
                            </div>
                        </td>
                        <td className="land-reference"></td>
                    </tr>

                    {storeys > 4 && Array.from({ length: storeys - 4 }, (_, i) => i + 5).map((n) => (
                        <tr key={`extra-floor-${n}`}>
                            <td></td>
                            <td>
                                <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                    <div className="self-stretch"></div>
                                    <div className="flex items-center self-stretch font-medium floor-area-print whitespace-nowrap">{n}<sup>{ordSuffix(n)}</sup> Floor Area:</div>
                                    <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{floorAreas[n - 1] || ''}</div>
                                </div>
                            </td>
                            <td className="land-reference"></td>
                        </tr>
                    ))}

                    <tr data-field="date_occupied total_floor_area">
                        <td className="font-bold">Date Occupied:</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-3 divide-x divide-black items-stretch h-full">
                                <div className="rpfaas-field-value self-stretch">{dateOccupied ? dateOccupied.slice(0, 4) : ''}</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">Total:</div>
                                <div className="flex items-center self-stretch font-bold rpfaas-print-small whitespace-nowrap">{totalFloorArea || ''} sqm</div>
                            </div>
                        </td>
                        <td className="land-reference"></td>
                    </tr>

                    <SectionHeader className="border-b-2 space-x-3" data-field="unit_cost">
                        <span>Unit Construction Cost:</span>
                        <span>₱{formatCurrency(unitCost)}</span>
                    </SectionHeader>

                    <tr>
                        <td colSpan={3}>
                            Attach the building plan or sketch of floor plan. A photograph may also be
                            attached if necessary.
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Structural Materials */}
            <table>
                <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "18%" }} />
                    {Array.from({ length: displayLevels }, (_, i) => (
                        <col key={`col-floor-${i}`} style={{ width: levelColPct }} />
                    ))}
                    <col style={{ width: "18%" }} />
                    {Array.from({ length: displayLevels }, (_, i) => (
                        <col key={`col-wall-${i}`} style={{ width: levelColPct }} />
                    ))}
                </colgroup>
                <tbody>
                    <SectionHeader colSpan={3 + displayLevels * 2} className="py-2 " data-field="roofing_material flooring_material wall_material">Structural Materials (checklists)</SectionHeader>
                    <tr>
                        <td className="font-bold w-50">ROOF</td>
                        <td className="font-bold w-38">FLOORING</td>
                        {Array.from({ length: displayLevels }, (_, i) => (
                            <td key={`floor-header-${i}`} className="text-center rpfaas-print-small">
                                {i < storeys ? <>{i + 1}<sup>{ordSuffix(i + 1)}</sup></> : ""}
                            </td>
                        ))}
                        <td className="font-bold w-32">WALLS</td>
                        {Array.from({ length: displayLevels }, (_, i) => (
                            <td key={`wall-header-${i}`} className="text-center rpfaas-print-small">
                                {i < storeys ? <>{i + 1}<sup>{ordSuffix(i + 1)}</sup></> : ""}
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
                                {Array.from({ length: displayLevels }, (_, i) => (
                                    <td key={`floor-x-${idx}-${i}`} className="text-center rpfaas-print-small">
                                        {flooringGrid[idx]?.[i] ? "X" : ""}
                                    </td>
                                ))}
                                <td>{row.walls}</td>
                                {Array.from({ length: displayLevels }, (_, i) => (
                                    <td key={`wall-x-${idx}-${i}`} className="text-center rpfaas-print-small">
                                        {wallsGrid[idx]?.[i] ? "X" : ""}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {/* Deductions Table */}
            <table>
                <colgroup>
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '20%' }} />
                </colgroup>
                <tbody>
                    <SectionHeader colSpan={4} data-field="selected_deductions">Deductions: (Use additional sheet if necessary)</SectionHeader>
                    {/* Header row */}
                    <tr className="bg-gray-100 text-xs font-semibold text-center">
                        <td>Description</td>
                        <td>Percentage</td>
                        <td>Comments</td>
                        <td>Deduction Cost</td>
                    </tr>
                    {getSelectedDeductionsWithData().length > 0 ? (
                        <>
                            {getSelectedDeductionsWithData().map((deduction, index) => (
                                <tr key={deduction.id}>
                                    <td>{deduction.name}</td>
                                    <td className="text-center">{deduction.percentage}%</td>
                                    {index === 0 && (
                                        <td rowSpan={getSelectedDeductionsWithData().length}>
                                            {deductionComments}
                                        </td>
                                    )}
                                    <td className="text-right">{formatCurrency(deduction.calculatedValue)}</td>
                                </tr>
                            ))}
                            {/* Total row — full 4 cells, not consumed by rowSpan */}
                            <tr className="font-bold">
                                <td>TOTAL</td>
                                <td className="text-center">
                                    {getSelectedDeductionsWithData().reduce((sum, d) => sum + d.percentage, 0)}%
                                </td>
                                <td></td>
                                <td className="text-right">{formatCurrency(standardDeductionTotal)}</td>
                            </tr>
                        </>
                    ) : (
                        <>
                            <tr>
                                <td>No deductions selected</td>
                                <td></td>
                                <td>{deductionComments || ''}</td>
                                <td className="text-right">₱0.00</td>
                            </tr>
                            <tr className="font-bold">
                                <td>TOTAL</td>
                                <td className="text-center">0%</td>
                                <td></td>
                                <td className="text-right">₱0.00</td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
            <table>
                <tbody>
                    <SectionHeader colSpan={2}>Additional Items:</SectionHeader>
                    <tr className="bg-gray-100">
                        <td className="font-semibold">Description</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                <div className="col-span-1 font-semibold self-stretch flex items-center">Area (sqm)</div>
                                <div className="col-span-1 font-semibold self-stretch flex items-center">Unit Cost</div>
                                <div className="col-span-1 font-semibold self-stretch flex items-center">Rate</div>
                                <div className="col-span-1 font-semibold self-stretch flex items-center">Amount</div>
                            </div>
                        </td>
                    </tr>
                    {/* Percentage-based Additional Items */}
                    {getSelectedAdditionalPercentageItemsWithData().map((item, index) => (
                        <tr key={`percentage-${item.id}`}>
                            <td>{item.name}</td>
                            <td>
                                <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                    <div className="col-span-1 self-stretch flex items-center">{item.area} sqm</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱{formatCurrency(unitCost)}</div>
                                    <div className="col-span-1 self-stretch flex items-center">{item.percentage}%</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱{formatCurrency(item.calculatedValue)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {/* Flat Rate Additional Items */}
                    {getSelectedAdditionalFlatRateItemsWithData().map((item, index) => (
                        <tr key={`flatrate-${item.id}`}>
                            <td>{item.name}</td>
                            <td>
                                <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                    <div className="col-span-1 self-stretch flex items-center">{item.area} sqm</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱{formatCurrency(item.pricePerSqm)}</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱{formatCurrency(item.pricePerSqm)}/sqm</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱{formatCurrency(item.calculatedValue)}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {/* Show message if no additional items selected */}
                    {getSelectedAdditionalPercentageItemsWithData().length === 0 && getSelectedAdditionalFlatRateItemsWithData().length === 0 && (
                        <tr>
                            <td>No additional items selected</td>
                            <td>
                                <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                    <div className="col-span-1 self-stretch flex items-center">—</div>
                                    <div className="col-span-1 self-stretch flex items-center">—</div>
                                    <div className="col-span-1 self-stretch flex items-center">—</div>
                                    <div className="col-span-1 self-stretch flex items-center">₱0.00</div>
                                </div>
                            </td>
                        </tr>
                    )}
                    {/* Total row for additional items */}
                    <tr className="bg-gray-50">
                        <td className="font-bold">TOTAL ADD. ITEMS</td>
                        <td>
                            <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                <div className="col-span-1 font-bold self-stretch flex items-center">
                                    {[...getSelectedAdditionalPercentageItemsWithData(), ...getSelectedAdditionalFlatRateItemsWithData()]
                                        .reduce((sum, item) => sum + item.area, 0)} sqm
                                </div>
                                <div className="col-span-1 font-bold self-stretch flex items-center"></div>
                                <div className="col-span-1 font-bold self-stretch flex items-center"></div>
                                <div className="col-span-1 font-bold self-stretch flex items-center">
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
                            <div className="rpfaas-inner-grid grid grid-cols-4 divide-x divide-black items-stretch h-full">
                                <div className="col-span-1 self-stretch flex items-center">—</div>
                                <div className="col-span-1 self-stretch flex items-center">—</div>
                                <div className="col-span-1 self-stretch flex items-center">—</div>
                                <div className="col-span-1 self-stretch flex items-center">—</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            {/* Property Assessment */}
            <table>
                <tbody>
                    <SectionHeader colSpan={4}>PROPERTY ASSESSMENT</SectionHeader>

                    <tr className="text-center">
                        <td>Actual Use</td>
                        <td>Market Value</td>
                        <td>Assessment Level</td>
                        <td>Assessed Value</td>
                    </tr>

                    <tr data-field="actual_use market_value assessment_level assessed_value text-center">
                        <td className="font-bold capitalize text-center">{actualUse || ''}</td>
                        <td className="font-bold text-center">₱{formatCurrency(marketValue)}</td>
                        <td className="font-bold text-center">{assessmentLevel}</td>
                        <td className="font-bold text-center">₱{formatCurrency(assessedValue)}</td>
                    </tr>
                </tbody>
            </table>

            <FaasFooter amountInWords={amountInWords} taxStatus={taxStatus} locationMunicipality={locationMunicipality} effectivityOfAssessment={effectivityOfAssessment} appraisedById={appraisedById} municipalReviewerId={municipalReviewerId} provincialReviewerId={provincialReviewerId} memoranda={memoranda} className="mt-auto" />
        </div>
    );
};

export default BuildingStructureForm;