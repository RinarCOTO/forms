import { cn } from "@/lib/utils";

interface FormFieldProps {
  children: React.ReactNode;
  commentField?: string;
  className?: string;
}

/**
 * Wrapper div for a single form field (label + input pair).
 * Applies the standard `rpfaas-fill-field space-y-1` classes and
 * forwards the `data-comment-field` attribute used by ReviewCommentsFloat.
 *
 * Render the Label and input as children — this component only handles layout.
 *
 * @example
 * <FormField commentField="owner_name">
 *   <Label className="rpfaas-fill-label" htmlFor="owner_name">Owner Name</Label>
 *   <Input id="owner_name" className="rpfaas-fill-input" ... />
 * </FormField>
 */
export function FormField({ children, commentField, className }: FormFieldProps) {
  return (
    <div
      className={cn("rpfaas-fill-field space-y-1", className)}
      {...(commentField ? { "data-comment-field": commentField } : {})}
    >
      {children}
    </div>
  );
}
