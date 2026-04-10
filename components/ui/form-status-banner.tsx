"use client";

import { Lock, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatusMessages = {
  submitted: { title: string; message: string };
  under_review: { title: string; message: string };
  returned: { title: string; message: string };
  approved: { title: string; message: string };
};

type StatusKey = keyof StatusMessages;

type Props = {
  status: string;
  statusLoading: boolean;
  isPrintMode: boolean;
  messages: StatusMessages;
};

const STATUS_CONFIG: Record<StatusKey, { className: string; Icon: LucideIcon }> = {
  submitted: {
    className: "border-yellow-400/50 bg-yellow-50 text-yellow-800",
    Icon: Lock,
  },
  under_review: {
    className: "border-blue-400/50 bg-blue-50 text-blue-800",
    Icon: Lock,
  },
  returned: {
    className: "border-orange-400/50 bg-orange-50 text-orange-800",
    Icon: AlertTriangle,
  },
  approved: {
    className: "border-green-400/50 bg-green-50 text-green-800",
    Icon: Lock,
  },
};

const KNOWN_STATUSES = Object.keys(STATUS_CONFIG) as StatusKey[];

export function FormStatusBanner({ status, statusLoading, isPrintMode, messages }: Props) {
  if (statusLoading || isPrintMode) return null;
  if (!KNOWN_STATUSES.includes(status as StatusKey)) return null;

  const key = status as StatusKey;
  const { className, Icon } = STATUS_CONFIG[key];
  const { title, message } = messages[key];

  return (
    <div className="print:hidden mb-4">
      <div className={`flex items-center gap-2 rounded-md border ${className} px-4 py-3 text-sm`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>
          <strong>{title}</strong> {message}
        </span>
      </div>
    </div>
  );
}
