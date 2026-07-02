import type { AttachmentConfig, AttachmentType } from "@/utils/faas-attachment-rules";

const TRANSACTION_MEMORANDA_LABELS: Record<string, string> = {
  DC: "NEW",
  TR: "TRANSFER",
  SD: "SUBDIVISION",
  CS: "CONSOLIDATION",
  PC: "PHYSICAL CHANGE",
  RC: "REASSESSMENT",
  DM: "DEMOLITION",
  GR: "GENERAL REVISION",
  DP: "DEPRECIATION",
};

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildMemorandaFromAttachments<TType extends AttachmentType>({
  transactionCode,
  attachmentConfigs,
  uploadedTypes,
}: {
  transactionCode?: string | null;
  attachmentConfigs: AttachmentConfig<TType>[] | null;
  uploadedTypes: TType[];
}) {
  if (!attachmentConfigs || uploadedTypes.length === 0) return "";

  const uploaded = new Set(uploadedTypes);
  const attachmentLabels = attachmentConfigs
    .filter((config) => uploaded.has(config.type))
    .map((config) => config.memorandaLabel);

  const attachmentText = formatList(attachmentLabels);
  if (!attachmentText) return "";

  const transactionLabel = transactionCode
    ? TRANSACTION_MEMORANDA_LABELS[transactionCode]
    : "";
  const prefix = transactionLabel ? `${transactionLabel} - ` : "";

  return `${prefix}Supported by ${attachmentText}.`;
}

export function mergeAttachmentMemoranda({
  attachmentMemoranda,
  existingMemoranda,
}: {
  attachmentMemoranda: string;
  existingMemoranda?: string | null;
}) {
  const attachmentText = attachmentMemoranda.trim();
  const existingText = (existingMemoranda ?? "").trim();

  if (!attachmentText) return existingText;
  if (!existingText) return attachmentText;
  if (existingText.toLowerCase() === attachmentText.toLowerCase()) {
    return existingText;
  }

  const generatedLinePattern =
    /^(?:(?:NEW|TRANSFER|SUBDIVISION|CONSOLIDATION|PHYSICAL CHANGE|REASSESSMENT|DEMOLITION|GENERAL REVISION|DEPRECIATION)\s*-\s*)?Supported by .+\.$/i;

  const lines = existingText.split(/\r?\n/);
  if (generatedLinePattern.test(lines[0] ?? "")) {
    return [attachmentText, ...lines.slice(1)].join("\n").trim();
  }

  return `${attachmentText}\n\n${existingText}`;
}
