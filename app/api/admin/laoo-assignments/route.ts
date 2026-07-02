import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ASSIGNMENT_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "provincial_assessor",
  "assistant_provincial_assessor",
];

const MUNICIPALITIES = [
  "barlig",
  "bauko",
  "besao",
  "bontoc",
  "natonin",
  "paracellis",
  "sabangan",
  "sagada",
  "sadanga",
  "tadian",
] as const;

const LAOO_LEVELS = [1, 2, 3, 4] as const;

type Municipality = (typeof MUNICIPALITIES)[number];
type LaooLevel = (typeof LAOO_LEVELS)[number];

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: "public" } }
  );
}

async function getCurrentUserRole() {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) return null;

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!profile?.role) return null;
  return { userId: authUser.id, role: profile.role as string };
}

function isAllowedRole(role: string) {
  return ASSIGNMENT_ADMIN_ROLES.includes(role);
}

function parseMunicipality(value: unknown): Municipality | null {
  if (value === null || value === "") return null;
  return typeof value === "string" && MUNICIPALITIES.includes(value as Municipality)
    ? (value as Municipality)
    : null;
}

function parseLaooLevel(value: unknown): LaooLevel | null {
  if (value === null || value === "") return null;
  const number = Number(value);
  return LAOO_LEVELS.includes(number as LaooLevel) ? (number as LaooLevel) : null;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUserRole();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAllowedRole(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from("users")
      .select("id, email, full_name, role, municipality, laoo_level, is_active, updated_at")
      .eq("role", "laoo")
      .order("full_name", { ascending: true, nullsFirst: false })
      .order("email", { ascending: true });

    if (error) {
      console.error("GET /api/admin/laoo-assignments error:", error.message);
      return NextResponse.json({ error: "Failed to load LAOO assignments" }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch (error) {
    console.error("GET /api/admin/laoo-assignments unexpected:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserRole();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAllowedRole(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    const hasMunicipalityInput = body.municipality !== undefined;
    const hasLaooLevelInput = body.laoo_level !== undefined;
    const municipality = parseMunicipality(body.municipality);
    const laooLevel = parseLaooLevel(body.laoo_level);

    if (!userId) {
      return NextResponse.json({ error: "LAOO user is required" }, { status: 400 });
    }
    if (hasMunicipalityInput && body.municipality !== null && body.municipality !== "" && !municipality) {
      return NextResponse.json({ error: "Invalid municipality" }, { status: 400 });
    }
    if (hasLaooLevelInput && body.laoo_level !== null && body.laoo_level !== "" && !laooLevel) {
      return NextResponse.json({ error: "Invalid LAOO level" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: targetUser, error: targetError } = await admin
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "LAOO user not found" }, { status: 404 });
    }
    if (targetUser.role !== "laoo") {
      return NextResponse.json({ error: "Only LAOO users can be assigned here" }, { status: 400 });
    }

    const { data: updatedUser, error: updateError } = await admin
      .from("users")
      .update({
        municipality,
        laoo_level: laooLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("id, email, full_name, role, municipality, laoo_level, is_active, updated_at")
      .single();

    if (updateError) {
      console.error("PATCH /api/admin/laoo-assignments error:", updateError.message);
      return NextResponse.json({ error: "Failed to update LAOO assignment" }, { status: 500 });
    }

    revalidateTag(`permissions-${userId}`, "max");

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/admin/laoo-assignments unexpected:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
