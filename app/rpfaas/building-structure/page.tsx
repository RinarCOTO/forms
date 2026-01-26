import { redirect } from "next/navigation";

export default function BuildingStructurePage() {
  // Redirect to fill page (step 1)
  redirect("/rpfaas/building-structure/fill");
}
