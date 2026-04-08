import { Lock } from "lucide-react";

interface FormLockBannerProps {
  locked: boolean;
  lockedBy: string | null;
}

export function FormLockBanner({ locked, lockedBy }: FormLockBannerProps) {
  if (!locked) return null;
  return (
    <div className="flex items-center gap-2 mb-4 rounded-md border border-yellow-400/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <Lock className="h-4 w-4 shrink-0" />
      <span>
        <strong>{lockedBy}</strong> is currently editing this form. You can view
        it but cannot make changes.
      </span>
    </div>
  );
}
