import * as React from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Taller controls on phones, for touch. */
export const CONTROL_HEIGHT = "h-11 md:h-9";

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function FieldRow({ columns = 2, children }: { columns?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>{children}</div>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  /** A longer explanation behind a (?) button next to the label, for fields too narrow for a hint. */
  help?: React.ReactNode;
  children: React.ReactNode;
}

// Opens on click or tap, unlike a hover tooltip, so it works on touch screens too.
function FieldHelp({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`About ${label}`}
        className="-my-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <CircleHelp className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 gap-1 p-3 text-xs leading-relaxed">
        <p className="font-medium text-foreground">{label}</p>
        <div className="text-muted-foreground">{children}</div>
      </PopoverContent>
    </Popover>
  );
}

export function Field({ label, htmlFor, required, hint, help, children }: FieldProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <Label htmlFor={htmlFor} className="text-sm font-medium whitespace-nowrap text-foreground">
            {label}
            {required && <span aria-hidden className="text-destructive">*</span>}
          </Label>
          {help && <FieldHelp label={label}>{help}</FieldHelp>}
        </span>
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      {children}
    </div>
  );
}

/** Footer actions: side by side on desktop, full width and primary-first on phones. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end [&>*]:h-11 md:[&>*]:h-9">{children}</div>;
}

interface FormFooterProps {
  /** The id of the <form> in the dialog body; the submit button sits outside it, in the fixed footer. */
  formId: string;
  submitLabel: string;
  onCancel: () => void;
  submitting?: boolean;
  disabled?: boolean;
  error?: string | null;
}

/** Dialog footer for forms: inline error, then Cancel + submit. Pass it as ResponsiveModal's `footer`. */
export function FormFooter({ formId, submitLabel, onCancel, submitting, disabled, error }: FormFooterProps) {
  return (
    <div className="space-y-3">
      {error && <FormError>{error}</FormError>}
      <FormActions>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={submitting || disabled}>
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </FormActions>
    </div>
  );
}

interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ToggleChip({ active, onClick, children }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-input text-muted-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  );
}
