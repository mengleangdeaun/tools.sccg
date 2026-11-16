import * as React from "react";
import { Inbox, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** A button or link, e.g. "Clear filters" or the page's create button. */
  action?: React.ReactNode;
  /** "sm" for narrow places like board columns and drawer tabs. */
  size?: "sm" | "md";
}

export function EmptyState({ icon, title, description, action, size = "md" }: EmptyStateProps) {
  const small = size === "sm";
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", small ? "gap-2 px-2 py-6" : "gap-3 px-4 py-12")}>
      <div
        aria-hidden
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          small ? "size-9 [&_svg]:size-4" : "size-12 [&_svg]:size-6"
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className={cn("mx-auto max-w-sm text-muted-foreground", small ? "text-xs" : "text-sm")}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Filters or search matched nothing. */
export function NoResults({
  onClear,
  description = "Nothing matches these filters. Try different ones, or clear them.",
  size,
}: {
  onClear: () => void;
  description?: string;
  size?: "sm" | "md";
}) {
  return (
    <EmptyState
      icon={<SearchX />}
      title="No results"
      description={description}
      size={size}
      action={
        <Button variant="outline" size="sm" onClick={onClear} className="h-10 md:h-8">
          Clear filters
        </Button>
      }
    />
  );
}

/** Nothing has been created yet. */
export function NoData({
  icon = <Inbox />,
  ...props
}: Omit<EmptyStateProps, "icon"> & { icon?: React.ReactNode }) {
  return <EmptyState icon={icon} {...props} />;
}
