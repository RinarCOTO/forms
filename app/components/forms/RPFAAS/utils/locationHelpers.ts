import type { Location } from "@/app/types/rpfaas";

export const getLocationName = (
    code: string | null,
    list: Location[]
): string => {
    if (!code) return "";
    const found = list.find((item) => item.code === code);
    return found ? found.name : "";
};
