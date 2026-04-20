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
      {title && (
        <div className="px-4 py-3 bg-primary/8 border-b border-primary/20">
          <h2 className="rpfaas-fill-section-title text-sm text-foreground">{title}</h2>
        </div>
      )}
      <div className={cn("flex flex-col gap-4 p-4", !title && "pt-4")}>
        {children}
      </div>
    </section>
  );
}
