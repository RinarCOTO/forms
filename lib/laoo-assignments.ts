import { normalizeMunicipality } from '@/lib/faas/municipality';

export const LAOO_ASSIGNMENT_TABLE = 'laoo_municipality_assignments';

export const LAOO_ASSIGNABLE_MUNICIPALITIES = [
  'barlig',
  'bauko',
  'besao',
  'bontoc',
  'natonin',
  'paracellis',
  'sabangan',
  'sagada',
  'sadanga',
  'tadian',
] as const;

const VALID_MUNICIPALITIES = new Set<string>(LAOO_ASSIGNABLE_MUNICIPALITIES);

type AssignmentRow = {
  user_id: string;
  municipality: string | null;
};

type SupabaseFromClient = {
  from: (table: string) => any;
};

function isMissingAssignmentTableError(error: { code?: string; message?: string }) {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /laoo_municipality_assignments/i.test(error.message ?? '')
  );
}

export function normalizeAssignmentMunicipalities(
  values: Array<string | null | undefined>,
  fallback?: string | null,
) {
  const normalized = values
    .map((value) => normalizeMunicipality(value))
    .filter((value): value is string => value !== null && VALID_MUNICIPALITIES.has(value));

  if (normalized.length === 0) {
    const fallbackValue = normalizeMunicipality(fallback);
    if (fallbackValue && VALID_MUNICIPALITIES.has(fallbackValue)) {
      normalized.push(fallbackValue);
    }
  }

  return [...new Set(normalized)];
}

export function parseAssignmentMunicipalities(value: unknown) {
  if (value === undefined || value === null || value === '') return [];
  const values = Array.isArray(value) ? value : [value];
  const invalid = values.some(
    (item) =>
      typeof item !== 'string' ||
      !VALID_MUNICIPALITIES.has(normalizeMunicipality(item) ?? ''),
  );

  if (invalid) return null;
  return normalizeAssignmentMunicipalities(values as string[]);
}

export function getPrimaryMunicipality(values: string[]) {
  return values[0] ?? null;
}

export async function getLaooAssignmentsForUsers(
  admin: SupabaseFromClient,
  userIds: string[],
  fallbackByUserId = new Map<string, string | null>(),
) {
  const assignmentsByUser = new Map<string, string[]>();
  if (userIds.length === 0) return assignmentsByUser;

  const { data, error } = await admin
    .from(LAOO_ASSIGNMENT_TABLE)
    .select('user_id, municipality')
    .in('user_id', userIds);

  if (error) {
    if (!isMissingAssignmentTableError(error)) throw error;
    for (const userId of userIds) {
      assignmentsByUser.set(
        userId,
        normalizeAssignmentMunicipalities([], fallbackByUserId.get(userId)),
      );
    }
    return assignmentsByUser;
  }

  for (const row of (data ?? []) as AssignmentRow[]) {
    const current = assignmentsByUser.get(row.user_id) ?? [];
    assignmentsByUser.set(
      row.user_id,
      normalizeAssignmentMunicipalities([...current, row.municipality]),
    );
  }

  for (const userId of userIds) {
    assignmentsByUser.set(
      userId,
      normalizeAssignmentMunicipalities(
        assignmentsByUser.get(userId) ?? [],
        fallbackByUserId.get(userId),
      ),
    );
  }

  return assignmentsByUser;
}

export async function getLaooAssignmentsForUser(
  admin: SupabaseFromClient,
  userId: string,
  fallback?: string | null,
) {
  const assignmentsByUser = await getLaooAssignmentsForUsers(
    admin,
    [userId],
    new Map([[userId, fallback ?? null]]),
  );
  return assignmentsByUser.get(userId) ?? [];
}
