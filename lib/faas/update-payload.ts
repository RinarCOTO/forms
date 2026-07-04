const DEFAULT_PROTECTED_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "submitted_at",
  "approved_at",
  "municipal_reviewer_id",
  "provincial_reviewer_id",
  "laoo_reviewer_id",
]);

interface SanitizeFaasUpdatePayloadOptions {
  allowedStatusUpdates?: string[];
  numericFields?: string[];
  arrayFields?: string[];
  protectedFields?: Set<string>;
}

export function sanitizeFaasUpdatePayload(
  raw: Record<string, unknown>,
  {
    allowedStatusUpdates = ["draft", "returned"],
    numericFields = [],
    arrayFields = [],
    protectedFields = DEFAULT_PROTECTED_FIELDS,
  }: SanitizeFaasUpdatePayloadOptions = {}
) {
  const numericFieldSet = new Set(numericFields);
  const arrayFieldSet = new Set(arrayFields);
  const sanitized: Record<string, unknown> = {};

  Object.entries(raw).forEach(([key, value]) => {
    if (protectedFields.has(key)) return;
    if (value === undefined || value === "undefined" || value === "") return;

    if (key === "status") {
      if (allowedStatusUpdates.includes(String(value))) sanitized.status = value;
      return;
    }

    if (value === null) {
      sanitized[key] = null;
      return;
    }

    if (numericFieldSet.has(key)) {
      const numberValue = typeof value === "string" ? parseFloat(value) : value;
      if (typeof numberValue === "number" && !Number.isNaN(numberValue)) {
        sanitized[key] = numberValue;
      }
      return;
    }

    if (arrayFieldSet.has(key) && Array.isArray(value)) {
      sanitized[key] = value.filter((item) => item !== "" && item !== null);
      return;
    }

    sanitized[key] = value;
  });

  return sanitized;
}
