import { BUILDING_TYPES } from "@/config/form-options";

const getBuildingTypeId = (label: string): string | null => {
  const match = BUILDING_TYPES.find((item) => item.label === label);
  return match ? match.id : null;
};

export const getUnitConstructionCost = (
  typeOfBuildingLabel: string,
  structureType: string
): string | null => {
  const buildingTypeId = getBuildingTypeId(typeOfBuildingLabel);

  if (buildingTypeId === "building_type_1" && structureType === "Type V-A") {
    return "9950";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type V-A") {
    return "11550";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type V-A") {
    return "11780";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type V-A") {
    return "8670";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type V-A") {
    return "9880";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type V-A") {
    return "16560";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type V-A") {
    return "8530";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type V-A") {
    return "5680";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type V-A") {
    return "5470";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type V-A") {
    return "4970";
  }

//TYPE V-B
  if (buildingTypeId === "building_type_1" && structureType === "Type V-B") {
    return "8900";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type V-B") {
    return "10990";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type V-B") {
    return "10660";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type V-B") {
    return "7630";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type V-B") {
    return "8890";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type V-B") {
    return "14750";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type V-B") {
    return "7840";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type V-B") {
    return "5080";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type V-B") {
    return "4670";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type V-B") {
    return "0";
  }

//TYPE V-C
  if (buildingTypeId === "building_type_1" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type V-C") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type V-C") {
    return "0";
  }

  //TYPE IV-A
  if (buildingTypeId === "building_type_1" && structureType === "Type IV-A") {
    return "8170";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type IV-A") {
    return "9690";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type IV-A") {
    return "9940";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type IV-A") {
    return "6330";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type IV-A") {
    return "8250";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type IV-A") {
    return "13300";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type IV-A") {
    return "7570";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type IV-A") {
    return "4830";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type IV-A") {
    return "4140";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type IV-A") {
    return "0";
  }
  
//TYPE IV-B
  if (buildingTypeId === "building_type_1" && structureType === "Type IV-B") {
    return "7200";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type IV-B") {
    return "8270";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type IV-B") {
    return "8490";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type IV-B") {
    return "8450";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type IV-B") {
    return "6400";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type IV-B") {
    return "12130";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type IV-B") {
    return "6850";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type IV-B") {
    return "4600";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type IV-B") {
    return "3680";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type IV-B") {
    return "0";
  }

//TYPE III-AB
  if (buildingTypeId === "building_type_1" && structureType === "Type III-AB") {
    return "4960";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type III-AB") {
    return "5600";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type III-AB") {
    return "6150";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type III-AB") {
    return "3840";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type III-AB") {
    return "4120";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type III-AB") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type III-AB") {
    return "4320";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type III-AB") {
    return "3890";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type III-AB") {
    return "2320";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type III-AB") {
    return "0";
  }

//TYPE III-CD
  if (buildingTypeId === "building_type_1" && structureType === "Type III-CD") {
    return "3870";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type III-CD") {
    return "4470";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type III-CD") {
    return "4970";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type III-CD") {
    return "2800";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type III-CD") {
    return "3450";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type III-CD") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type III-CD") {
    return "3360";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type III-CD") {
    return "3110";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type III-CD") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type III-CD") {
    return "0";
  }

//TYPE III-E
  if (buildingTypeId === "building_type_1" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type III-E") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type III-E") {
    return "0";
  }
//TYPE II-A
  if (buildingTypeId === "building_type_1" && structureType === "Type II-A") {
    return "2360";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type II-A") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type II-A") {
    return "0";
  }
//TYPE II-B
  if (buildingTypeId === "building_type_1" && structureType === "Type II-B") {
    return "1520";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type II-B") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type II-B") {
    return "0";
  }

  //TYPE I
  if (buildingTypeId === "building_type_1" && structureType === "Type I") {
    return "970";
  }
  if (buildingTypeId === "building_type_2" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_3" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_4" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_5" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_6" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_7" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_8" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_9" && structureType === "Type I") {
    return "0";
  }
  if (buildingTypeId === "building_type_10" && structureType === "Type I") {
    return "0";
  }


  return null;
};
