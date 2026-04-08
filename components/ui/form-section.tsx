import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  commentField?: string;
  className?: string;
}

export function FormSection({
  title,
  children,
  commentField,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn("rpfaas-fill-section", className)}
      {...(commentField ? { "data-comment-field": commentField } : {})}
    >
      {title && <h2 className="rpfaas-fill-section-title mb-4">{title}</h2>}
      {children}
    </section>
  );
}
